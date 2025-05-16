const params = new URLSearchParams(window.location.search);
const days = params.getAll("day");

// Day 선택이 0개이면 다시 돌려보내기
if (days.length == 0) {
    alert("Day를 선택해주세요.");
    location.href = "./html.html";
}

// 예문 + 빈칸 생성

const newExample = data => { // data에 [int : day, string : 단어, string : 예문, string : 뜻]
    
    document.querySelector("#exmplpart").innerHTML = `
        <p><span>${data[2].replace(/__/, `</span><input type="text" id="answer" placeholder="${data[1][0]}" autocomplete="off"><span>`)}
    </span></p>`;

    // 형식 : <p><span>예문</span>빈칸<span>예문</span></p>

    document.querySelector("#answerpart").innerHTML = `<p>${data[3]}</p>`

    // 형식 : <p>뜻</p>

    return data[1];
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

        if (char === '"' && inQuotes && nextChar === '"') {
            current += '"';
            i++;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            row.push(current);
            current = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (current !== '' || row.length > 0) {
                row.push(current);
                rows.push(row);
                row = [];
                current = '';
        }
            if (char === '\r' && nextChar === '\n') i++; // Windows 줄바꿈 처리
        } else {
            current += char;
        }
    }

    if (current !== '' || row.length > 0) {
        row.push(current);
        rows.push(row);
    }

    return rows;
}

let datalist; // 여기에 단어가 이차원배열 형식으로 들어갈거임 ㅇㅇㅇ

const fetchData = () => { // data에 int : day 입력

    fetch("data.csv")
    .then(response => {
        if (!response.ok) {
            alert("데이터 파일을 불러오지 못했습니다. 관리자에게 문의해주세요.");
            location.href = "./html.html";
        }
        return response.text();
    }).then(csvText => {
        const rows = parseCSV(csvText);
        datalist = rows;
    })
    
}

const bData = data => { // 여기에 데이터를 1차원 배열로 입력하면 뚝딱 해서 newExample 함수에 넣기 좋게 만들어줌.
    // day1,1,“evidence”,“Evidence shows that global warming is certainly occurring.”,“지구 온난화가 분명히 일어나고 있다는 것을 증거가 보여 준다.”
    // 6, 201, “economy”, “economy”, “The sharing economy is an economic system based on sharing assets or services, for free or for a fee, directly from and between individuals.”, “공유 경제는 무료로 또는 비용을 내고, 개인으로부터 직접 그리고 개인들 간에 자산이나 서비스를 공유하는 것에 기초한 경제체제이다.”
    // 11, "stimulate", "Travel stimulates creative thinking because we recognize that there are many more opportunities for solving problems than the ones we know.", "우리는 우리가 알고 있는 것보다 문제를 해결할 훨씬 더 많은 기회가 있다는 것을 인식하므로 여행은 창의적인 사고를 자극한다."

    let newdata = [];

    if(!isNaN(data[0].trim())) { // 숫자이면 true 문자이면 false
        // 숫자니까 6~16
        newdata.push(data[0].trim()); // day
        if (newdata[0] > 10) { // 11~15
            newdata.push(data[1]); // word
            newdata.push(data[2]); // 예문
            newdata.push(data[3]); // 뜻
        } else { // 6~10
            newdata.push(data[2]); // word
            newdata.push(data[4]); // 예문
            newdata.push(data[5]); // 뜻
        }
    } else {
        // 1 ~ 5
        newdata.push(data[0].slice(3,-1).trim()); // day
        newdata.push(data[2]); // word
        newdata.push(data[3]); // 예문
        newdata.push(data[4]); // 예문
    }

    return newdata;
}