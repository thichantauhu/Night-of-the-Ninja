import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import crypto from 'crypto';

const app = express();
app.use(express.static('public'));
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const rooms = new Map();

const phases = ['SPY','MYSTIC','TRICKSTER','BLIND ASSASSIN','SHINOBI'];
const honorValues = [2,3,4];

function id(){ return crypto.randomBytes(4).toString('hex'); }
function roomCode(){ let c; do c=Math.random().toString(36).slice(2,7).toUpperCase(); while(rooms.has(c)); return c; }
function send(ws, type, data={}){ if(ws.readyState===1) ws.send(JSON.stringify({type,...data})); }
function broadcast(room,type,data={}){ for(const p of room.players) send(p.ws,type,data); }
function publicPlayer(p){ return {id:p.id,name:p.name,alive:p.alive,connected:p.ws?.readyState===1,honor:p.honor}; }
function publicRoom(room){ return {code:room.code,status:room.status,phase:room.phase,players:room.players.map(publicPlayer),host:room.host,round:room.round,log:room.log.slice(-30)}; }
function broadcastState(room){ broadcast(room,'state',{room:publicRoom(room)}); for(const p of room.players) sendPrivate(room,p); }
function sendPrivate(room,p){ send(p.ws,'private',{house:p.house,rank:p.rank,hand:p.hand,selected:p.selected,known:p.known,alive:p.alive,honor:p.honor,targets:p.targets||[],draft:room.draft?.[p.id]||null}); }
function log(room,text){ room.log.push(text); }

