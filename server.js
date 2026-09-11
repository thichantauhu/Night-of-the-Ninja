import express from 'express';
import http from 'http';
import crypto from 'crypto';
import {WebSocketServer} from 'ws';
const app=express();app.use(express.static('public'));const server=http.createServer(app),wss=new WebSocketServer({server}),rooms=new Map();
const phases=['SPY','MYSTIC','TRICKSTER','BLIND ASSASSIN','SHINOBI'];
const uid=()=>crypto.randomBytes(5).toString('hex');
const send=(p,type,data={})=>p?.ws?.readyState===1&&p.ws.send(JSON.stringify({type,...data}));
const pub=p=>({id:p.id,name:p.name,alive:p.alive,honor:p.honor,connected:!!p.ws});
function state(r){return {code:r.code,status:r.status,phase:r.phase,round:r.round,host:r.host,players:r.players.map(pub),log:r.log.slice(-25),winner:r.winner};}
function push(r,t){r.log.push(t)}
function sync(r){r.players.forEach(p=>{send(p,'state',{room:state(r)});send(p,'private',{house:p.house,rank:p.rank,honor:p.honor,alive:p.alive,hand:p.hand||[],known:p.known||[],draft:(r.draft?.[p.id]||[]).map(x=>x)});});}
function deck(){const a=[];for(let n=1;n<=6;n++){a.push({id:uid(),type:'SPY',num:n,text:'Xem House card của một người chơi.'});a.push({id:uid(),type:'MYSTIC',num:n,text:'Xem House card của một người chơi.'});a.push({id:uid(),type:'BLIND ASSASSIN',num:n,text:'Xem House card của một người; sau đó có thể giết.'});a.push({id:uid(),type:'SHINOBI',num:n,text:'Chọn một người và giết.'});}const t=[['Shapeshifter','Đổi bí mật House của hai người.'],['Gravedigger','Xem 2 Ninja card đã bỏ và lấy 1.'],['Troublemaker','Xem House của một người và có thể lộ nó.'],['Spy Merchant','Xem Honor hoặc House của một người.'],['Thief','Lộ House và lấy 1 Honor từ người có nhiều hơn.'],['Judge','Lộ House và giết một người.']];t.forEach((x,i)=>a.push({id:uid(),type:'TRICKSTER',num:i+1,name:x[0],text:x[1]}));return a.sort(()=>Math.random()-.5)}
function houses(n){const a=[];for(let i=1;i<=Math.ceil(n/2);i++)a.push({house:'Crane',rank:i});for(let i=1;i<=Math.floor(n/2);i++)a.push({house:'Lotus',rank:i});return a.sort(()=>Math.random()-.5)}
function start(r){r.status='draft';r.round++;r.phase=null;r.phaseIndex=0;r.log=[];r.deck=deck();r.draft={};r.draftPicked={};r.draftStage=1;r.players.forEach((p,i)=>{const h=houses(r.players.length)[i];p.house=h.house;p.rank=h.rank;p.alive=true;p.hand=[];p.known=[];p.honor=p.honor||0;r.draft[p.id]=[r.deck.pop(),r.deck.pop(),r.deck.pop()];r.draftPicked[p.id]=[]});push(r,`Round ${r.round}: mỗi người nhận 3 Ninja card.`);sync(r)}
function beginNight(r){r.players.forEach(p=>p.hand=r.draftPicked[p.id].slice(0,2));r.status='night';r.phaseIndex=0;r.phase=phases[0];r.queue=[];push(r,'The Night bắt đầu.');sync(r)}
function advance(r){r.phaseIndex++;r.queue=[];if(r.phaseIndex>=phases.length)return reveal(r);r.phase=phases[r.phaseIndex];push(r,`Phase ${r.phase}.`);sync(r)}
function reveal(r){r.status='round_end';r.phase='HOUSE REVEAL';const live=r.players.filter(p=>p.alive),groups={Crane:[],Lotus:[]};live.forEach(p=>groups[p.house].push(p));for(const h of Object.keys(groups))groups[h].sort((a,b)=>a.rank-b.rank);let w=null;const a=groups.Crane,b=groups.Lotus;if(a.length&&!b.length)w='Crane';else if(b.length&&!a.length)w='Lotus';else if(a.length&&b.length){for(let i=0;i<Math.min(a.length,b.length);i++){if(a[i].rank!==b[i].rank){w=a[i].rank<b[i].rank?'Crane':'Lotus';break}}}r.winner=w;if(w){r.players.filter(p=>p.house===w).forEach(p=>p.honor+=(2+Math.floor(Math.random()*3)));push(r,`${w} thắng round.`)}else{live.forEach(p=>p.honor+=2);push(r,'Round hòa: người sống nhận 2 Honor.')}sync(r);if(r.players.some(p=>p.honor>=10))r.status='ended'}
function kill(r,t,src){if(!t||!t.alive)return; t.alive=false;push(r,`${t.name} bị hạ.`)}
function resolve(r,q){const p=r.players.find(x=>x.id===q.pid),c=q.card,t=r.players.find(x=>x.id===q.target);if(!p||!p.alive)return;if(c.type==='SPY'||c.type==='MYSTIC'){if(t){p.known.push({name:t.name,house:t.house,rank:t.rank});send(p,'private',{known:p.known})}}else if(c.type==='TRICKSTER'){if(t&&c.name==='Judge')kill(r,t,p);if(t&&c.name==='Troublemaker')push(r,`${p.name} nhìn House của ${t.name}.`)}else if(c.type==='BLIND ASSASSIN'){if(t){p.known.push({name:t.name,house:t.house,rank:t.rank});send(p,'private',{known:p.known});if(q.kill)kill(r,t,p)}}else if(c.type==='SHINOBI'&&t)kill(r,t,p)}
function finishPhase(r){const active=r.players.filter(p=>p.alive&&p.hand.some(c=>c.type===r.phase));if(active.length)return sync(r);r.queue.sort((a,b)=>(a.card.num||99)-(b.card.num||99));r.queue.forEach(q=>resolve(r,q));advance(r)}
wss.on('connection',ws=>{let me=null,r=null;ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch{return}
 if(m.type==='create'){const code=Math.random().toString(36).slice(2,7).toUpperCase();r={code,status:'lobby',players:[],host:null,round:0,log:[]};rooms.set(code,r);me={id:uid(),name:(m.name||'Người chơi').slice(0,20),ws,honor:0,alive:true};r.players.push(me);r.host=me.id;send(me,'joined',{code,id:me.id});sync(r);return}
 if(m.type==='join'){r=rooms.get(String(m.code||'').toUpperCase());if(!r||r.status!=='lobby'||r.players.length>=11)return send({ws},'error',{message:'Phòng không tồn tại, đã bắt đầu hoặc đã đầy.'});me={id:uid(),name:(m.name||'Người chơi').slice(0,20),ws,honor:0,alive:true};r.players.push(me);send(me,'joined',{code:r.code,id:me.id});sync(r);return}
 if(!me||!r)return;
 if(m.type==='start'&&me.id===r.host){if(r.players.length<4)return send(me,'error',{message:'Cần ít nhất 4 người.'});start(r)}
 else if(m.type==='draftPick'&&r.status==='draft'){const cards=r.draft[me.id]||[],i=cards.findIndex(c=>c.id===m.cardId);if(i<0)return;const c=cards.splice(i,1)[0];r.draftPicked[me.id].push(c);if(Object.values(r.draftPicked).every(x=>x.length>=r.draftStage)){if(r.draftStage===1){r.draftStage=2;push(r,'Vòng chọn thứ 2: chọn 1 trong 2 lá còn lại.');}else beginNight(r)}else sync(r)}
 else if(m.type==='play'&&r.status==='night'){const i=me.hand.findIndex(c=>c.id===m.cardId);if(i<0||me.hand[i].type!==r.phase)return;const c=me.hand.splice(i,1)[0];r.queue.push({pid:me.id,card:c,target:r.players.find(p=>p.id===m.targetId),kill:!!m.kill});finishPhase(r)}
 else if(m.type==='skip'&&r.status==='night'){me.hand=me.hand.filter(c=>c.type!==r.phase);finishPhase(r)}
 else if(m.type==='continueRound'&&r.status==='round_end'&&me.id===r.host)start(r);
 else if(m.type==='pause'){if(r.status==='paused')r.status=r.previousStatus||'night';else{r.previousStatus=r.status;r.status='paused'}sync(r)}
 else if(m.type==='end'&&me.id===r.host){r.status='ended';sync(r)}
 else if(m.type==='chat'&&m.text)r.players.forEach(p=>send(p,'chat',{name:me.name,text:String(m.text).slice(0,300)}));
 else if(m.type==='rename'){me.name=String(m.name||me.name).slice(0,20);sync(r)}
 });ws.on('close',()=>{if(me&&r){me.ws=null;sync(r)}})});
server.listen(process.env.PORT||3000);
