function doNotReload(event) {
  if ((event.ctrlKey && (event.keyCode === 78 || event.keyCode === 82)) || event.keyCode === 116) {
    event.preventDefault();
    return false;
  }
}

let hasUnsavedChanges = true;

window.addEventListener('beforeunload', (e) => {
  e.preventDefault();
  e.returnValue = '';
  return '작성 중인 내용이 사라질 수 있습니다. 정말 나가시겠습니까?';
});

document.addEventListener("keydown", doNotReload);

const params = new URLSearchParams(window.location.search);
const days = params.getAll("day");

let sts = {
  cNum: 1,
  cDay: 0,
  cWord: "",
  isRest: false,
  len: 50
};

if (days.length == 0) {
  alert("Day를 선택해주세요.");
  location.href = "./index.html";
}

const newExample = data => {
  sts.cDay = data[0];
  sts.cWord = data[1];

  document.querySelector("#exp").innerHTML = `
    <p>${data[2].replace(/__/, `<input type="text" id="answer" placeholder="${sts.cWord.slice(0,1)}" autocomplete="off">`)}</p>`;
  document.querySelector("#answer").style.color = "#000000";
  document.querySelector("#asp").innerHTML = `<p>${data[3]}</p>`;
  document.querySelector("#progress").innerHTML = sts.cNum + " / " + sts.len;
};

function parseCSV(text) {
  const rows = [];
  let row = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if ((char === '"' || char === '“' || char === '”') && inQuotes && (nextChar === '"' || nextChar === '“' || nextChar === '”')) {
      current += '"';
      i++;
    } else if (char === '"' || char === '“' || char === '”') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (current !== '' || row.length > 0) {
        row.push(current.trim());
        rows.push(row.map(cell => cell.replace(/[“”]/g, '"')));
        row = [];
        current = '';
      }
      if (char === '\r' && nextChar === '\n') i++;
    } else {
      current += char;
    }
  }

  if (current !== '' || row.length > 0) {
    row.push(current.trim());
    rows.push(row.map(cell => cell.replace(/[“”]/g, '"')));
  }

  return rows;
}

let datalist;
let realdata;
let testingWords;

async function fetchData() {
  const response = await fetch("data.csv");
  if (!response.ok) {
    alert("데이터 파일을 불러오지 못했습니다. 관리자에게 문의해주세요.");
    location.href = "./index.html";
  }
  const csvText = await response.text();
  datalist = parseCSV(csvText);
}

const bData = data => {
  let newdata = [];

  if (!isNaN(data[0].trim())) {
    newdata.push(parseInt(data[0], 10));
    if (newdata[0] > 10) {
      newdata.push(data[2].replace(/^\["“”]|["“”]$/g, ""));
      newdata.push(data[3].replace(/^\["“”]|["“”]$/g, ""));
      newdata.push(data[4].replace(/^\["“”]|["“”]$/g, ""));
    } else {
      newdata.push(data[3].replace(/^\["“”]|["“”]$/g, ""));
      newdata.push(data[4].replace(/^\["“”]|["“”]$/g, ""));
      newdata.push(data[5].replace(/^\["“”]|["“”]$/g, ""));
    }
  } else {
    newdata.push(parseInt(data[0].replace(/\D/g, ""), 10));
    newdata.push(data[2].replace(/^\["“”]|["“”]$/g, ""));
    newdata.push(data[3].replace(/^\["“”]|["“”]$/g, ""));
    newdata.push(data[4].replace(/^\["“”]|["“”]$/g, ""));
  }

  return newdata;
};

function submit() {
  const answerInput = document.querySelector("#answer");
  if (!answerInput) return;

  if (sts.isRest && sts.cNum == testingWords.length) {
    sts.isRest = false;
    location.href = "./index.html";
  } else if (sts.isRest) {
    sts.isRest = false;
    sts.cNum++;
    document.querySelector(".okBtn").innerHTML = "제출";
    newWord();
  }
}

function newWord() {
  return newExample(bData(testingWords[sts.cNum - 1]));
}

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

document.addEventListener("input", function (e) {
  if (e.target && e.target.id === "answer" && !e.target.dataset.enterAttached) {
    e.target.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        submit();
      }
    });
    e.target.dataset.enterAttached = "true";
  }
});

// ✅ 최종 수정된 기능: 정확히 일치하지 않으면 정답을 보여주고, 이후 Enter로 넘어감

document.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    const answerInput = document.querySelector("#answer");
    if (!answerInput) return;

    const inputVal = answerInput.value.trim();
    const correctAnswer = sts.cWord.trim();

    if (!sts.isRest) {
      if (inputVal.toLowerCase() === correctAnswer.toLowerCase()) {
        // 정답일 경우 초록색 표시
        answerInput.style.color = "#66cc33";
      } else {
        // 오답일 경우 빨간색으로 정답 노출
        answerInput.style.color = "#ff0000";
        answerInput.value = correctAnswer;
      }
      document.querySelector(".okBtn").innerHTML = (sts.cNum != 43) ? "다음" : "처음";
      sts.isRest = true;
    } else {
      submit();
    }
  }
});
