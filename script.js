// 사이드 박스 제어
function openSidebar() {
  document.getElementById("sidebar").classList.add("active");
}
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("active");
}

// 모든 체크박스 선택
document.addEventListener("DOMContentLoaded", function () {
  const selectAllBtn = document.getElementById("selectAllBtn");
  const deselectAllBtn = document.getElementById("deselectAllBtn");

  selectAllBtn.addEventListener("click", function () {
    const checkboxes = document.querySelectorAll(".itam");
    checkboxes.forEach(cb => cb.checked = true);
  });

  deselectAllBtn.addEventListener("click", function () {
    const checkboxes = document.querySelectorAll(".itam");
    checkboxes.forEach(cb => cb.checked = false);
  });
});

// day 정보 예문 페이지로 보내기
document.getElementById("goStart").addEventListener("submit", e => {
  e.preventDefault();

  const selected = [];
  document.querySelectorAll("input[name='day']:checked").forEach(cb => {
    selected.push(cb.value);
  });
  
  const url = "./example.html?" + selected.map(h => `day=${encodeURIComponent(h)}`).join("&");

  if(url != "./example.html?") window.location.href = url;
}); 

// Day 재선택 기능구현
function goToPage() {
  window.location.href = "index.html";
}