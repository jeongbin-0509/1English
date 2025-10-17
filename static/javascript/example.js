// example.html과 연동시키는 파일
// 여기는 함수 써서 조립하는 식으로 코드 구성하자

let word_list = []; // JSON 데이터 전부 다 들어간 리스트
let day_list = []; // 사용자가 원하는 day를 sessionStorage에서 가져옴

/* 데이터 처리 */

async function load_data() { 
    // words.json의 데이터를 word_list로 옮김
    // parameter: -; return: void

    const res = fetch("../data/words.json");
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    
    word_list = await res.json();
}

function filter_data(word_list, day_list) {
    // word_list에서 day_list에 포함되는 day만 선택해서 남김
    // 랜덤으로 섞음
    // parameter: word_list, day_list:int[]; return: filtered_list

    const f_list = word_list.filter(e => day_list.includes(e.day));
    // Fisher-Yates Shuffle
    arr = f_list.slice();
    for (let i=arr.length-1; i>0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }

    return arr;
}

function load_day() {
    // day_list를 sessionStorage에서 가져옴
    // parameter: -; return: day_list:int[]

    try {
        const raw = sessionStorage.getItem("days");
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/* 기능 처리 */

/* 실행 부분 */



