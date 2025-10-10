// wb.js — JSON fetch + ?day= 필터 + 템플릿 복제 + _n_ → blanks[n-1] 치환

const DATA_URL = "../static/data/words.json"; // 경로 수정

// ---- util
const qs = (s, p=document) => p.querySelector(s);
const txt = (el, v) => { if (el) el.textContent = v ?? ""; };
const html = (el, v) => { if (el) el.innerHTML = v ?? ""; };
const esc = s => String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

// ---- favorites (localStorage)
const LS_KEY = 'wb_starred';

function getStarred() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) ?? []; }
  catch { return []; }
}
function setStarred(arr) {
  const uniqSorted = [...new Set(arr)].map(n=>Number(n)).filter(Number.isFinite).sort((a,b)=>a-b);
  localStorage.setItem(LS_KEY, JSON.stringify(uniqSorted));
}
function isStarred(wordnum) {
  const set = new Set(getStarred());
  return set.has(Number(wordnum));
}
function toggleStarred(wordnum) {
  const set = new Set(getStarred());
  const k = Number(wordnum);
  if (set.has(k)) set.delete(k); else set.add(k);
  setStarred([...set]);
}


// _n_ → blanks[n-1] 치환. 없으면 빈칸 표시.
function renderBlanks(sentence, blanks = []) {
  return String(sentence ?? "").replace(/_(\d+)_/g, (_, n) => {
    const i = Number(n) - 1;
    const val = blanks?.[i];
    return val == null
      ? '<span class="blank">____</span>'
      : `<span class="filledblank">${esc(val)}</span>`;
  });
}

// meaning 안의 텍스트 노드만 교체(별 아이콘 유지)
function setMeaningText(meaningEl, text) {
  let done = false;
  meaningEl?.childNodes.forEach(n => {
    if (n.nodeType === Node.TEXT_NODE) { n.nodeValue = text ?? ""; done = true; }
  });
  if (!done && meaningEl) meaningEl.insertBefore(document.createTextNode(text ?? ""), meaningEl.firstChild);
}

// 예문 블록 생성
function buildExampleBlock(tplEB, ex) {
  const eb = tplEB.cloneNode(true);
  setMeaningText(qs(".meaning", eb), ex?.meaning ?? "");
  const eEl = qs(".esentence", eb);
  const kEl = qs(".ksentence", eb);
  if (eEl) html(eEl, renderBlanks(ex?.e_sentence, ex?.blanks));
  if (kEl) txt(kEl, ex?.k_sentence ?? "");
  const star = qs(".meaning .star", eb);
  if (star) { star.classList.remove("active"); star.textContent = "☆"; }
  return eb;
}

// 단어 컨테이너 생성
function buildWordContainer(tplWC, tplEB, item) {
  const wc = tplWC.cloneNode(false);               // 빈 컨테이너만
  const header = qs("header", tplWC).cloneNode(true);
  txt(qs(".word", header), item?.word ?? "");
  txt(qs(".wordnum", header), String(item?.wordnum ?? ""));
  wc.appendChild(header);

  const examples = Array.isArray(item?.examples) ? item.examples : [];
  for (const ex of examples) wc.appendChild(buildExampleBlock(tplEB, ex));
  return wc;
}

async function main() {
  const root = qs(".wordblock");
  const unselected = qs(".unselected");
  const tplWC = qs(".wordcontainer", root);
  const tplEB = qs(".exampleblock", tplWC);

  if (!root || !tplWC || !tplEB) { console.error("템플릿 누락"); return; }

  const params = new URLSearchParams(location.search);
  const dayParam = params.get("day");
  const day = dayParam ? Number(dayParam) : NaN;

  if (!Number.isFinite(day)) { if (unselected) unselected.style.display = ""; return; }
  if (unselected) unselected.style.display = "none";

  // 템플릿 분리 후 비우기
  const wcTemplate = tplWC.cloneNode(true);
  const ebTemplate = tplEB.cloneNode(true);
  root.innerHTML = "";

  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("JSON 루트는 배열이어야 함");

    const list = data.filter(v => Number(v.day) === day);
    if (list.length === 0) {
      if (unselected) {
        unselected.style.display = "";
        const msg = qs("#plzselect", unselected);
        if (msg) msg.textContent = `DAY ${day} 데이터가 없습니다`;
      }
      return;
    }

    const frag = document.createDocumentFragment();
    for (const item of list) frag.appendChild(buildWordContainer(wcTemplate, ebTemplate, item));
    root.appendChild(frag);
  } catch (err) {
    console.error(err);
    if (unselected) {
      unselected.style.display = "";
      const msg = qs("#plzselect", unselected);
      if (msg) msg.textContent = "데이터 로드 오류";
    }
  }
}

document.addEventListener("DOMContentLoaded", main);

// DAY 클릭 → ?day=숫자 로 이동
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[id^="day"]');
  if (!btn) return;
  const n = parseInt(btn.id.slice(3), 10);
  if (!Number.isInteger(n)) return;

  // 사이드바 닫기
  const menu = document.getElementById('menuicon');
  if (menu) menu.checked = false;

  // 해당 day로 이동
  const url = new URL(location.href);
  url.searchParams.set('day', n);
  location.href = url.toString();
});


