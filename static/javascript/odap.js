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







/* 오늘 오답만 보기: 토글 버튼 로직 */

// 오늘 00:00:00 ~ 23:59:59 범위 (브라우저 로컬시간 기준)
function getTodayRange(){
  const now = new Date();
  const start = new Date(now); start.setHours(0,0,0,0);
  const end   = new Date(now); end.setHours(23,59,59,999);
  return [start.getTime(), end.getTime()];
}

// 오늘 날짜에 해당하는 히스토리만 모아서 "하루 뷰"용 아이템 객체를 만든다
function collectTodayItems(){
  const data = loadNotebook();          // { [day]: { [id]: item } }
  const [start, end] = getTodayRange();

  const result = {}; // { [id]: item(clone with today's history) }

  Object.entries(data).forEach(([day, items])=>{
    Object.entries(items).forEach(([id, it])=>{
      const history = Array.isArray(it?.history) ? it.history : [];
      // 오늘 범위에 들어오는 시도만 필터링
      const hits = history.filter(h => typeof h?.ts === 'number' && h.ts >= start && h.ts <= end);
      if (hits.length > 0){
        const clone = { ...it };
        // 오늘 히스토리만 남김
        clone.history = hits;
        // 오늘 중 가장 최근 시도를 last_wrong처럼 보여주기
        const latest = hits[hits.length - 1];
        clone.last_wrong = {
          mine: Array.isArray(latest?.mine) ? latest.mine : (latest?.mine ? [latest.mine] : []),
          expect: Array.isArray(latest?.expect) ? latest.expect : (latest?.expect ? [latest.expect] : [])
        };
        // 오늘 틀린 횟수로 뱃지 보여주고 싶으면 아래 줄 사용(원래 값 유지하려면 지워도 됨)
        clone.wrong_count = hits.length;

        result[id] = clone;
      }
    });
  });

  return result;
}

// "오늘 보기" 전용 렌더 (여러 Day에 흩어진 걸 한 화면에 모아 보여줌)
function renderTodayOnly(){
  const items = collectTodayItems();
  const listEl  = byId('wrong-items');
  const titleEl = byId('detail-title');

  byId('wrong-detail').classList.remove('hidden');

  const ids = Object.keys(items).sort((a,b)=> Number(a)-Number(b));
  if (titleEl) titleEl.textContent = `오늘(금일) 오답 — ${ids.length}개`;

  if (ids.length === 0){
    listEl.innerHTML = `<div class="muted" style="padding:12px">오늘 기록된 오답이 없어요.</div>`;
    return;
  }

  const fmt = new Intl.DateTimeFormat('ko-KR', { dateStyle:'medium', timeStyle:'short' });

  listEl.innerHTML = ids.map(id=>{
    const it   = items[id];
    const last = it?.last_wrong || { mine: [], expect: [] };

    const filled = it?.e_sentence
      ? replaceBlanksWithAnswers(it.e_sentence, (last.expect?.length ? last.expect : [it.word]).filter(Boolean))
      : "";

    const historyArr  = Array.isArray(it?.history) ? it.history : [];
    const historyHtml = historyArr.map((h, idx) => `
      <div class="hist-row">
        <span class="idx">${idx+1}</span>
        <span class="mine">${escapeHtml((h?.mine||[]).join(' / ') || '미응답')}</span>
        <span class="exp">${escapeHtml((h?.expect||[]).join(' / '))}</span>
        <span class="ts">${escapeHtml(h?.ts ? fmt.format(new Date(h.ts)) : '-')}</span>
      </div>
    `).join('');

    const filledHtml = filled ? `<div class="sent en">${filled}</div>` : '';
    const koHtml     = it?.k_sentence ? `<div class="sent ko">${escapeHtml(it.k_sentence)}</div>` : '';

    return `
      <article class="wrong-card">
        <header class="wrong-head">
          <div class="num">#${id}</div>
          <div class="word">${escapeHtml(it?.word || '')}</div>
          <span class="badge">x${Number(it?.wrong_count ?? 1)}</span>
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

  // 상세 위치로 스크롤 UX
  requestAnimationFrame(()=>{
    window.scrollTo({ top: byId('wrong-detail').offsetTop - 16, behavior:'smooth' });
  });
}

// 토글: 오늘 보기 ON → 오늘 렌더 / OFF → 기본 화면으로 복귀
document.addEventListener('DOMContentLoaded', ()=>{
  const btn = byId('show-today-btn');
  if (!btn) return;

  btn.addEventListener('click', ()=>{
    const active = btn.classList.toggle('active');
    btn.setAttribute('aria-pressed', String(active));

    if (active){
      renderTodayOnly();
    }else{
      // 기본 화면으로 복귀: Day 목록만 다시
      renderDays();
      byId('wrong-detail')?.classList.add('hidden');
    }
  });
});
