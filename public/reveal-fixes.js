/* Reveal board: show all played cards in number order, player name, card number, name, info, and highlight the active action. */
(function(){
const style=document.createElement('style');
style.textContent=`
.reveal-board-fixed{width:100%;padding:20px 12px 24px;text-align:center;box-sizing:border-box}
.reveal-board-fixed h3{margin:3px 0 7px;font-size:20px}
.reveal-board-fixed .reveal-help{margin:0 0 16px;color:#6c7078;font-size:12px}
.reveal-cards-fixed{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;align-items:stretch}
.reveal-card-fixed{width:160px;min-height:190px;border:2px solid #d1d5da;border-radius:12px;background:#fff;padding:12px;box-sizing:border-box;display:flex;flex-direction:column;align-items:flex-start;text-align:left;box-shadow:0 3px 10px #00000008;transition:.2s}
.reveal-card-fixed .action-number{font-size:10px;font-weight:900;color:#777;margin-bottom:7px;letter-spacing:.5px}
.reveal-card-fixed .actor{font-size:14px;font-weight:900;line-height:1.25;min-height:35px;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.reveal-card-fixed .card-number{font-size:30px;font-weight:900;line-height:1;margin:7px 0}
.reveal-card-fixed .card-name{font-size:14px;font-weight:800}
.reveal-card-fixed .card-desc{font-size:11px;color:#6c7078;line-height:1.35;margin-top:6px}
.reveal-card-fixed.active{background:#17191f;border-color:#111;box-shadow:0 0 0 3px #17191f33,0 9px 22px #00000018;transform:translateY(-3px)}
.reveal-card-fixed.active .action-number,.reveal-card-fixed.active .actor,.reveal-card-fixed.active .card-number,.reveal-card-fixed.active .card-name,.reveal-card-fixed.active .card-desc{color:#fff}
.reveal-card-fixed.done{opacity:.55}
.reveal-card-fixed .active-label{margin-top:auto;padding-top:9px;font-size:9px;font-weight:900;letter-spacing:.7px}
.reveal-order-fixed{margin-top:15px;font-size:12px;font-weight:800;color:#555b65}
.reveal-waiting{padding:28px 18px;text-align:center}
.reveal-waiting .waiting-title{font-size:18px;font-weight:900;margin-bottom:8px}
.reveal-waiting .waiting-count{font-size:13px;color:#6c7078}
@media(max-width:680px){.reveal-card-fixed{width:calc(50% - 6px);min-width:140px}.reveal-cards-fixed{gap:8px}}
`;
document.head.appendChild(style);

function renderRevealCenterFixed(){
 const all=(room?.revealed||[]).filter(x=>x?.card).slice().sort((a,b)=>(a.card.num??99)-(b.card.num??99));
 if(!all.length){
   return `<div class="reveal-waiting"><div class="eyebrow">${esc(phaseName(room.phase))}</div><div class="waiting-title">Đang chờ tất cả người chơi đánh bài</div>${room.pendingCount?`<div class="waiting-count">Còn ${room.pendingCount} người chưa chọn.</div>`:'<div class="waiting-count">Khi tất cả đã chọn, các lá sẽ được lật cùng lúc.</div>'}</div>`;
 }
 const active=room.resolving??-1;
 return `<div class="reveal-board-fixed">
   <div class="eyebrow">LÁ ĐÃ ĐÁNH</div>
   <h3>${esc(phaseName(room.phase))}</h3>
   <p class="reveal-help">Các lá được xếp theo số <b>1 → 6</b>. Lá tới lượt sẽ được tô nổi bật.</p>
   <div class="reveal-cards-fixed">${all.map((x,i)=>{
     const cls=i===active?'active':i<active?'done':'';
     const card=x.card||{};
     return `<div class="reveal-card-fixed ${cls}">
       <div class="action-number">HÀNH ĐỘNG ${i+1}</div>
       <div class="actor">${esc(x.playerName||'?')}</div>
       <div class="card-number">${card.num??''}</div>
       <div class="card-name">${esc(TYPE[card.type]||card.name||card.type||'')}</div>
       ${card.text?`<div class="card-desc">${esc(card.text)}</div>`:''}
       ${i===active?'<div class="active-label">ĐANG HÀNH ĐỘNG</div>':''}
     </div>`;
   }).join('')}</div>
   <div class="reveal-order-fixed">Thứ tự hành động: ${all.map(x=>x.card.num).join(' → ')}</div>
 </div>`;
}

const baseRender=window.render;
if(typeof baseRender==='function'){
 window.render=function(){
   baseRender();
   if(room?.status==='night'){
     const center=document.querySelector('#center');
     if(center)center.innerHTML=renderRevealCenterFixed();
   }
 };
}
})();
