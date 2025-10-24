// odap.js — 오답 노트 뷰어
const $ = (s)=>document.querySelector(s);
const byId = (id)=>document.getElementById(id);

function loadNotebook(){
  try{
    return JSON.parse(localStorage.getItem('wrongNotebook') || '{}');
  }catch(e){
    console.warn('wrongNotebook 파싱 실패', e);
    return {};
  }
}

// Day 목록 그리기
function renderDays(){
  const wrap = byId('wrong-days');
  const data = loadNotebook();
  const days = Object.keys(data).sort((a,b)=> Number(a)-Number(b));

  if(days.length===0){
    wrap.innerHTML = `<p style="color:#cfcfcf; text-align:center; margin-top:24px;">아직 오답 노트가 비어 있어요. 🤓</p>`;
    byId('wrong-detail').classList.add('hidden');
    return;
  }

  wrap.innerHTML = days.map(d =>
    `<button class="day-chip" data-day="${d}">DAY ${d}</button>`
  ).join('');

  wrap.querySelectorAll('.day-chip').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const day = btn.getAttribute('data-day');
      renderDetail(day);
    });
  });
}

// 특정 Day 상세 그리기
// 특정 Day 상세 그리기
function renderDetail(day){
  const data  = loadNotebook();
  const items = data[day] || {};
  const ids   = Object.keys(items).sort((a,b)=> Number(a)-Number(b));

  const title = byId('detail-title');   // 제목 영역 (있다면)
  const list  = byId('wrong-items');    // 리스트 컨테이너 (필수)

  if (title) title.textContent = `DAY ${day} 오답 목록`;

  list.innerHTML = ids.map(id=>{
    const it   = items[id];
    const last = it?.last_wrong || { mine: [], expect: [] };

    // 예문 빈칸을 정답(또는 단어)로 채워서 표시
    const filled = it?.e_sentence
      ? replaceBlanksWithAnswers(it.e_sentence, (last.expect && last.expect.length) ? last.expect : [it.word])
      : "";

    // 과거 시도 히스토리
    const historyArr  = Array.isArray(it?.history) ? it.history : [];
    const historyHtml = historyArr.map((h, idx) => `
      <div class="hist-row">
        <span class="idx">${idx+1}</span>
        <span class="mine">${escapeHtml((h.mine||[]).join(' / ') || '미응답')}</span>
        <span class="exp">${escapeHtml((h.expect||[]).join(' / '))}</span>
        <span class="ts">${new Date(h.ts).toLocaleString()}</span>
      </div>
    `).join('');

    const filledHtml = filled ? `<div class="sent en">${filled}</div>` : '';
    const koHtml     = it?.k_sentence ? `<div class="sent ko">${escapeHtml(it.k_sentence)}</div>` : '';

    return `
      <article class="wrong-card">
        <header class="wrong-head">
          <div class="num">#${id}</div>
          <div class="word">${escapeHtml(it?.word || '')}</div>
          <span class="badge">x${it?.wrong_count || 1}</span>
        </header>

        <div class="pair"><span class="label">내 답</span><span class="val">${escapeHtml((last.mine||[]).join(' / ') || '미응답')}</span></div>
        <div class="pair"><span class="label">정답</span><span class="val ok">${escapeHtml((last.expect||[]).join(' / '))}</span></div>

        ${filledHtml}
        ${koHtml}

        <details class="history">
          <summary>히스토리 보기</summary>
          <div class="hist-wrap">${historyHtml || '<div class="muted">기록 없음</div>'}</div>
        </details>
      </article>
    `;
  }).join('');

  byId('wrong-detail').classList.remove('hidden');
  // 스크롤 약간 내리기(선택 시 UX)
  setTimeout(()=>{ 
    window.scrollTo({ top: byId('wrong-detail').offsetTop - 16, behavior:'smooth' }); 
  }, 0);
}


// 영문 예문의 _1_ 같은 표기를 [___]로 치환(가독)
function replaceBlanksWithAnswers(sentence, answers = []) {
  let html = escapeHtml(String(sentence));
  answers.forEach((ans, i) => {
    const safe = escapeHtml(ans);
    const re = new RegExp(`_${i+1}_`, 'g');
    html = html.replace(re, `<span class="fill">${safe}</span>`);
  });
  // 남은 빈칸은 단어(하나만 있는 경우)로 메우거나 제거
  if (answers.length === 1) {
    html = html.replace(/_\d+_/g, `<span class="fill">${escapeHtml(answers[0])}</span>`);
  } else {
    html = html.replace(/_\d+_/g, '');
  }
  return html;
}

function escapeHtml(str){
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

document.addEventListener('DOMContentLoaded', ()=>{
  renderDays();
});
