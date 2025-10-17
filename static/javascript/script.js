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

// 모든 체크박스 선택/해제 (선택 버튼이 있는 경우만 동작)
document.addEventListener("DOMContentLoaded", function () {
  const selectAllBtn = document.getElementById("selectAllBtn");
  const deselectAllBtn = document.getElementById("deselectAllBtn");

  if (selectAllBtn) {
    selectAllBtn.addEventListener("click", function () {
      const checkboxes = document.querySelectorAll(".itam");
      checkboxes.forEach(cb => (cb.checked = true));
      document.dispatchEvent(new CustomEvent("days:changed"));
    });
  }

  if (deselectAllBtn) {
    deselectAllBtn.addEventListener("click", function () {
      const checkboxes = document.querySelectorAll(".itam");
      checkboxes.forEach(cb => (cb.checked = false));
      document.dispatchEvent(new CustomEvent("days:changed"));
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
    const url =
      "./example.html?" +
      selected.map(h => `day=${encodeURIComponent(h)}`).join("&");
    if (url !== "./example.html?") window.location.href = url;
  });
}

// DAY 재선택
function goToPage() {
  window.location.href = "index.html";
}

// day 선택 로직
document.addEventListener("DOMContentLoaded", () => {
  const panel = document.getElementById("selected-days-panel");
  const listEl = document.getElementById("selected-days");
  if (!panel || !listEl) return;

  const dayInputs = Array.from(document.querySelectorAll('input[name="day"]'));

  function getSelectedValues() {
    return dayInputs
      .filter(cb => cb.checked)
      .map(cb => Number(cb.value))
      .sort((a, b) => a - b)
      .map(String);
  }

  function renderChips() {
    const selected = getSelectedValues();

    if (selected.length === 0) {
      panel.classList.add("hidden");
      listEl.innerHTML = "";
      return;
    }

    panel.classList.remove("hidden");
    listEl.innerHTML = "";

    selected.forEach(d => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.setAttribute("aria-label", `Day ${d} 선택 해제`);

      const num = document.createElement("span");
      num.textContent = d;

      const x = document.createElement("span");
      x.className = "x";
      x.textContent = "×";

      btn.appendChild(num);
      btn.appendChild(x);

      // 칩 클릭하면 체크 해제
      btn.addEventListener("click", ev => {
        const target = document.querySelector(`input[name="day"][value="${d}"]`);
        if (target) {
          target.checked = false;
          renderChips();
        }
        ev.stopPropagation();
      });

      listEl.appendChild(btn);
    });
  }

  // 체크박스 변화  반응
  dayInputs.forEach(cb => cb.addEventListener("change", renderChips));

  // 외부에서 선택상태 일괄 변경시 ㄱ
  document.addEventListener("days:changed", renderChips);

  // 초기 렌더하는것
  renderChips();
});
