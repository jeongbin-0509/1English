const params = new URLSearchParams(window.location.search);
const correct = params.get('correct') || 0;
const incorrect = params.get('incorrect') || 0;

document.getElementById('correct-count').textContent = `정답: ${correct}개`;
document.getElementById('incorrect-count').textContent = `오답: ${incorrect}개`;

function goHome() {
  window.location.href = './index.html';
}

// ✔ 엔터를 누르면 홈으로
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    goHome();
  }
});

// 사이드 박스 제어
function openSidebar() {
  document.getElementById("sidebar").classList.add("active");
}
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("active");
}