(()=>{
  const baseRender=window.render;
  window.render=function(){
    baseRender.apply(this,arguments);
    try{syncPreviewPanels()}catch(e){console.warn('preview ui',e)}
  };
  function syncPreviewPanels(){
    const log=document.getElementById('previewLog'),action=document.getElementById('previewActionContent'),info=document.getElementById('previewInfo');
    if(!log||!action||!info)return;
    const cards=[...document.querySelectorAll('.revealed-card')];
    const notice=(document.getElementById('notice')?.textContent||'').trim();
    log.innerHTML='<div class="section-title">NHẬT KÝ HÀNH ĐỘNG</div>'+(cards.length?cards.map((c,i)=>`<div class="log-row"><span class="log-dot ${c.classList.contains('resolving')?'me':''}"></span><span class="log-name">${esc(c.querySelector('.reveal-player')?.textContent||'Người chơi')} đã đánh ${esc(c.querySelector('.reveal-name')?.textContent||'lá')}</span><span class="log-time">${i+1}</span></div>`).join(''):`<div class="log-row"><span class="log-dot skip"></span><span class="log-name">${esc(notice||'Đang chờ người chơi chọn...')}</span></div>`);
    const area=document.getElementById('actionArea');
    if(area&&area.parentElement!==action)action.appendChild(area);
    const current=document.querySelector('#hand .ncard.phase-current');
    if(current){
      const num=current.querySelector('.num')?.textContent||'';
      const name=current.querySelector('.name')?.textContent||current.querySelector('.type')?.textContent||'';
      const desc=current.querySelector('.desc')?.textContent||'';
      info.innerHTML=`<div class="info-card"><div class="info-num">${esc(num)}</div><div class="info-name">${esc(name)}</div><div class="info-art">🥷</div></div><div><h3>${esc(name)}</h3><p>Số: <b>${esc(num||'—')}</b></p><p>${esc(desc)}</p></div><div class="info-note"><b>GHI CHÚ</b><p>Hành động theo thứ tự số từ nhỏ đến lớn (1 → 6).</p><p>Chỉ người có lá ở pha hiện tại mới cần đánh hoặc bỏ qua.</p><p>Lá đang xử lý được làm nổi bật; lá đã xử lý sẽ mờ đi.</p></div>`;
    }else{
      info.innerHTML='<div><h3>THÔNG TIN LÁ</h3><p>Chọn một lá Ninja để xem thông tin và hành động tương ứng.</p></div><div class="info-note"><b>GHI CHÚ</b><p>Hãy theo dõi khu vực giữa bàn để biết thứ tự xử lý.</p></div>';
    }
  }
  function esc(s){return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]))}
})();
