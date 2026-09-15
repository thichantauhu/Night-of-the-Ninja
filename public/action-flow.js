/* Night action flow: play card first, reveal all cards, then let the owner resolve only when their number is active. */
(function(){
  const basePick=window.pick;
  const baseRenderPrivate=window.renderPrivate;
  function currentTurn(){
    if(!room||room.status!=='night'||room.resolvingPid!==me)return null;
    const list=room.revealed||[];
    const x=list[room.resolving??-1];
    return x?.pid===me?x:null;
  }
  function targetButtons(card){
    const targets=(room.players||[]).filter(p=>p.alive&&p.id!==me&&!p.kicked);
    return `<div class="action-turn"><div class="action-turn-title">ĐẾN LƯỢT BẠN — ${esc(TYPE[card.type]||card.name||'Lá Ninja')} ${card.num??''}</div><div class="action-turn-help">Chọn mục tiêu để thực hiện lá bài.</div><div class="target-list">${targets.map(p=>`<button class="target-btn" onclick="window.resolveTurnTarget('${card.id}','${p.id}')">${esc(p.name)}${p.bot?' 🤖':''}</button>`).join('')}</div></div>`;
  }
  function renderChoice(){
    const ch=lastPrivate.choice;if(!ch)return false;
    const x=currentTurn(),c=x?.card||{};if(!x)return false;
    const area=document.querySelector('#actionArea');if(!area)return false;
    if(ch.kind==='MYSTIC'){
      const opts=ch.options||[];
      area.innerHTML=`<div class="action-turn"><div class="action-turn-title">NHÀ TIÊN TRI — ${esc(ch.targetName)}</div><div class="action-turn-help">Bạn đã xem Nhà. Chọn 1 lá Ninja của người này để xem.</div><div class="target-list">${opts.map(n=>`<button class="target-btn" onclick="window.resolveMystic('${c.id}','${ch.targetId}','${n.id}')">${esc(n.name||TYPE[n.type]||n.type)}${n.num!=null?' #'+n.num:''}</button>`).join('')}</div></div>`;
      return true;
    }
    if(ch.kind==='SPIRIT MERCHANT'){
      area.innerHTML=`<div class="action-turn"><div class="action-turn-title">THƯƠNG NHÂN LINH HỒN — ${esc(ch.targetName)}</div><div class="action-turn-help">Chọn 1 thông tin để xem.</div><div class="target-list"><button class="target-btn" onclick="window.resolveSpirit('${c.id}','${ch.targetId}','HOUSE')">🏠 Xem Nhà</button><button class="target-btn" onclick="window.resolveSpirit('${c.id}','${ch.targetId}','HONOR')">⭐ Xem Danh dự</button></div></div>`;
      return true;
    }
    return false;
  }
  function renderTurnAction(){
    const x=currentTurn();
    if(!x)return;
    let area=document.querySelector('#actionArea');
    if(!area){area=document.createElement('div');area.id='actionArea';document.querySelector('#hand')?.appendChild(area)}
    if(renderChoice())return;
    const c=x.card||{};
    if(c.original==='Shapeshifter'){
      const targets=(room.players||[]).filter(p=>p.alive&&p.id!==me&&!p.kicked);
      area.innerHTML=`<div class="action-turn"><div class="action-turn-title">ĐẾN LƯỢT BẠN — Kẻ biến hình ${c.num??''}</div><div class="action-turn-help">Chọn đúng 2 người để đổi Nhà.</div><div class="target-list">${targets.map(p=>`<button class="target-btn turn-target" data-id="${p.id}" onclick="this.classList.toggle('selected')">${esc(p.name)}${p.bot?' 🤖':''}</button>`).join('')}</div><button class="confirm-target" onclick="window.resolveShapeshifter('${c.id}')">Xác nhận 2 người</button></div>`;
      return;
    }
    if(c.original==='Gravedigger'){
      area.innerHTML=`<div class="action-turn"><div class="action-turn-title">ĐẾN LƯỢT BẠN — Kẻ đào mộ ${c.num??''}</div><div class="action-turn-help">Thực hiện lá bài để xem 2 lá đã bị bỏ khỏi Draft.</div><button class="confirm-target" onclick="window.resolveTurn('${c.id}')">Thực hiện Kẻ đào mộ</button></div>`;
      return;
    }
    if(c.type==='MYSTIC'){
      const targets=(room.players||[]).filter(p=>p.alive&&p.id!==me&&!p.kicked);
      area.innerHTML=`<div class="action-turn"><div class="action-turn-title">ĐẾN LƯỢT BẠN — Nhà tiên tri ${c.num??''}</div><div class="action-turn-help">Chọn người để xem Nhà và 1 lá Ninja của họ.</div><div class="target-list">${targets.map(p=>`<button class="target-btn" onclick="window.startMystic('${c.id}','${p.id}')">${esc(p.name)}${p.bot?' 🤖':''}</button>`).join('')}</div></div>`;
      return;
    }
    if(c.original==='Spirit Merchant'){
      const targets=(room.players||[]).filter(p=>p.alive&&p.id!==me&&!p.kicked);
      area.innerHTML=`<div class="action-turn"><div class="action-turn-title">ĐẾN LƯỢT BẠN — Thương nhân linh hồn ${c.num??''}</div><div class="action-turn-help">Chọn người để xem Nhà hoặc Danh dự.</div><div class="target-list">${targets.map(p=>`<button class="target-btn" onclick="window.startSpirit('${c.id}','${p.id}')">${esc(p.name)}${p.bot?' 🤖':''}</button>`).join('')}</div></div>`;
      return;
    }
    if(c.type==='SHINOBI'){
      const targets=(room.players||[]).filter(p=>p.alive&&p.id!==me&&!p.kicked);
      area.innerHTML=`<div class="action-turn"><div class="action-turn-title">ĐẾN LƯỢT BẠN — Ninja ${c.num??''}</div><div class="action-turn-help">Chọn người để xem Nhà. Sau đó bạn quyết định có giết hay không.</div><div class="target-list">${targets.map(p=>`<button class="target-btn" onclick="window.resolveShinobi('${c.id}','${p.id}')">${esc(p.name)}${p.bot?' 🤖':''}</button>`).join('')}</div></div>`;
      return;
    }
    if(c.type==='BLIND ASSASSIN'||(c.type==='TRICKSTER'&&c.original==='Judge')){
      const title=c.original==='Judge'?'Chọn người để Quan tòa xử':'Chọn người để giết';
      area.innerHTML=targetButtons({...c});
      area.querySelector('.action-turn-help').textContent=title;
      return;
    }
    area.innerHTML=targetButtons(c);
  }
  window.resolveTurn=function(cardId,targetId,kill=false){send('play',{cardId,targetId,kill})};
  window.resolveTurnTarget=function(cardId,targetId){
    const x=currentTurn(),c=x?.card||{};if(!c)return;
    const kill=c.type==='BLIND ASSASSIN'||(c.type==='TRICKSTER'&&c.original==='Judge');
    send('play',{cardId,targetId,kill});
  };
  window.startMystic=function(cardId,targetId){send('play',{cardId,targetId})};
  window.resolveMystic=function(cardId,targetId,ninjaId){send('play',{cardId,targetId,ninjaId})};
  window.startSpirit=function(cardId,targetId){send('play',{cardId,targetId})};
  window.resolveSpirit=function(cardId,targetId,choice){send('play',{cardId,targetId,choice})};
  window.resolveShinobi=function(cardId,targetId){
    if(confirm('Bạn có muốn giết người này sau khi xem Nhà không?'))send('play',{cardId,targetId,kill:true});
    else send('play',{cardId,targetId,kill:false});
  };
  window.resolveShapeshifter=function(cardId){
    const ids=[...document.querySelectorAll('.turn-target.selected')].map(b=>b.dataset.id);if(ids.length!==2){setMsg('Cần chọn đúng 2 người.');return}send('play',{cardId,targetIds:ids});
  };
  window.pick=function(id,draft){
    if(draft)return basePick(id,true);
    if(room?.status==='night'){
      const c=lastPrivate.hand?.find(x=>x.id===id);if(!c)return;
      send('play',{cardId:id});
      return;
    }
    return basePick(id,draft);
  };
  window.renderPrivate=function(){
    baseRenderPrivate();
    if(room?.status==='night')renderTurnAction();
  };
  const style=document.createElement('style');
  style.textContent=`.action-turn{margin-top:14px;padding:14px;border:1px solid #d7dbe1;border-radius:12px;background:#fff}.action-turn-title{font-weight:900;font-size:14px}.action-turn-help{font-size:12px;color:#6c7078;margin:5px 0 10px}.action-turn .target-list{display:flex;gap:8px;flex-wrap:wrap}.action-turn .target-btn.selected{background:#17191f;color:#fff;border-color:#17191f}.action-turn .confirm-target{margin-top:10px}`;
  document.head.appendChild(style);
})();
