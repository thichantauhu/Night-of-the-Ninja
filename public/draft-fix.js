/* Strict two-step Draft UI: never treat the two original leftover cards as the passed cards. */
(function(){
  const previousRenderPrivate=window.renderPrivate;
  window.renderPrivate=function(){
    if(!room||room.status!=='draft') return previousRenderPrivate();
    const draft=lastPrivate.draft||[];
    const selected=draftSelected||[];
    const stage=room.draftNeed===2?2:1;
    const h=$('#hand');
    if(!h)return;

    if(stage===1){
      if(selected.length===0){
        h.innerHTML=`<div class="draft-select"><div class="hand-title">LÁ NINJA — CHỌN LÁ 1/2</div><p class="draft-hint">Chọn đúng 1 lá để giữ lại. 2 lá còn lại <b>chưa được chuyền</b> cho đến khi tất cả người chơi chọn xong.</p><div class="cardgrid">${draft.map(c=>fixedCard(c,true)).join('')}</div></div><div id="actionArea"></div>`;
      }else{
        h.innerHTML=`<div class="draft-owned"><div class="hand-title">LÁ NINJA CỦA MÌNH</div><div class="cardgrid">${selected.slice(0,1).map(c=>fixedCard(c,false,true)).join('')}</div></div><div class="draft-select"><div class="hand-title">ĐANG CHỜ TẤT CẢ NGƯỜI CHƠI</div><p class="draft-hint">Bạn đã chọn 1 lá. 2 lá còn lại vẫn đang ở chỗ bạn và <b>chưa thể chọn tiếp</b>.</p><p class="draft-wait">Khi tất cả đã chọn lá đầu tiên, 2 lá còn lại mới đồng thời được chuyền sang người bên tay trái.</p></div><div id="actionArea"></div>`;
      }
      return;
    }

    h.innerHTML=`<div class="draft-owned"><div class="hand-title">LÁ NINJA CỦA MÌNH — 1/2</div><div class="cardgrid">${selected.slice(0,1).map(c=>fixedCard(c,false,true)).join('')}</div></div><div class="draft-select"><div class="hand-title">LÁ NINJA — CHỌN LÁ 2/2</div><p class="draft-hint">Tất cả người chơi đã chọn lá đầu tiên. Bạn nhận đúng 2 lá từ người bên tay phải; chọn 1 lá, lá còn lại sẽ bỏ.</p><div class="cardgrid">${draft.map(c=>fixedCard(c,true)).join('')}</div></div><div id="actionArea"></div>`;
  };
})();
