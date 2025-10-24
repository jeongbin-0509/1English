// favorite.js — 즐겨찾기 뷰/관리
const $ = (s)=>document.querySelector(s);
const byId = (id)=>document.getElementById(id);

function loadFavBook(){
  try { return JSON.parse(localStorage.getItem('favoriteNotebook') || '{}'); }
  catch { return {}; }
}
function saveFavBook(data){
  localStorage.setItem('favoriteNotebook', JSON.stringify(data));
}
function loadFavIds(){
  try { return new Set(JSON.parse(localStorage.getItem('favorites')||'[]')); }
  catch { return new Set(); }
}
function saveFavIds(set){
  localStorage.setItem('favorites', JSON.stringify([...set]));
}

function renderDays(){
  const wrap = byId('fav-days');
  const data = loadFavBook();
  const days = Object.keys(data).sort((a,b)=>Number(a)-Number(b));

  if (!days.length){
    wrap.innerHTML = `<p style="color:#cfcfcf;text-align:center;margin-top:24px;">즐겨찾기가 비어 있어요.</p>`;
    byId('fav-detail').classList.add('hidden');
    return;
  }

  wrap.innerHTML = days.map(d => `<button class="day-chip" data-day="${d}">DAY ${d}</button>`).join('');
  wrap.querySelectorAll('.day-chip').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      renderDetail(btn.getAttribute('data-day'));
    });
  });
}

function renderDetail(day){
  const data = loadFavBook();
  const items = data[day] || {};
  const ids = Object.keys(items).sort((a,b)=>Number(a)-Number(b));
  const title = byId('fav-title');
  const list = byId('fav-items');

  title.textContent = `DAY ${day} 즐겨찾기`;
  if (!ids.length){
    list.innerHTML = `<p style="color:#cfcfcf;">이 Day의 즐겨찾기가 없습니다.</p>`;
  } else {
    list.innerHTML = ids.map(id=>{
  const it = items[id];
  // ✅ 영어 문장에서 빈칸을 정답 단어로 치환
  const filledSentence = it.e_sentence
    ? escapeHtml(it.e_sentence.replace(/_\d+_|\[___\]|\[.*?\]/g, it.word))
    : "";

  return `
    <article class="fav-card" data-day="${day}" data-id="${id}">
      <header class="fav-head">
        <div class="num">#${id}</div>
        <div class="word">${escapeHtml(it.word || '')}</div>
        <button class="del">삭제</button>
      </header>
      ${filledSentence ? `<div class="sent en">${filledSentence}</div>` : ``}
      ${it.k_sentence ? `<div class="sent ko">${escapeHtml(it.k_sentence)}</div>` : ``}
    </article>
  `;
}).join('');

    // 삭제 버튼 연결
    list.querySelectorAll('.fav-card .del').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const card = btn.closest('.fav-card');
        removeFavorite(card.dataset.day, card.dataset.id);
        renderDetail(day);
        renderDays(); // Day가 비었으면 목록에서도 제거
      });
    });
  }

  byId('fav-detail').classList.remove('hidden');

  // Day 전체 비우기
  byId('clearDayBtn').onclick = ()=>{
    clearDay(day);
    renderDetail(day);
    renderDays();
  };
}

function removeFavorite(day, id){
  // notebook에서 제거
  const book = loadFavBook();
  if (book[day] && book[day][id]) {
    delete book[day][id];
    if (Object.keys(book[day]).length===0) delete book[day];
    saveFavBook(book);
  }
  // id 세트에서도 제거(예문 페이지의 별 상태 반영)
  const favIds = loadFavIds();
  // exID가 없을 수도 있으니 번호기반 제거는 스킵, id세트 유지도 가능
  // 필요하면 exID를 함께 저장해와서 정확 제거 가능(현재는 유지)
}

function clearDay(day){
  const book = loadFavBook();
  if (book[day]) {
    delete book[day];
    saveFavBook(book);
  }
}

function escapeHtml(str){
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

document.addEventListener('DOMContentLoaded', renderDays);
