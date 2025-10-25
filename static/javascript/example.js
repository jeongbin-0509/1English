/* example.html 동작 스크립트 (마지막 화면에서 '다음' 제거 + 이번 세션 오답만 표시) */
const $ = (s) => document.querySelector(s);
const byId = (id) => document.getElementById(id);

/* ===== 사이드바 ===== */
function toggleSidebar(){
  const sb = byId("sidebar");
  const ov = byId("sidebarOverlay");
  const btn = byId("sidebarToggle");
  const willOpen = !sb.classList.contains("active");

  sb.classList.toggle("active", willOpen);
  ov.classList.toggle("active", willOpen);
  btn.setAttribute("aria-expanded", String(willOpen));
  sb.setAttribute("aria-hidden", String(!willOpen));
  document.body.classList.toggle("noscroll", willOpen);
}

document.addEventListener("DOMContentLoaded", () => {
  byId("sidebarToggle")?.addEventListener("click", toggleSidebar);
  byId("sidebarClose")?.addEventListener("click", toggleSidebar);
  byId("sidebarOverlay")?.addEventListener("click", toggleSidebar);
});

/* ===== 상태 ===== */
let words = [];
let examples = [];
let pos = 0;
let correct = 0, wrong = 0;
let mode = "question";
let finished = false;
let favSet = new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));
let wrongsThisRun = []; // ✅ 이번 세션 오답만 저장

/* ===== 데이터 ===== */
async function loadWords(){
  const url = window.WORDS_URL || "../data/words.json";
  const res = await fetch(url);
  if(!res.ok) throw new Error("데이터 로드 실패");
  words = await res.json();
}
function loadDays(){
  try{ return (JSON.parse(sessionStorage.getItem("days")||"[]")||[]).map(Number); }
  catch{ return []; }
}
function filterByDays(all, days){
  if(!days?.length) return all;
  const set = new Set(days);
  return all.filter(w => set.has(Number(w.day)));
}
function flattenExamples(list){
  const out=[]; for(const w of list){
    (Array.isArray(w.examples)?w.examples:[]).forEach((ex,i)=>{
      const exID = ex.exID || `${w.wordnum}-${i}`;
      out.push({ day:+w.day, wordnum:String(w.wordnum), word:w.word, exID, ex });
    });
  } return out;
}
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }

/* ===== 렌더 ===== */
// ✅ 기존 makeInput 교체
function makeInput(exID, idx, ghostChar = "") {
  const g = String(ghostChar || "");
  return `
    <span class="ghost-input">
      <span class="ghost" aria-hidden="true">${escapeHtml(g)}</span>
      <input
        id="in-${exID}-${idx}"
        class="textbox"
        type="text"
        autocomplete="off"
        inputmode="latin"
        spellcheck="false"
        style="color:var(--text,#e8eef5);-webkit-text-fill-color:var(--text,#e8eef5);caret-color:var(--text,#e8eef5);background:transparent;position:relative;z-index:1;"
      />
    </span>
  `;
}


function alignGhosts() {
  document.querySelectorAll('.ghost-input').forEach(wrap => {
    const input = wrap.querySelector('.textbox');
    const ghost = wrap.querySelector('.ghost');
    if (!input || !ghost) return;

    const cs = getComputedStyle(input);

    // 입력 텍스트의 실제 시작 X = border-left + padding-left
    const left =
      parseFloat(cs.borderLeftWidth || 0) +
      parseFloat(cs.paddingLeft || 0);

    ghost.style.left = left + 'px';

    // 폰트 메트릭도 강제로 동일화(혹시 상속이 안될 때 대비)
    ghost.style.font = cs.font;
    ghost.style.letterSpacing = cs.letterSpacing;
    ghost.style.fontWeight = cs.fontWeight;
    ghost.style.lineHeight = cs.lineHeight;
  });
}

// 렌더 직후와 창 리사이즈 때 보정
window.addEventListener('resize', alignGhosts);


// ✅ renderCurrent() 안의 입력칸 생성 부분만 수정
function renderCurrent(){
  const cur = examples[pos]; if(!cur) return;

  byId("counter").textContent = `${pos+1} out of ${examples.length}`;
  byId("favBtn").classList.toggle("is-active", favSet.has(cur.exID));

  let html = cur.ex.e_sentence;
  const count = Number(cur.ex.blank_count || 0);
  const blanks = Array.isArray(cur.ex.blanks) ? cur.ex.blanks : [];

  for (let i = 1; i <= count; i++) {
    const answer = String(blanks[i-1] || "");
    const ghostChar = answer.charAt(0); // ← 앞글자만
    html = html.replace(`_${i}_`, makeInput(cur.exID, i, ghostChar));
  }

  byId("en").innerHTML = html;
  byId("ko").textContent = cur.ex.k_sentence || "";

  hideFeedback();
  hideFinalPanel();

  const first = byId(`in-${cur.exID}-1`); first?.focus();

  const p = Math.round((pos/examples.length)*100);
  byId("progressBar").style.width = p + "%";
  byId("goodCnt").textContent = `${correct} 정답`;
  byId("badCnt").textContent = `${wrong} 오답`;

  mode = "question";
  byId("submitBtn").textContent = "확인";
  byId("submitBtn").disabled = false;
  byId("actions").hidden = false;
}

