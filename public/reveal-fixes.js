(function(){
const style=document.createElement('style');
style.textContent=`
.reveal-board-fixed{width:100%;padding:24px 10px 28px;text-align:center}
.reveal-board-fixed h3{margin:4px 0 8px;font-size:20px}
.reveal-board-fixed .reveal-help{margin:0 0 18px;color:#6c7078;font-size:13px}
.reveal-cards-fixed{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;align-items:stretch}
.reveal-card-fixed{width:155px;min-height:165px;border:2px solid #c9cdd3;border-radius:12px;background:#fff;padding:14px 12px;display:flex;flex-direction:column;align-items:flex-start;text-align:left;box-shadow:0 3px 10px #00000008;transition:.2s}
.reveal-card-fixed .action-number{font-size:12px;font-weight:900;color:#777;margin-bottom:7px}
.reveal-card-fixed .actor{font-size:14px;font-weight:900;line-height:1.25;min-height:35px}
.reveal-card-fixed .card-number{font-size:30px;font-weight:900;line-height:1;margin:8px 0}
.reveal-card-fixed .card-name{font-size:14px;font-weight:800}
.reveal-card-fixed .card-desc{font-size:11px;color:#6c7078;line-height:1.35;margin-top:6px}
.reveal-card-fixed.active{background:#17191f;border-color:#111;box-shadow:0 0 0 3px #17191f55,0 10px 24px #00000018;transform:translateY(-2px)}
.reveal-card-fixed.active .action-number,.reveal-card-fixed.active .actor,.reveal-card-fixed.active .card-number,.reveal-card-fixed.active .card-name,.reveal-card-fixed.active .card-desc{color:#fff}
.reveal-card-fixed.done{opacity:.62}
.reveal-order-fixed{margin-top:18px;font-size:13px;font-weight:800;color:#555b65}
@media(max-width:680px){.reveal-card-fixed{width:calc(50% - 8px);min-width:135px}.reveal-cards-fixed{gap:8px}}
`;
document.head.appendChild(style);
window.renderNightCenter=function(){
 const all=(room?.revealed||[]).filter(x=>x?.card?.type===room.phase).slice().sort((a,b)=>(a.card.num??99)-(b.card.num??99));
 if(!all.length)return `<div class="empty"><h3>${esc(phaseName(room.phase))}</h3><p>Chọn lá bí mật. Khi tất cả đã chọn/bỏ qua, <b>tất cả lá sẽ được lật cùng lúc</b>.</p>${room.pendingCount?`<p>Đang chờ ${room.pendingCount} người chọn...</p>`:''}</div>`;
 const active=room.resolving??-1;
 return `<div class="reveal-board-fixed"><div class="eyebrow">LÁ ĐÃ ĐÁNH</div><h3>${esc(phaseName(room.phase))}</h3><p class="reveal-help">Các lá được xếp theo số hành động từ <b>1 → 6</b>. Lá đang tới lượt sẽ được tô nổi bật.</p><div class="reveal-cards-fixed">${all.map((x,i)=>{const cls=i===active?'active':i<active?'done':'';return `<div class="reveal-card-fixed ${cls}"><div class="action-number">HÀNH ĐỘNG ${i+1}</div><div class="actor">${esc(x.playerName||'?')}</div><div class="card-number">${x.card.num??''}</div><div class="card-name">${esc(TYPE[x.card.type]||x.card.name||x.card.type)}</div><div class="card-desc">${esc(x.card.name||'')}</div>${i===active?'<div style="margin-top:auto;font-size:10px;font-weight:900;letter-spacing:.7px">ĐANG HÀNH ĐỘNG</div>':''}</div>`}).join('')}</div><div class="reveal-order-fixed">Thứ tự hành động: ${all.map(x=>x.card.num).join(' → ')}</div></div>`;
};
})();
