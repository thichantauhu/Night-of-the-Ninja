(()=>{
  const baseRender=window.render;
  window.render=function(){
    baseRender.apply(this,arguments);
    try{
      syncPreviewPanels();
    }catch(e){console.warn('preview ui',e)}
  };
  function syncPreviewPanels(){
    const log=document.getElementById('previewLog');
    const action=document.getElementById('previewActionContent');
    const info=document.getElementById('previewInfo');
    if(!log||!action||!info||!window.room)return;
    const entries=(room.log||[]).slice(-5);
    log.innerHTML='<div class="section-title">NHẬT KÝ HÀNH ĐỘNG</div>'+(entries.length?entries.map((x,i)=>{
      const meLine=String(x).includes('Bạn')||String(x).includes('đã đánh');
      return `<div class="log-row"><span class="log-dot ${meLine?'me':''}"></span><span class="log-name">${escPreview(x)}</span><span class="log-time">${new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</span></div>`;
    }).join(''):'<div class="log-row"><span class="log-dot skip"></span><span class="log-name">Chưa có hành động</span></div>');
    const area=document.getElementById('actionArea');
    if(area&&area.parentElement!==action)action.appendChild(area);
    const current=(window.lastPrivate?.hand||[]).find(c=>c.type===room.phase);
    if(room.status==='night'&&current){
      const infoName=(window.TYPE&&TYPE[current.type])||current.name||current.type;
      const help=(window.CARD_HELP&&CARD_HELP[current.type])||current.text||'';
      info.innerHTML=`<div class="info-card"><div class="info-num">${current.num??''}</div><div class="info-name">${escPreview(infoName)}</div><div class="info-art">🥷</div></div><div><h3>${escPreview(infoName)}</h3><p>Số: <b>${current.num??'—'}</b></p><p>${escPreview(help)}</p></div><div class="info-note"><b>GHI CHÚ</b><p>Hành động theo thứ tự số từ nhỏ đến lớn (1 → 6).</p><p>Chỉ người có lá ở pha hiện tại mới cần đánh hoặc bỏ qua.</p><p>Lá đang xử lý được làm nổi bật; lá đã xử lý sẽ mờ đi.</p></div>`;
    }else{
      info.innerHTML='<div><h3>THÔNG TIN LÁ</h3><p>Chọn một lá Ninja để xem thông tin và hành động tương ứng.</p></div><div class="info-note"><b>GHI CHÚ</b><p>Hãy theo dõi khu vực giữa bàn để biết thứ tự xử lý.</p></div>';
    }
  }
  function escPreview(s){return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));}
})();
