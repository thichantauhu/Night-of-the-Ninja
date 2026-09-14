import fs from 'fs';
const path='server.js';
let s=fs.readFileSync(path,'utf8');
const replace=(name,next)=>{const re=new RegExp(`function ${name}\\([\\s\\S]*?\\nfunction `);const m=s.match(re);if(!m)throw new Error(`Cannot patch ${name}`);s=s.replace(re,next+'\nfunction ');};
replace('botDraft',`function botDraft(r){r.draftBotToken=(r.draftBotToken||0)+1;const token=r.draftBotToken;r.players.filter(p=>p.bot).forEach((p,i)=>setTimeout(()=>{if(r.status!=='draft'||r.draftBotToken!==token)return;const h=r.draftHands[p.id]||[];if(h.length!==r.draftStage)return;const c=h.slice().sort((a,b)=>scoreCard(b)-scoreCard(a))[0];if(c)pickDraft(r,p,c.id)},400+i*220)}`);
replace('passDraft',`function passDraft(r){r.draftBotToken=(r.draftBotToken||0)+1;const ids=r.players.map(p=>p.id),old=r.draftHands,next={};ids.forEach((id,i)=>{const remaining=(old[id]||[]).slice();next[ids[(i+1)%ids.length]]=remaining});r.draftHands=next;r.draftStage=2;push(r,'Vòng chọn 2: nhận đúng 2 lá từ bên phải, giữ 1 lá và bỏ lá còn lại.');sync(r);botDraft(r)}`);
replace('pickDraft',`function pickDraft(r,p,id){if(r.status!=='draft')return;const h=r.draftHands[p.id]||[];const expected=r.draftStage===1?3:2;if(h.length!==expected)return;const i=h.findIndex(c=>c.id===id);if(i<0)return;r.kept[p.id].push(h.splice(i,1)[0]);if(allDrafted(r)){if(r.draftStage===1)passDraft(r);else{r.players.forEach(x=>{if((r.draftHands[x.id]||[]).length)r.discarded.push(...r.draftHands[x.id]);x.hand=(r.kept[x.id]||[]).slice(0,2)});beginNight(r)}}else sync(r)}`);
fs.writeFileSync(path,s);
