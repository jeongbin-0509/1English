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