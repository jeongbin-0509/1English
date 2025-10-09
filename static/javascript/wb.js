// wb.js — JSON fetch + ?day= 필터 + 템플릿 복제 + _n_ → blanks[n-1] 치환

const DATA_URL = "../static/data/words.json"; // 경로 수정

// ---- util
const qs = (s, p=document) => p.querySelector(s);
const txt = (el, v) => { if (el) el.textContent = v ?? ""; };
const html = (el, v) => { if (el) el.innerHTML = v ?? ""; };
const esc = s => String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

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