alignGhosts();


/* ===== 채점 ===== */
function collectUserAnswers(cur){
  const a=[]; const n=Number(cur.ex.blank_count||0);
  for(let i=1;i<=n;i++){ a.push((byId(`in-${cur.exID}-${i}`)?.value||"").trim()); }
  return a;
}

function evaluate(){
  if (finished) return;
  if(mode==="feedback"){ goNext(); return; }

  const cur = examples[pos]; if(!cur) return;
  const key = Array.isArray(cur.ex.blanks)?cur.ex.blanks:[];
  const mine = collectUserAnswers(cur);

  let ok = true;
  key.forEach((ans, i)=>{
    const expect = String(ans).trim().toLowerCase();
    const got = String(mine[i]||"").trim().toLowerCase();
    const el = byId(`in-${cur.exID}-${i+1}`);
    if(!got || expect!==got){ ok=false; el?.classList.add("wrong"); }
    else { el?.classList.remove("wrong"); el?.classList.add("correct"); }
  });

  if(ok){
    correct++; goNext();
  }else{
    wrong++;
    const wrongItem = { exID: cur.exID, ts: Date.now(), expect: key, mine, word: cur.word };
    wrongsThisRun.push(wrongItem);
    const all = JSON.parse(sessionStorage.getItem("wrongs")||"[]");
    all.push(wrongItem);
    sessionStorage.setItem("wrongs", JSON.stringify(all));

        // ★ 오답 노트에 추가 (새 함수 호출)
    addToWrongNotebook(cur, mine, key);

    showFeedback(mine, key);
    mode = "feedback";
    byId("submitBtn").textContent = "다음";

    showFeedback(mine, key);
    mode = "feedback";
    byId("submitBtn").textContent = "다음";
  }

  byId("goodCnt").textContent = `${correct} 정답`;
  byId("badCnt").textContent = `${wrong} 오답`;
}

function goNext(){
  pos++;
  if(pos>=examples.length){
    renderFinal();
    return;
  }
  renderCurrent();
}

/* ===== 피드백 ===== */
function showFeedback(user, key){
  byId("myAnswer").textContent = (user.join(" / ") || "(빈칸)");
  byId("rightAnswer").textContent = key.join(" / ");
  byId("feedback").hidden = false;
}
function hideFeedback(){
  byId("feedback").hidden = true;
  byId("myAnswer").textContent = "-";
  byId("rightAnswer").textContent = "-";
}

/* ===== 즐겨찾기 ===== */
function toggleFavorite(){
  const cur = examples[pos]; if(!cur) return;
  favSet.has(cur.exID) ? favSet.delete(cur.exID) : favSet.add(cur.exID);
  localStorage.setItem("favorites", JSON.stringify([...favSet]));
  byId("favBtn").classList.toggle("is-active", favSet.has(cur.exID));
}

/* ===== 마지막 화면 ===== */
function renderFinal(){
  finished = true;
  byId("counter").textContent="완료!";
  byId("en").innerHTML="수고했어!";
  byId("ko").textContent=`정답 ${correct} / 오답 ${wrong}`;
  byId("progressBar").style.width="100%";
  hideFeedback();

  /* 🔥 '다음' 버튼 완전 제거 */
  byId("submitBtn").remove();

  /* 액션 영역 숨기기 */
  byId("actions").hidden = true;

  /* 결과 버튼 패널 표시 */
  buildAndShowFinalPanel();
}

function buildAndShowFinalPanel(){
  const panel = byId("finalPanel");
  panel.hidden = false;

  byId("btnShowWrong")?.addEventListener("click", showWrongList);
  byId("btnBackToDay")?.addEventListener("click", () => {
    location.href = (window.INDEX_URL || "./index");
  });
}

/* ===== 이번 세션 오답 보기 ===== */
function showWrongList(){
  const listEl = byId("wrongList");
  const data = wrongsThisRun;

  if(!data.length){
    listEl.innerHTML = `<p class="empty">이번 테스트에서 틀린 단어가 없어요. 👍</p>`;
    byId("wrongSection").hidden = false;
    return;
  }

  const items = data.map((w, i) => {
    const mine = (w.mine || []).join(" / ") || "미응답";
    const expect = (w.expect || []).join(" / ");
    const word = w.word ? `<div class="word">단어: <b>${escapeHtml(w.word)}</b></div>` : "";
    return `
      <div class="wrong-item">
        <div class="idx">${i+1}.</div>
        <div class="body">
          ${word}
          <div>내 답: <b>${escapeHtml(mine)}</b></div>
          <div>정답: <b class="ok">${escapeHtml(expect)}</b></div>
        </div>
      </div>
    `;
  }).join("");

  listEl.innerHTML = items;
  byId("wrongSection").hidden = false;
}

