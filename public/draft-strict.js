/* Strict Draft flow: first pick is completed by everyone before any passed cards appear. */
let strictDraftRound=null;
let strictFirstPick=[];
function strictDraftView(){
  if(!room||room.status!=='draft')return null;
  if(strictDraftRound!==room.round){strictDraftRound=room.round;strictFirstPick=[]}
  const stage=room.draftNeed||1;
  const draft=lastPrivate.draft||[];
  const selected=strictFirstPick||[];
  if(stage===1){
    const waiting=room.players.filter(p=>!p.kicked).length-(room.draftKept?Object.values(room.draftKept).filter(n=>n>=1).length:0);
    let html='<div class="draft-owned"><div class="hand-title">LÁ NINJA CỦA MÌNH</div><div class="cardgrid">'+selected.map(c=>fixedCard(c,false,true)).join('')+'</div>';
    if(selected.length)html+='<p class="draft-hint">Đã chọn 1 lá. Đang chờ tất cả người chơi chọn lá đầu tiên.</p>';
    else html+='<p class="draft-hint">Chọn 1 lá. Lá được chọn sẽ vào Lá Ninja của mình.</p>';
    if(waiting>0)html+='<p class="draft-wait">Còn '+waiting+' người chưa chọn lá đầu tiên.</p>';
    html+='</div><div id="actionArea"></div>';
    return html;
  }
  const already=selected.length?selected:[];
  let html='<div class="draft-owned"><div class="hand-title">LÁ NINJA CỦA MÌNH</div><div class="cardgrid">'+already.map(c=>fixedCard(c,false,true)).join('')+'</div></div>';
  if(draft.length){
    html+='<div class="draft-select"><div class="hand-title">LÁ NINJA — CHỌN LÁ 2/2</div><p class="draft-hint">2 lá bỏ của người bên tay phải đã được chuyền cho bạn. Chọn 1 lá để giữ; lá còn lại sẽ bỏ.</p><div class="cardgrid">'+draft.map(c=>fixedCard(c,true)).join('')+'</div></div>';
  }else if(already.length<2){
    html+='<div class="draft-select"><p class="draft-hint">Đang chờ 2 lá từ người bên tay phải...</p></div>';
  }else{
    html+='<p class="draft-hint">Đã chọn lá thứ 2. Đang chờ tất cả người chơi hoàn tất...</p>';
  }
  return html+'<div id="actionArea"></div>';
}
function strictRenderPrivate(){
  if(!room)return;
  if(room.round!==strictDraftRound){strictDraftRound=room.round;strictFirstPick=[]}
  $('#house').textContent=lastPrivate.ronin?'Lãng khách':(HOUSE[lastPrivate.house]||'—');
  $('#rank').textContent=lastPrivate.ronin?'—':(lastPrivate.rank??'—');
  $('#honor').textContent=lastPrivate.honor??0;
  $('#known').innerHTML=lastPrivate.known?.length?lastPrivate.known.map(x=>`<div><b>${esc(x.name)}</b> — ${esc(x.ronin?'Lãng khách':(HOUSE[x.house]||'—'))}${x.rank?' '+x.rank:''}${x.ninja?' · '+esc(x.ninja):''}</div>`).join(''):'Chưa có thông tin.';
  const h=$('#hand');
  if(room.status==='draft'){h.innerHTML=strictDraftView()||'';return}
  if(lastPrivate.hand?.length)h.innerHTML=`${reactionPanel()}${gravePanel()}${graveChoicePanel()}<div class="hand-title">LÁ NINJA CỦA BẠN</div><div class="cardgrid">${lastPrivate.hand.map(c=>fixedCard(c,false,true)).join('')}</div><div class="action-row">${room.status==='night'&&lastPrivate.hand.some(c=>c.type===room.phase)?`<button onclick="skip()">Bỏ qua ${esc(phaseName(room.phase))}</button>`:''}</div><div id="actionArea"></div>`;
  else h.innerHTML=`${reactionPanel()}${gravePanel()}${graveChoicePanel()}<div id="actionArea"></div>`;
}
function strictPick(id,draft){
  if(!draft){pickFixed(id,false);return}
  if(room?.status!=='draft')return;
  const stage=room.draftNeed||1;
  const c=lastPrivate.draft?.find(x=>x.id===id);if(!c)return;
  if(stage===1){
    if(strictFirstPick.length)return;
    strictFirstPick=[c];
    lastPrivate.draft=(lastPrivate.draft||[]).filter(x=>x.id!==id);
    renderPrivate();
    send('draftPick',{cardId:id});
    return;
  }
  if(stage===2){
    if(strictFirstPick.length>=2)return;
    strictFirstPick=[...(strictFirstPick||[]),c];
    lastPrivate.draft=(lastPrivate.draft||[]).filter(x=>x.id!==id);
    renderPrivate();
    send('draftPick',{cardId:id});
  }
}
window.renderPrivate=strictRenderPrivate;
window.pick=strictPick;