// [수정] buildWordContainer: 컨테이너에 data-wordnum 부여
function buildWordContainer(tplWC, tplEB, item) {
  const wc = tplWC.cloneNode(false);
  wc.setAttribute('data-wordnum', String(item?.wordnum ?? ''));

  const header = qs("header", tplWC).cloneNode(true);
  txt(qs(".word", header), item?.word ?? "");
  txt(qs(".wordnum", header), String(item?.wordnum ?? ""));
  wc.appendChild(header);

  const examples = Array.isArray(item?.examples) ? item.examples : [];
  for (const ex of examples) wc.appendChild(buildExampleBlock(tplEB, ex));

  // [추가] 이 컨테이너의 모든 별을 즐겨찾기 상태와 동기화
  syncStarsIn(wc);
  return wc;
}

// [추가] 별 UI 동기화 (컨테이너 단위/전체)
function syncStarsIn(container) {
  const wordnum = Number(container?.getAttribute('data-wordnum'));
  const active = isStarred(wordnum);
  container.querySelectorAll('.star').forEach(star => {
    star.classList.toggle('active', active);
    star.textContent = active ? '★' : '☆';
    star.setAttribute('role', 'button');
    star.setAttribute('tabindex', '0');
    star.setAttribute('aria-pressed', String(active));
    star.setAttribute('aria-label', active ? '즐겨찾기 해제' : '즐겨찾기에 추가');
  });
}
function syncAllStars() {
  document.querySelectorAll('.wordcontainer').forEach(syncStarsIn);
}


async function main() {
  const root = qs(".wordblock");
  const unselected = qs(".unselected");
  const tplWC = qs(".wordcontainer", root);
  const tplEB = qs(".exampleblock", tplWC);

  if (!root || !tplWC || !tplEB) { console.error("템플릿 누락"); return; }

  const params = new URLSearchParams(location.search);
  const dayParam = params.get("day");
  const starredParam = params.get("starred");           
  const isStarPage = starredParam === '1';             
  const day = dayParam ? Number(dayParam) : NaN;

  if (!isStarPage && !Number.isFinite(day)) {
    if (unselected) unselected.style.display = "";
    return;
  }
  if (unselected) unselected.style.display = "none";

  const wcTemplate = tplWC.cloneNode(true);
  const ebTemplate = tplEB.cloneNode(true);
  root.innerHTML = "";

  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("JSON 루트는 배열이어야 함");

    let list = [];
    if (isStarPage) {
      const fav = new Set(getStarred());
      list = data.filter(v => fav.has(Number(v.wordnum)));
      if (list.length === 0 && unselected) {
        unselected.style.display = "";
        const msg = qs("#plzselect", unselected);
        if (msg) msg.textContent = "즐겨찾기한 단어가 없습니다 (★를 눌러 추가하세요)";
        return;
      }
    } else {
      list = data.filter(v => Number(v.day) === day);
      if (list.length === 0 && unselected) {
        unselected.style.display = "";
        const msg = qs("#plzselect", unselected);
        if (msg) msg.textContent = `DAY ${day} 데이터가 없습니다`;
        return;
      }
    }

    const frag = document.createDocumentFragment();
    for (const item of list) frag.appendChild(buildWordContainer(wcTemplate, ebTemplate, item));
    root.appendChild(frag);

    // [추가] 초기 동기화(혹시 모를 상태 불일치 대비)
    syncAllStars();
  } catch (err) {
    console.error(err);
    if (unselected) {
      unselected.style.display = "";
      const msg = qs("#plzselect", unselected);
      if (msg) msg.textContent = "데이터 로드 오류";
    }
  }
}

// [추가] 별 클릭/키보드 토글 (이벤트 위임)
document.addEventListener('click', (e) => {
  const star = e.target.closest('.star');
  if (star) {
    const wc = star.closest('.wordcontainer');
    if (!wc) return;
    const wordnum = Number(wc.getAttribute('data-wordnum'));
    if (!Number.isFinite(wordnum)) return;
    toggleStarred(wordnum);
    // 해당 컨테이너와, 같은 단어의 모든 별 동기화
    syncStarsIn(wc);
    return;
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const star = e.target.closest('.star');
  if (!star) return;
  e.preventDefault();
  star.click();
});

// [수정] DAY 클릭 → ?day=숫자 (기존) + [추가] ★ 클릭 → ?starred=1
document.addEventListener('click', (e) => {
  // ★ 즐겨찾기 목록 보기
  if (e.target && e.target.id === 'starred') {
    const menu = document.getElementById('menuicon');
    if (menu) menu.checked = false;

    const url = new URL(location.href);
    url.searchParams.delete('day');
    url.searchParams.set('starred', '1');
    location.href = url.toString();
    return;
  }

  // 기존 DAY 처리
  const btn = e.target.closest('[id^="day"]');
  if (!btn) return;
  const n = parseInt(btn.id.slice(3), 10);
  if (!Number.isInteger(n)) return;

  const menu = document.getElementById('menuicon');
  if (menu) menu.checked = false;

  const url = new URL(location.href);
  url.searchParams.set('day', n);
  url.searchParams.delete('starred'); 
  location.href = url.toString();
});