function makeNinjaDeck(){
  const cards=[];
  for(let n=1;n<=6;n++) cards.push({id:id(),type:'SPY',num:n,text:'Xem House card của một người chơi.'});
  for(let n=1;n<=6;n++) cards.push({id:id(),type:'MYSTIC',num:n,text:'Xem House card của một người chơi.'});
  const tricks=[
    ['Shapeshifter','Đổi bí mật House của hai người chơi.', 'swap'],
    ['Gravedigger','Xem 2 lá Ninja đã bỏ và lấy 1 lá.', 'discard'],
    ['Troublemaker','Xem House của một người và có thể lộ nó.', 'reveal'],
    ['Spy Merchant','Xem Honor hoặc House của một người; có thể đổi 1 Honor.', 'honor'],
    ['Thief','Lộ House của mình và lấy 1 Honor từ người có nhiều hơn.', 'steal'],
    ['Judge','Lộ House của mình và chọn một người để giết.', 'kill']
  ];
  for(const [i,[name,text,effect]] of tricks.entries()) cards.push({id:id(),type:'TRICKSTER',num:i+1,name,text,effect});
  for(let n=1;n<=6;n++) cards.push({id:id(),type:'BLIND ASSASSIN',num:n,text:'Chọn người, xem House của họ rồi có thể giết.'});
  for(let n=1;n<=6;n++) cards.push({id:id(),type:'SHINOBI',num:n,text:'Chọn người và có thể giết; một số Shinobi có hiệu ứng Honor.'});
  cards.push({id:id(),type:'REACTION',name:'Mirror Monk',text:'Khi bị Shinobi/Blind Assassin chọn giết: giết ngược.',effect:'counter'});
  cards.push({id:id(),type:'REACTION',name:'Martyr',text:'Khi bị Shinobi/Blind Assassin chọn giết: nhận 1 Honor.',effect:'honor'});
  cards.push({id:id(),type:'REVEAL',name:'Mastermind',text:'Nếu sống đến Reveal, House của bạn thắng round.',effect:'mastermind'});
  return cards;
}
function setupHouse(count){
  const ranks=[]; for(let r=1;r<=Math.ceil(count/2);r++) ranks.push({house:'Crane',rank:r}); for(let r=1;r<=Math.floor(count/2);r++) ranks.push({house:'Lotus',rank:r});
  return ranks.sort(()=>Math.random()-0.5);
}
function startRound(room){
  room.status='draft'; room.round++; room.phase=null; room.nightQueue=[]; room.log=[]; room.draft={}; room.deck=makeNinjaDeck();
  const houses=setupHouse(room.players.length);
  room.players.forEach((p,i)=>{p.house=houses[i].house;p.rank=houses[i].rank;p.alive=true;p.hand=[];p.selected=null;p.known=[];p.targets=[];});
  // Deal 3 sequentially from shuffled deck.
  for(let i=0;i<room.players.length;i++) for(let j=0;j<3;j++) room.players[i].draftCards=(room.players[i].draftCards||[]).concat(room.deck.pop());
  for(const p of room.players) room.draft[p.id]=p.draftCards;
  log(room,`Round ${room.round} bắt đầu. Chia House bí mật và 3 Ninja card cho mỗi người.`);
  broadcastState(room);
}
function beginNight(room){
  for(const p of room.players){ p.hand = room.draft[p.id]?.filter(Boolean)||[]; p.draftCards=[]; p.selected=null; }
  room.status='night'; room.phaseIndex=0; room.phase=phases[0]; room.nightQueue=[];
  log(room,'The Night bắt đầu: SPY → MYSTIC → TRICKSTER → BLIND ASSASSIN → SHINOBI.');
  broadcastState(room);
}
function nextPhase(room){
  room.phaseIndex++;
  if(room.phaseIndex>=phases.length) return reveal(room);
  room.phase=phases[room.phaseIndex]; room.nightQueue=[]; log(room,`Chuyển sang ${room.phase}.`); broadcastState(room);
}
function reveal(room){
  room.status='reveal'; room.phase='HOUSE REVEAL';
  const alive=room.players.filter(p=>p.alive);
  const byHouse={Crane:[],Lotus:[]};
  alive.forEach(p=>byHouse[p.house].push(p));
  const best=h=>byHouse[h].sort((a,b)=>a.rank-b.rank);
  let winner=null;
  if(best('Crane').length && (!best('Lotus').length || best('Crane')[0].rank<best('Lotus')[0].rank)) winner='Crane';
  else if(best('Lotus').length && (!best('Crane').length || best('Lotus')[0].rank<best('Crane')[0].rank)) winner='Lotus';
  else if(best('Crane').length && best('Lotus').length){
    const a=best('Crane'),b=best('Lotus'); let i=0; while(i<Math.min(a.length,b.length)&&a[i].rank===b[i].rank)i++; if(i<Math.min(a.length,b.length)) winner=a[i].rank<b[i].rank?'Crane':'Lotus';
  }
  room.winner=winner;
  if(winner){ for(const p of room.players) if(p.house===winner) p.honor += honorValues[Math.floor(Math.random()*honorValues.length)]; log(room,`${winner} thắng round. Thành viên phe này nhận Honor.`); }
  else { for(const p of alive) p.honor += 2; log(room,'Round hòa: mỗi người còn sống nhận 2 Honor.'); }
  room.status='round_end'; broadcastState(room);
}
function kill(room,target,source){ if(!target||!target.alive) return false; target.alive=false; log(room,`${target.name} bị hạ bởi ${source?.name||'một Ninja'}.`); return true; }
function resolveCard(room,p,card,targetId){
  if(!p.alive && card.type!=='REACTION') return;
  const target=room.players.find(x=>x.id===targetId);
  if(card.type==='SPY'||card.type==='MYSTIC'){ if(target){p.known.push({playerId:target.id,name:target.name,house:target.house,rank:target.rank}); send(p.ws,'private',{known:p.known}); log(room,`${p.name} đã thực hiện ${card.type}.`);} }
  else if(card.type==='TRICKSTER'){
    if(card.effect==='reveal'&&target) log(room,`${p.name} lộ thông tin của ${target.name}: ${target.house} ${target.rank}.`);
    if(card.effect==='kill'&&target) kill(room,target,p);
    if(card.effect==='steal'&&target&&target.honor<p.honor){p.honor+=target.honor>0?1:0;target.honor=Math.max(0,target.honor-1);}
    log(room,`${p.name} dùng Trickster ${card.name}.`);
  } else if(card.type==='BLIND ASSASSIN'){ if(target){p.known.push({playerId:target.id,name:target.name,house:target.house,rank:target.rank}); send(p.ws,'private',{known:p.known}); if(Math.random()<0.5) kill(room,target,p); } }
  else if(card.type==='SHINOBI'){ if(target) kill(room,target,p); }
  else if(card.type==='REACTION'){}
}

