// example.html과 연동시키는 파일
// 여기는 함수 써서 조립하는 식으로 코드 구성하자

let word_list = []; // JSON 데이터 전부 다 들어간 리스트

/* 데이터 처리 */

async function load_data() { 
    // words.json의 데이터를 word_list로 옮김
    // return: void
    const res = fetch("../data/words.json");
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    
    word_list = await res.json();
}





