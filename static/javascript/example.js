// example.html과 연동시키는 파일
// 여기는 함수 써서 조립하는 식으로 코드 구성하자

let word_list = []; // JSON 데이터 전부 다 들어간 리스트
let day_list = []; // 사용자가 원하는 day를 sessionStorage에서 가져옴

/* 데이터 처리 */

async function load_data() { 
    // words.json의 데이터를 word_list로 옮김
    // parameter: -; return: void

    const res = await fetch("../static/data/words.json");
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    
    word_list = await res.json();
}

function shuffled(a) {
    // 배열을 랜덤으러 섞어줘요 ㅎㅎ
    let arr = a.slice();
    for (let i=arr.length-1; i>0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
}

function filter_data(word_list, day_list) {
    // word_list에서 day_list에 포함되는 day만 선택해서 남김
    // 랜덤으로 섞음
    // parameter: word_list, day_list:int[]; return: filtered_list

    // 1) day 필터
    const f_list = word_list.filter(w => day_list.includes(Number(w.day)));

    // 2) 예문 평탄화 + exID 보장
    const flat = [];
    for (const w of f_list) {
        const exs = Array.isArray(w.examples) ? w.examples : [];
        for (let i=0; i<exs.length; i++){
            const ex = exs[i];
            const exID = ex.exID ?? `${w.wordnum}-${i}`;
            if (!ex.exID){ ex.exID = exID; ex.origIndex ??= i; }
            flat.push({
            day: Number(w.day),
            wordnum: w.wordnum,
            word: w.word,
            exID,
            origIndex: ex.origIndex ?? i,
            ex
            });
        }
    }

  // 3) 전역 셔플
    return shuffled(flat);
}

function load_day() {
  // day_list를 sessionStorage에서 가져옴
  // parameter: -; return: day_list:int[]
    try {
        const raw = sessionStorage.getItem("days");
        const arr = raw ? JSON.parse(raw) : [];
        return arr.map(Number).filter(Number.isFinite);
    } catch {
        return [];
    }
}

function add_exid_inplace() {
    // word_list에 exID 추가하기
    for (const item of word_list) {
        const exs = Array.isArray(item.examples) ? item.examples : [];
        for (let i = 0; i < exs.length; i++) {
            exs[i].exID = `${String(item.wordnum)}-${i}`; // 예: "1123-0"
            exs[i].origIndex = i;                         // 선택: 원래 위치
        }
    }
}
/* 기능 처리 */

function insert_textbox(wordobj) {
    // 기존 영어 문장에 input:text를 집어넣은 html형식 텍스트 리턴
    // parameter: wordobj(words.json 형식에서 예문 블럭 하나)

    let html_text = wordobj.e_sentence;
    for (let i=1; i<=wordobj.blank_count; i++) {
        html_text = html_text.replace(`_${i}_`, insert_textbox2(wordobj, i));
    }

    return html_text;

}
function insert_textbox2(wordobj, nth) {
    // 이 함수는 이승민만 사용할거임
    // 쓰지마 종호범서핑
    // nth 번째 빈칸을 뚫어주는 함수

    const inputbox = `<input type="text" id="inputbox" placeholder="${wordobj.blanks[nth-1][0]}"></input>`;
    return inputbox;
}

function upload_wrongwords(wrong_words) {
    // wrong_words에 틀린 단어를 받아서 exID 형식으로 저장
    sessionStorage.setItem("wrongs", JSON.stringify(wrong_words));
}

/* 실행 부분 */

load_data(); // 데이터 가져옴
day_list = load_day(); // day_list 가져옴
add_exid_inplace(); // 모든 예문 블럭에 exID (단어번호-예문번호) 추가

const filtered_list = filter_data(word_list, day_list); // day에 맞는 예문을 섞어줌




