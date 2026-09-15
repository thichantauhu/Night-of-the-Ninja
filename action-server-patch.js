import fs from 'fs';
const path='server.js';
let s=fs.readFileSync(path,'utf8');
function replaceBetween(startMarker,endMarker,replacement){const a=s.indexOf(startMarker);const b=s.indexOf(endMarker,a);if(a<0||b<0)throw new Error('Cannot patch '+startMarker);s=s.slice(0,a)+replacement+'\n'+s.slice(b)}
replaceBetween('function revealPhase(', 'function resolveNext(', 'function revealPhase(r){if(r.status!==\'night\'||r.reaction||r.grave)return;if(!r.queue.length)return advancePhase(r);r.queue.sort((a,b)=>(a.card.num||99)-(b.card.num||99));r.revealed=r.queue.map(x=>({pid:x.pid,playerName:getP(r,x.pid)?.name||\'?\',card:{id:x.card.id,type:x.card.type,num:x.card.num,name:x.card.name,text:x.card.text,original:x.card.original}}));r.resolving=0;r.resolvingPid=null;push(r,\'Tất cả lá đã được mở. Bắt đầu hành động theo số trên lá: 1 → 6.\');sync(r);setTimeout(()=>resolveNext(r),300)}');
replaceBetween('function resolveNext(', 'function needsReaction', 'function resolveNext(r){if(r.status!==\'night\'||r.reaction||r.grave)return;if(r.resolving>=r.queue.length){r.queue=[];r.revealed=[];r.resolving=-1;r.resolvingPid=null;sync(r);return advancePhase(r)}const q=r.queue[r.resolving];if(!q)return;r.resolvingPid=q.pid;sync(r);const p=getP(r,q.pid);if(p?.bot){setTimeout(()=>{if(r.status!==\'night\'||r.reaction||r.grave||r.resolvingPid!==p.id)return;const targets=r.players.filter(x=>x.alive&&!x.kicked&&x.id!==p.id);let targetId=targets[Math.floor(Math.random()*targets.length)]?.id;let targetIds=[];if(q.card.original===\'Shapeshifter\'){targetIds=targets.slice(0,2).map(x=>x.id);targetId=null}let kill=q.card.type===\'BLIND ASSASSIN\'||q.card.original===\'Judge\'||(q.card.type===\'SHINOBI\'&&Math.random()<.55);play(r,p,{cardId:q.card.id,targetId,targetIds,kill})},450)}else sync(r)}');
const playReplacement = `function play(r,p,m){if(!p.alive||p.kicked||r.reaction||r.grave){send(p,'error',{message:'Bạn không thể thực hiện hành động này lúc này.'});return}
const current=r.resolving>=0?r.queue?.[r.resolving]:null;
if(current&&r.resolvingPid===p.id&&current.pid===p.id){
 if(m.cardId!==current.card.id){send(p,'error',{message:'Không đúng lá đang tới lượt xử lý.'});return}
 if(current.card.original==='Shapeshifter'){const ids=[...new Set(Array.isArray(m.targetIds)?m.targetIds:[])];if(ids.length!==2||!ids.every(id=>id!==p.id&&getP(r,id)?.alive&&!getP(r,id)?.kicked)){send(p,'error',{message:'Kẻ biến hình cần chọn đúng 2 người chơi còn sống.'});return}current.targetIds=ids;current.targetId=null}
 else if(['SPY','MYSTIC','TRICKSTER','BLIND ASSASSIN','SHINOBI'].includes(current.card.type)&&current.card.original!=='Gravedigger'){const t=getP(r,m.targetId);if(!t||!t.alive||t.kicked||t.id===p.id){send(p,'error',{message:'Hãy chọn 1 người chơi còn sống.'});return}current.targetId=t.id;current.kill=!!m.kill}
 else current.targetId=m.targetId;
 const paused=resolveCard(r,current);if(paused)return;r.resolving++;r.resolvingPid=null;sync(r);setTimeout(()=>resolveNext(r),500);return}
if(!r.pending?.has(p.id)){send(p,'error',{message:'Bạn chưa đến bước đánh lá hoặc lá này đã được đánh.'});return}
const i=p.hand.findIndex(c=>c.id===m.cardId&&c.type===r.phase);if(i<0){send(p,'error',{message:'Lá này không thuộc pha hiện tại hoặc đã được sử dụng.'});return}
const c=p.hand.splice(i,1)[0];r.pending.delete(p.id);r.queue.push({pid:p.id,card:c,targetId:null,targetIds:[],kill:false});push(r,p.name+' đã đánh lá '+(c.num??'')+' '+c.name+'.');sync(r);if(!r.pending.size)revealPhase(r)}`;
replaceBetween('function play(', 'function skip', playReplacement);
fs.writeFileSync(path,s);