// wb.js — JSON fetch + ?day=/starred + 템플릿 복제 + _n_ 치환 + 예문별 ★ 저장

const DATA_URL = "../static/data/words.json";

// ---- util
const qs = (s, p=document) => p.querySelector(s);
const txt = (el, v) => { if (el) el.textContent = v ?? ""; };
const html = (el, v) => { if (el) el.innerHTML = v ?? ""; };
const esc = s => String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

// ---- favorites (예문 단위, localStorage)
const LS_KEY = 'wb_starred_examples'; // exID 배열 저장. exID = `${wordnum}-${exIndex}`

function getStarredSet() {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_KEY)) ?? [];
    return new Set(arr.filter(x=>typeof x==='string'));
  } catch { return new Set(); }
}
function saveStarred(set) {
  localStorage.setItem(LS_KEY, JSON.stringify([...set]));
}
function isStarredEx(exID) {
  return getStarredSet().has(String(exID));
}
function toggleStarredEx(exID) {
  const set = getStarredSet();
  const k = String(exID);
  if (set.has(k)) set.delete(k); else set.add(k);
  saveStarred(set);
}

// _n_ → blanks[n-1] 치환
function renderBlanks(sentence, blanks = []) {
  return String(sentence ?? "").replace(/_(\d+)_/g, (_, n) => {
    const i = Number(n) - 1;
    const val = blanks?.[i];
    return val == null
      ? '<span class="blank">____</span>'
      : `<span class="filledblank">${esc(val)}</span>`;
  });
}

// meaning 안의 텍스트 노드만 교체
function setMeaningText(meaningEl, text) {
  let done = false;
  meaningEl?.childNodes.forEach(n => {
    if (n.nodeType === Node.TEXT_NODE) { n.nodeValue = text ?? ""; done = true; }
  });
  if (!done && meaningEl) meaningEl.insertBefore(document.createTextNode(text ?? ""), meaningEl.firstChild);
}

// 예문 블록 생성 (예문별 ★ 상태 반영)
function buildExampleBlock(tplEB, ex, exID) {
  const eb = tplEB.cloneNode(true);
  eb.setAttribute('data-exid', exID);

  setMeaningText(qs(".meaning", eb), ex?.meaning ?? "");
  const eEl = qs(".esentence", eb);
  const kEl = qs(".ksentence", eb);
  if (eEl) html(eEl, renderBlanks(ex?.e_sentence, ex?.blanks));
  if (kEl) txt(kEl, ex?.k_sentence ?? "");

  const star = qs(".meaning .star", eb);
  if (star) {
    const active = isStarredEx(exID);
    star.classList.toggle('active', active);
    star.textContent = active ? "★" : "☆";
    star.setAttribute('role', 'button');
    star.setAttribute('tabindex', '0');
    star.setAttribute('aria-pressed', String(active));
    star.setAttribute('aria-label', active ? '즐겨찾기 해제' : '즐겨찾기에 추가');
  }
  return eb;
}

// 단어 컨테이너 생성 (예문 리스트 주입)
function buildWordContainer(tplWC, tplEB, item, examples) {
  const wc = tplWC.cloneNode(false);
  wc.setAttribute('data-wordnum', String(item?.wordnum ?? ''));

  const header = qs("header", tplWC).cloneNode(true);
  txt(qs(".word", header), item?.word ?? "");
  txt(qs(".wordnum", header), String(item?.wordnum ?? ""));
  wc.appendChild(header);

  examples.forEach((ex, idx) => {
    const exID = `${item?.wordnum}-${idx}`;
    wc.appendChild(buildExampleBlock(tplEB, ex, exID));
  });
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
  const starredParam = params.get("starred");
  const isStarPage = starredParam === '1';
  const day = dayParam ? Number(dayParam) : NaN;

  if (!isStarPage && !Number.isFinite(day)) { if (unselected) unselected.style.display = ""; return; }
  if (unselected) unselected.style.display = "none";

  const wcTemplate = tplWC.cloneNode(true);
  const ebTemplate = tplEB.cloneNode(true);
  root.innerHTML = "";

  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("JSON 루트는 배열이어야 함");

    const frag = document.createDocumentFragment();
    const favSet = getStarredSet();

    // 단어별로 예문 필터링 후 렌더
    const byWord = (isStarPage
      ? data // 즐겨찾기 페이지는 전체 탐색
      : data.filter(v => Number(v.day) === day));

    let renderedCount = 0;
    for (const item of byWord) {
      const examples = Array.isArray(item?.examples) ? item.examples : [];
      const filtered = isStarPage
        ? examples.map((ex, idx) => ({ ex, idx }))
                  .filter(({idx}) => favSet.has(`${item.wordnum}-${idx}`))
                  .map(({ex}) => ex)
        : examples;

      if (filtered.length === 0) continue;
      frag.appendChild(buildWordContainer(wcTemplate, ebTemplate, item, filtered));
      renderedCount += filtered.length;
    }

    if (renderedCount === 0) {
      if (unselected) {
        unselected.style.display = "";
        const msg = qs("#plzselect", unselected);
        msg && (msg.textContent = isStarPage ? "즐겨찾기한 예문이 없습니다 (★를 눌러 추가하세요)" : `DAY ${day} 데이터가 없습니다`);
      }
      return;
    }

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

// 이벤트 위임: ★ 토글
document.addEventListener('click', (e) => {
  const star = e.target.closest('.star');
  if (star) {
    const eb = star.closest('.exampleblock');
    if (!eb) return;
    const exID = eb.getAttribute('data-exid');
    if (!exID) return;
    toggleStarredEx(exID);

    const active = isStarredEx(exID);
    star.classList.toggle('active', active);
    star.textContent = active ? '★' : '☆';
    star.setAttribute('aria-pressed', String(active));
    star.setAttribute('aria-label', active ? '즐겨찾기 해제' : '즐겨찾기에 추가');
    return;
  }
});

// 키보드 접근성
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const star = e.target.closest('.star');
  if (!star) return;
  e.preventDefault();
  star.click();
});

// 네비게이션: ★ 목록 / DAY 이동
document.addEventListener('click', (e) => {
  // 즐겨찾기 페이지
  if (e.target && e.target.id === 'starred') {
    const menu = document.getElementById('menuicon');
    if (menu) menu.checked = false;

    const url = new URL(location.href);
    url.searchParams.delete('day');
    url.searchParams.set('starred', '1');
    location.href = url.toString();
    return;
  }

  // DAY 이동
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

document.getElementById("linktologin").addEventListener("click", () => {
  window.location.href = "/login";
})

document.getElementById("cheerup").addEventListener("click", () => {
  alert("세미콜론 화이팅 >_<");
})