wss.on('connection',ws=>{
  let player=null, room=null;
  ws.on('message',raw=>{
    let m; try{m=JSON.parse(raw)}catch{return}
    if(m.type==='create'){ const code=roomCode(); room={code,status:'lobby',players:[],host:null,round:0,log:[],deck:[]}; rooms.set(code,room); player={id:id(),name:(m.name||'Người chơi').slice(0,20),ws,honor:0,alive:true}; room.players.push(player); room.host=player.id; send(ws,'joined',{code,id:player.id}); broadcastState(room); return; }
    if(m.type==='join'){ room=rooms.get(String(m.code||'').toUpperCase()); if(!room||room.players.length>=11||room.status!=='lobby') return send(ws,'error',{message:'Phòng không tồn tại, đã đầy hoặc đã bắt đầu.'}); player={id:id(),name:(m.name||'Người chơi').slice(0,20),ws,honor:0,alive:true}; room.players.push(player); send(ws,'joined',{code:room.code,id:player.id}); broadcastState(room); return; }
    if(!room||!player) return;
    if(m.type==='rename'){player.name=(m.name||player.name).slice(0,20);broadcastState(room);}
    if(m.type==='start'&&player.id===room.host){ if(room.players.length<4||room.players.length>11)return send(ws,'error',{message:'Cần 4–11 người.'});startRound(room); }
    if(m.type==='draftPick'&&room.status==='draft'){
      const cards=room.draft[player.id]||[]; const idx=cards.findIndex(c=>c.id===m.cardId); if(idx<0)return;
      const picked=cards[idx]; cards.splice(idx,1); room.draft[player.id]=cards;
      room.draftChoices=(room.draftChoices||{}); room.draftChoices[player.id]=(room.draftChoices[player.id]||[]).concat(picked);
      // Online version uses direct second pick after all players choose; remaining cards stay until all choose.
      if(Object.keys(room.draftChoices).length===room.players.length && room.draftChoices[player.id].length>=2){
        for(const p of room.players){p.hand=room.draftChoices[p.id].slice(0,2);}
        beginNight(room);
      } else broadcastState(room);
    }
    if(m.type==='play'&&room.status==='night'){
      if(!player.alive)return;
      const card=player.hand.find(c=>c.id===m.cardId); if(!card||card.type!==room.phase)return send(ws,'error',{message:`Lá này không thuộc phase ${room.phase}.`});
      player.hand=player.hand.filter(c=>c.id!==m.cardId); room.nightQueue.push({playerId:player.id,card,targetId:m.targetId});
      const active=room.players.filter(p=>p.alive && p.hand.some(c=>c.type===room.phase));
      if(active.length===0){ room.nightQueue.sort((a,b)=>a.card.num-b.card.num); for(const q of room.nightQueue){const pp=room.players.find(x=>x.id===q.playerId); if(pp)resolveCard(room,pp,q.card,q.targetId);} room.nightQueue=[]; nextPhase(room); }
      else broadcastState(room);
    }
    if(m.type==='skip'&&room.status==='night'){ player.hand=player.hand.filter(c=>c.type!==room.phase); const active=room.players.filter(p=>p.alive&&p.hand.some(c=>c.type===room.phase)); if(active.length===0){nextPhase(room)} else broadcastState(room); }
    if(m.type==='continueRound'&&room.status==='round_end'&&player.id===room.host){startRound(room)}
    if(m.type==='pause'&&(room.status!=='lobby')){room.status=room.status==='paused'?room.previousStatus:'paused'; if(room.status==='paused')room.previousStatus=m.previousStatus||'night'; broadcastState(room)}
    if(m.type==='end'&&player.id===room.host){room.status='ended';broadcastState(room)}
    if(m.type==='chat'){ const text=String(m.text||'').slice(0,300); if(text)broadcast(room,'chat',{name:player.name,text}); }
  });
  ws.on('close',()=>{ if(player&&room){player.ws=null;broadcastState(room)} });
});

const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log(`Night of the Ninja online on ${PORT}`));
