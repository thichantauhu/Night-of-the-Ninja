let ws=null, me=null, room=null, selectedCard=null;
const $=s=>document.querySelector(s);
function connect(){ ws=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}`); ws.onopen=()=>{}; ws.onclose=()=>setMsg('Mất kết nối máy chủ.'); ws.onmessage=e=>handle(JSON.parse(e.data)); }
function send(type,data={}){if(ws?.readyState===1)ws.send(JSON.stringify({type,...data}))}
function setMsg(x){$('#msg').textContent=x||''}
function handle(m){
 if(m.type==='error'){setMsg(m.message);return}
 if(m.type==='joined'){me=m.id;$('#roomCode').textContent=m.code;$('#lobby').classList.add('hidden');$('#game').classList.remove('hidden');return}
 if(m.type==='state'){room=m.room;render();return}
 if(m.type==='private'){renderPrivate(m);return}
 if(m.type==='chat'){const d=document.createElement('div');d.className='message';d.innerHTML=`<b>${esc(m.name)}</b>${esc(m.text)}`;$('#messages').appendChild(d);$('#messages').scrollTop=99999}
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function render(){
 $('#count').textContent=`${room.players.length}/11`;$('#round').textContent=room.round;$('#phase').textContent=room.status==='lobby'?'PHÒNG CHỜ':room.phase||'';
 $('#players').innerHTML=room.players.map(p=>`<div class="player ${p.id===me?'me':''}"><span class="dot ${p.alive?'':'dead'}"></span><span class="pname">${esc(p.name)}${p.id===me?' (Bạn)':''}</span>${room.status!=='lobby'&&p.alive===false?'<span class="rankmark">☠</span>':''}</div>`).join('');
 const idx=['SPY','MYSTIC','TRICKSTER','BLIND ASSASSIN','SHINOBI'].indexOf(room.phase);$('#phaseList').innerHTML=['SPY','MYSTIC','TRICKSTER','BLIND ASSASSIN','SHINOBI'].map((x,i)=>`<span class="${i===idx?'active':''}">${i+1} ${x}</span>`).join('');
 $('#notice').textContent=room.status==='lobby'?(room.host===me?'Bạn là chủ phòng. Cần 4–11 người để bắt đầu.':'Chờ chủ phòng bắt đầu game...'):room.log?.at(-1)||'';
 const center=$('#center');
 if(room.status==='lobby'){center.innerHTML=`<div class="empty"><h3>Chờ người chơi</h3><p>Gửi mã <b>${room.code}</b> cho bạn bè.</p>${room.host===me?'<div class="host-controls"><button onclick="startGame()">Bắt đầu game</button></div>':''}</div>`;}
 else if(room.status==='paused'){center.innerHTML='<div class="pause"><h3>GAME ĐANG TẠM DỪNG</h3><p>Bất kỳ người chơi nào cũng có thể tiếp tục.</p><button onclick="resumeGame()">Tiếp tục</button></div>';}
 else if(room.status==='round_end'){center.innerHTML=`<div class="result"><div class="eyebrow">KẾT THÚC ROUND</div><h3>${room.winner?esc(room.winner)+' THẮNG':'HÒA'}</h3><p>Honor đã được cộng. ${room.host===me?'<button onclick="continueRound()">Round tiếp theo</button>':''}</p></div>`;}
 else if(room.status==='ended'){center.innerHTML='<div class="result"><h3>GAME ĐÃ KẾT THÚC</h3><p>Phòng đã đóng.</p></div>';}
 else {center.innerHTML=`<div class="empty">${room.status==='draft'?'Chọn Ninja card của bạn bên dưới.':'Đang chờ người chơi thực hiện hành động trong '+esc(room.phase)+'.'}</div>`}
}
function renderPrivate(m){
 $('#house').textContent=m.house||'—';$('#rank').textContent=m.rank??'—';$('#honor').textContent=m.honor??0;
 $('#known').innerHTML=m.known?.length?m.known.map(x=>`<div><b>${esc(x.name)}</b> — ${esc(x.house)} ${x.rank}</div>`).join(''):'Chưa có thông tin.';
 const hand=$('#hand');
 if(m.hand?.length){hand.innerHTML='<div class="hand-title">NINJA CARDS CỦA BẠN</div><div class="cardgrid">'+m.hand.map(c=>cardHtml(c,m)).join('')+'</div>';} else hand.innerHTML='';
}
function cardHtml(c,m){const playable=room?.status==='night'&&c.type===room.phase;return `<div class="ncard ${playable?'':'disabled'}" onclick="selectCard('${c.id}')"><span class="type">${esc(c.type)}</span><span class="num">${c.num??''}</span><span class="name">${esc(c.name||c.type)}</span><span class="desc">${esc(c.text)}</span></div>`}
function selectCard(id){selectedCard=id;const c=lastPrivate?.hand?.find(x=>x.id===id);if(!c)return; if(room.status==='draft'){send('draftPick',{cardId:id});selectedCard=null;return;} if(room.status==='night'&&c.type===room.phase){const target=prompt('Nhập tên người chơi muốn chọn (để trống nếu không cần mục tiêu):');const p=room.players.find(x=>x.name.toLowerCase()===String(target||'').toLowerCase());send('play',{cardId:id,targetId:p?.id});selectedCard=null;}}
let lastPrivate=null;const oldHandle=handle;handle=function(m){if(m.type==='private')lastPrivate=m;oldHandle(m)};
window.startGame=()=>send('start');window.continueRound=()=>send('continueRound');window.resumeGame=()=>{send('pause')};
$('#create').onclick=()=>{const name=$('#name').value.trim()||'Người chơi';connect();setTimeout(()=>send('create',{name}),200)};
$('#join').onclick=()=>{const name=$('#name').value.trim()||'Người chơi';const code=$('#code').value.trim().toUpperCase();connect();setTimeout(()=>send('join',{name,code}),200)};
$('#sendChat').onclick=()=>{const i=$('#chatInput');if(i.value.trim()){send('chat',{text:i.value.trim()});i.value='';}};$('#chatInput').onkeydown=e=>{if(e.key==='Enter')$('#sendChat').click()};$('#pause').onclick=()=>send('pause');$('#end').onclick=()=>{if(confirm('Kết thúc game cho tất cả người chơi?'))send('end')};
