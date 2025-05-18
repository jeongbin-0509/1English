const params = new URLSearchParams(window.location.search);
const days = params.getAll("day");

let sts = {
    cNum : 1,
    cDay : 0,
    cWord : "",
    isRest : false,
    len : 50
}

// Day 선택이 0개이면 다시 돌려보내기
if (days.length == 0) {
    alert("Day를 선택해주세요.");
    location.href = "./html.html";
}

// 예문 + 빈칸 생성

const newExample = data => { // data에 [int : day, string : 단어, string : 예문, string : 뜻]
    sts.cDay = data[0];
    sts.cWord = data[1];

    document.querySelector("#progress").innerHTML = sts.cNum + " / " + sts.len;

    document.querySelector("#exp").innerHTML = `
        <p>${data[2].replace(/__/, `<input type="text" id="answer" placeholder="${sts.cWord.slice(0,1)}" autocomplete="off">`)}</p>`;

    // 형식 : <p><span>예문</span>빈칸<span>예문</span></p>
    document.querySelector("#answer").style.color = "#000000";

    document.querySelector("#asp").innerHTML = `<p>${data[3]}</p>`

    // 형식 : <p>뜻</p>

    sts.cNum++;

    return ; // 이녀석이 ㄹㅇ 단어 original임 요녀석을 쓰세요요
}

// 데이터 불러오는 코드

function parseCSV(text) {
    const rows = [];
    let row = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        // 따옴표 쌍 안에 따옴표가 두 개 연속 나오는 경우 (이중 따옴표)
        if ((char === '"' || char === '“' || char === '”') && inQuotes && (nextChar === '"' || nextChar === '“' || nextChar === '”')) {
            current += '"'; // 실제 따옴표 한 개 넣기
            i++;
        }
        // 따옴표 시작/끝 토글
        else if (char === '"' || char === '“' || char === '”') {
            inQuotes = !inQuotes;
        }
        // 콤마인데 따옴표 안이면 그냥 문자, 밖이면 셀 구분
        else if (char === ',' && !inQuotes) {
            row.push(current.trim());
            current = '';
        }
        // 줄바꿈인데 따옴표 안이면 그냥 문자, 밖이면 행 구분
        else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (current !== '' || row.length > 0) {
                row.push(current.trim());
                rows.push(row.map(cell => cell.replace(/[“”]/g, '"')));
                row = [];
                current = '';
            }
            if (char === '\r' && nextChar === '\n') i++; // Windows 줄바꿈 처리
        } 
        else {
            current += char;
        }
    }

    // 마지막 행 처리
    if (current !== '' || row.length > 0) {
        row.push(current.trim());
        rows.push(row.map(cell => cell.replace(/[“”]/g, '"')));
    }

    return rows;
}

let datalist; // 여기에 단어가 이차원배열 형식으로 들어갈거임 ㅇㅇㅇ
let realdata;
let testingWords;

async function fetchData(){ // data에 int : day 입력

    const response = await fetch("data.csv")
    if (!response.ok) {
        alert("데이터 파일을 불러오지 못했습니다. 관리자에게 문의해주세요.");
        location.href = "./html.html";
    }
    const csvText = await response.text();
    datalist = parseCSV(csvText);
}

const bData = data => { // 여기에 데이터를 1차원 배열로 입력하면 뚝딱 해서 newExample 함수에 넣기 좋게 만들어줌.
    // day1,1,“evidence”,“Evidence shows that global warming is certainly occurring.”,“지구 온난화가 분명히 일어나고 있다는 것을 증거가 보여 준다.”
    // 6, 201, “economy”, “economy”, “The sharing economy is an economic system based on sharing assets or services, for free or for a fee, directly from and between individuals.”, “공유 경제는 무료로 또는 비용을 내고, 개인으로부터 직접 그리고 개인들 간에 자산이나 서비스를 공유하는 것에 기초한 경제체제이다.”
    // 11, "stimulate", "Travel stimulates creative thinking because we recognize that there are many more opportunities for solving problems than the ones we know.", "우리는 우리가 알고 있는 것보다 문제를 해결할 훨씬 더 많은 기회가 있다는 것을 인식하므로 여행은 창의적인 사고를 자극한다."


    let newdata = [];

    if(!isNaN(data[0].trim())) { // 숫자이면 true 문자이면 false
        // 숫자니까 6~16
        newdata.push(parseInt(data[0], 10)); // day
        if (newdata[0] > 10) { // 11~15
            newdata.push(data[1].replace(/^["“”]|["“”]$/g, "")); // word
            newdata.push(data[2].replace(/^["“”]|["“”]$/g, "")); // 예문
            newdata.push(data[3].replace(/^["“”]|["“”]$/g, "")); // 뜻
        } else { // 6~10
            newdata.push(data[2].replace(/^["“”]|["“”]$/g, "")); // word
            newdata.push(data[4].replace(/^["“”]|["“”]$/g, "")); // 예문
            newdata.push(data[5].replace(/^["“”]|["“”]$/g, "")); // 뜻
        }
    } else {
        // 1 ~ 5
        newdata.push(parseInt(data[0].replace(/\D/g, ""), 10)); // day
        newdata.push(data[2].replace(/^["“”]|["“”]$/g, "")); // word
        newdata.push(data[3].replace(/^["“”]|["“”]$/g, "")); // 예문
        newdata.push(data[4].replace(/^["“”]|["“”]$/g, "")); // 뜻뜻
    }

    return newdata;
}


// 버튼 누르면면
function submit(){
    if(sts.isRest && sts.cNum == testingWords.length) {
        sts.isRest = false;
        document.querySelector(".okBtn").innerHTML = "제출";
        // 완료 코드드
    } else if(sts.isRest) {
        sts.isRest = false;
        newWord();
    } else {
        if(document.querySelector("#answer").value == sts.cWord) {
            // 맞음 코드
            document.querySelector("#answer").style.color = "#66cc33";
            
        } else {
            // 틀림 코드드
            document.querySelector("#answer").style.color = "#ff0000";
            document.querySelector("#answer").value = sts.cWord;
        }
        document.querySelector(".okBtn").innerHTML = "다음";
        sts.isRest = true;
    }
}

function newWord() {
    return newExample(bData(testingWords[sts.cNum - 1]));
}



// 실행 줄, 코드 짤때 이안에 짜세요 

(async () => {
    await fetchData();
    realdata = datalist.filter(row => {
        const key = "d" + bData(row)[0];
        return days.includes(key);

    });
    testingWords = [...realdata].sort(() => Math.random() - 0.5).slice(0, Math.min(realdata.length, 50));
    sts.len = testingWords.length;
    newWord();
})();