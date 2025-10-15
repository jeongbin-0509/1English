// Connected to Index.html

// 사이드바 제어
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const toggleBtn = document.getElementById("sidebarToggle");
  const isOpen = sidebar.classList.contains("active");

  if (isOpen) {
    sidebar.classList.remove("active");
    overlay?.classList.remove("active");
    toggleBtn?.setAttribute("aria-expanded", "false");
  } else {
    sidebar.classList.add("active");
    overlay?.classList.add("active");
    toggleBtn?.setAttribute("aria-expanded", "true");
  }
}

function openSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar.classList.contains("active")) toggleSidebar();
}

function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (sidebar.classList.contains("active")) toggleSidebar();
}

// 오버레이 클릭 시 닫힘
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("sidebarOverlay");
  overlay?.addEventListener("click", closeSidebar);
});


// 모든 체크박스 선택
document.addEventListener("DOMContentLoaded", function () {
  const selectAllBtn = document.getElementById("selectAllBtn");
  const deselectAllBtn = document.getElementById("deselectAllBtn");

  if (selectAllBtn) {
    selectAllBtn.addEventListener("click", function () {
      const checkboxes = document.querySelectorAll(".itam");
      checkboxes.forEach(cb => cb.checked = true);
    });
  }

  if (deselectAllBtn) {
    deselectAllBtn.addEventListener("click", function () {
      const checkboxes = document.querySelectorAll(".itam");
      checkboxes.forEach(cb => cb.checked = false);
    });
  }
});

// day 정보 예문 페이지로 보내기
const goStartForm = document.getElementById("goStart");
if (goStartForm) {
  goStartForm.addEventListener("submit", e => {
    e.preventDefault();
    const selected = [];
    document.querySelectorAll("input[name='day']:checked").forEach(cb => {
      selected.push(cb.value);
    });
    const url = "./example.html?" + selected.map(h => `day=${encodeURIComponent(h)}`).join("&");
    if (url !== "./example.html?") window.location.href = url;
  });
}

// DAY 재선택
function goToPage() {
  window.location.href = "index.html";
}
