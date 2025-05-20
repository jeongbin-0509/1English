function doNotReload(event) {
  if ((event.ctrlKey && (event.keyCode === 78 || event.keyCode === 82)) || event.keyCode === 116) {
    event.preventDefault();
    return false;
  }
}

let hasUnsavedChanges = true;

function removeBeforeUnloadWarning() {
  window.removeEventListener('beforeunload', beforeUnloadHandler);
}

function beforeUnloadHandler(e) {
  e.preventDefault();
  e.returnValue = '';
  return '작성 중인 내용이 사라질 수 있습니다. 정말 나가시겠습니까?';
}

window.addEventListener('beforeunload', beforeUnloadHandler);

document.addEventListener("keydown", doNotReload);

const params = new URLSearchParams(window.location.search);
const days = params.getAll("day");

let sts = {
  cNum: 1,
  cDay: 0,
  cWord: "",
  isRest: false,
  len: 50,
  feedbackShown: false,
  correct: 0,
  incorrect: 0,
  quizFinished: false
};

if (days.length == 0) {
  alert("Day를 선택해주세요.");
  location.href = "./index.html";
}

const newExample = data => {
  sts.cDay = data[0];
  sts.cWord = data[1];
  sts.feedbackShown = false;

  document.querySelector("#exp").innerHTML = `
    <p>${data[2].replace(/__/, `<input type="text" id="answer" placeholder="${sts.cWord.slice(0,1)}" autocomplete="off">`)}</p>
    <div id="feedback" style="margin-top: 10px; font-weight: bold;"></div>`;
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
      newdata.push(data[2].replace(/^["“”]|["“”]$/g, ""));
      newdata.push(data[3].replace(/^["“”]|["“”]$/g, ""));
      newdata.push(data[4].replace(/^["“”]|["“”]$/g, ""));
    } else {
      newdata.push(data[3].replace(/^["“”]|["“”]$/g, ""));
      newdata.push(data[4].replace(/^["“”]|["“”]$/g, ""));
      newdata.push(data[5].replace(/^["“”]|["“”]$/g, ""));
    }
  } else {
    newdata.push(parseInt(data[0].replace(/\D/g, ""), 10));
    newdata.push(data[2].replace(/^["“”]|["“”]$/g, ""));
    newdata.push(data[3].replace(/^["“”]|["“”]$/g, ""));
    newdata.push(data[4].replace(/^["“”]|["“”]$/g, ""));
  }

  return newdata;
};

function submit() {
  const answerInput = document.querySelector("#answer");
  if (!answerInput) return;

  if (sts.isRest && sts.cNum == testingWords.length) {
    removeBeforeUnloadWarning();
    sts.quizFinished = true;
    const resultURL = `./result.html?correct=${sts.correct}&incorrect=${sts.incorrect}`;
    location.href = resultURL;
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

document.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    if (sts.quizFinished) {
      window.location.href = "./index.html";
      return;
    }

    const answerInput = document.querySelector("#answer");
    if (!answerInput) return;

    const inputVal = answerInput.value.trim();
    const correctAnswer = sts.cWord.trim();
    const feedback = document.querySelector("#feedback");

    if (!sts.isRest && !sts.feedbackShown) {
      if (inputVal.toLowerCase() === correctAnswer.toLowerCase()) {
        answerInput.style.color = "#66cc33";
        feedback.textContent = "정답입니다!";
        feedback.style.color = "#66cc33";
        sts.correct++;
      } else {
        answerInput.style.color = "#ff0000";
        answerInput.value = correctAnswer;
        feedback.textContent = `오답입니다! 정답: ${correctAnswer}`;
        feedback.style.color = "#ff0000";
        sts.incorrect++;
      }
      document.querySelector(".okBtn").innerHTML = (sts.cNum != 43) ? "다음" : "처음";
      sts.feedbackShown = true;
      return;
    }

    if (sts.feedbackShown) {
      feedback.textContent = "";
      sts.isRest = true;
      submit();
    }
  }
});
document.querySelector(".okBtn")?.addEventListener("click", () => {
  const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
  document.dispatchEvent(enterEvent);
});
