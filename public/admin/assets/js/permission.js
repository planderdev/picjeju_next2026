(() => {
  "use strict";

  const table = document.getElementById("staffTable") || document.getElementById("opTable");
  if (!table) return;

  const toast = (message, type = "info") => {
    if (window.adminToast) window.adminToast(message, type);
    else window.alert(message);
  };

  function getRow(target) {
    return target.closest("tr");
  }

  function getName(row) {
    return row?.querySelector(".fw-semibold")?.textContent?.trim() || "운영진";
  }

  function updateCounts() {
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    const total = rows.length;
    const active = rows.filter((row) => row.children?.[5]?.textContent?.includes("활성")).length;
    const paused = rows.filter((row) => row.children?.[5]?.textContent?.includes("일시정지")).length;
    const groups = new Set(rows.map((row) => row.dataset.group).filter(Boolean));
    const countAll = document.getElementById("countAll");
    const countFiltered = document.getElementById("countFiltered");
    const setText = (selector, value) => {
      const el = document.querySelector(selector);
      if (el) el.textContent = value;
    };
    if (countAll) countAll.textContent = String(total);
    if (countFiltered) {
      const visible = rows.filter((row) => row.style.display !== "none").length;
      countFiltered.textContent = String(visible);
    }
    setText("[data-staff-total]", `${total.toLocaleString("ko-KR")}명`);
    setText("[data-staff-active]", `${active.toLocaleString("ko-KR")}명`);
    setText("[data-staff-paused]", `${paused.toLocaleString("ko-KR")}명`);
    setText("[data-staff-groups]", `${groups.size.toLocaleString("ko-KR")}개`);
  }

  function toggleStatus(row) {
    const statusCell = row?.children?.[5];
    const badge = statusCell?.querySelector(".badge");
    if (!badge) return;
    const paused = badge.textContent.includes("일시정지");
    badge.textContent = paused ? "활성" : "일시정지";
    badge.className = paused
      ? "badge text-bg-success-subtle text-success"
      : "badge text-bg-secondary";
  }

  table.addEventListener("click", (event) => {
    const item = event.target.closest(".dropdown-item");
    if (!item) return;

    const row = getRow(item);
    const label = item.textContent.trim();
    const name = getName(row);

    if (label.includes("삭제")) {
      event.preventDefault();
      if (confirm(`${name} 운영진을 삭제할까요?`)) {
        row?.remove();
        updateCounts();
        toast("운영진이 삭제되었습니다.", "success");
      }
      return;
    }

    if (label.includes("활성") || label.includes("일시정지")) {
      event.preventDefault();
      toggleStatus(row);
      updateCounts();
      toast("운영진 상태가 변경되었습니다.", "success");
      return;
    }

    if (label.includes("그룹 이동")) {
      event.preventDefault();
      toast("그룹 이동 모달은 API 연결 단계에서 대상 그룹 목록과 함께 연결됩니다.");
      return;
    }
  });

  document.querySelectorAll("#modalGroupAdd form, #modalStaffAdd form, #modalEdit form, #modalPermEdit form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const modal = form.closest(".modal");
      const instance = modal && window.bootstrap?.Modal.getInstance(modal);
      instance?.hide();
      toast("운영진 정보가 저장되었습니다.", "success");
    });
  });

  updateCounts();
})();