/* ===== 유틸 ===== */
function hideFinalPanel(){
  const panel = byId("finalPanel");
  if(panel) panel.hidden = true;
  const sect = byId("wrongSection");
  if(sect) sect.hidden = true;
}
function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

/* ===== 시작 ===== */
async function boot(){
  wrongsThisRun = [];
  await loadWords();
  const list = filterByDays(words, loadDays());
  examples = shuffle(flattenExamples(list.length?list:words));
  renderCurrent();

  byId("submitBtn").addEventListener("click", evaluate);
  byId("favBtn").addEventListener("click", toggleFavorite);

  document.addEventListener("keydown", (e)=>{
    if(e.key==="Enter" && !finished){
      e.preventDefault(); evaluate();
    }
  });
}
document.addEventListener("DOMContentLoaded", boot);

// === 오답 노트(localStorage) 저장 ===
function addToWrongNotebook(cur, mine, key){
  try{
    const store = JSON.parse(localStorage.getItem('wrongNotebook') || '{}');
    const dayKey  = String(cur.day);
    const itemKey = String(cur.wordnum);
    if(!store[dayKey]) store[dayKey] = {};

    const prev = store[dayKey][itemKey] || {
      day: cur.day,
      wordnum: cur.wordnum,
      word: cur.word || "",
      e_sentence: cur.ex?.e_sentence || "",
      k_sentence: cur.ex?.k_sentence || "",
      wrong_count: 0,
      last_wrong: null,
      history: []
    };

    const entry = {
      mine: Array.isArray(mine) ? mine : [],
      expect: Array.isArray(key) ? key : [],
      ts: Date.now()
    };

    // 최신 메타 업데이트
    prev.word        = cur.word || prev.word;
    prev.e_sentence  = cur.ex?.e_sentence || prev.e_sentence;
    prev.k_sentence  = cur.ex?.k_sentence || prev.k_sentence;
    prev.wrong_count = (prev.wrong_count || 0) + 1;
    prev.last_wrong  = entry;

    // 히스토리 누적(최대 50개 정도로 캡)
    prev.history = [entry, ...(prev.history || [])].slice(0, 50);

    store[dayKey][itemKey] = prev;
    localStorage.setItem('wrongNotebook', JSON.stringify(store));
  }catch(e){
    console.warn('wrongNotebook 저장 실패:', e);
  }
}

/* ===== 즐겨찾기 ===== */
function toggleFavorite(){
  const cur = examples[pos]; if(!cur) return;

  if (favSet.has(cur.exID)) {
    // 삭제
    favSet.delete(cur.exID);
    removeFromFavoriteNotebook(cur);
  } else {
    // 추가
    favSet.add(cur.exID);
    addToFavoriteNotebook(cur);
  }

  localStorage.setItem("favorites", JSON.stringify([...favSet]));
  byId("favBtn").classList.toggle("is-active", favSet.has(cur.exID));
}

// ---- 즐겨찾기 노트 저장/삭제 ----
function addToFavoriteNotebook(cur){
  try{
    const store = JSON.parse(localStorage.getItem('favoriteNotebook') || '{}');
    const dayKey = String(cur.day);         // 예: "17"
    const itemKey = String(cur.wordnum);    // 예: "580"
    if(!store[dayKey]) store[dayKey] = {};
    store[dayKey][itemKey] = {
      day: cur.day,
      wordnum: cur.wordnum,
      word: cur.word || "",
      e_sentence: cur.ex?.e_sentence || "",
      k_sentence: cur.ex?.k_sentence || "",
      ts: Date.now()
    };
    localStorage.setItem('favoriteNotebook', JSON.stringify(store));
  }catch(e){ console.warn('favoriteNotebook 저장 실패', e); }
}

function removeFromFavoriteNotebook(cur){
  try{
    const store = JSON.parse(localStorage.getItem('favoriteNotebook') || '{}');
    const dayKey = String(cur.day);
    const itemKey = String(cur.wordnum);
    if (store[dayKey] && store[dayKey][itemKey]) {
      delete store[dayKey][itemKey];
      if (Object.keys(store[dayKey]).length === 0) delete store[dayKey];
      localStorage.setItem('favoriteNotebook', JSON.stringify(store));
    }
  }catch(e){ console.warn('favoriteNotebook 삭제 실패', e); }
}

