// filters.js — 검색 + 그룹 필터 + 체크박스/벌크바 공통
(function () {
    "use strict";
  
    /**
     * 테이블 필터 초기화
     * @param {Object} opts
     *   tableId: 테이블 id
     *   searchId: 검색 input id
     *   countId: 필터 후 카운트 id
     *   checkAllId: 전체선택 체크박스 id
     *   bulkBarId: 벌크바 id
     *   railSelector: 그룹 필터 레일 선택자 (예: ".rail-list")
     */
    function initTableFilter(opts) {
      const $tbl = document.getElementById(opts.tableId);
      if (!$tbl) return;
      const $q = document.getElementById(opts.searchId);
      const $count = document.getElementById(opts.countId);
      const $checkAll = document.getElementById(opts.checkAllId);
      const $bulkBar = document.getElementById(opts.bulkBarId);
      const $rail = document.querySelector(opts.railSelector || ".rail-list");
  
      const rows = Array.from($tbl.querySelectorAll("tbody tr"));
  
      // 초기 플래그
      rows.forEach(tr => {
        tr.dataset.groupMatch = "1";
        tr.dataset.searchMatch = "1";
      });
  
      function applyVisibility() {
        let visible = 0;
        rows.forEach(tr => {
          const show = (tr.dataset.groupMatch !== "0") && (tr.dataset.searchMatch !== "0");
          tr.style.display = show ? "" : "none";
          if (show) visible++;
        });
        if ($count) $count.textContent = visible;
  
        // 보이지 않는 행은 체크 해제
        rows.forEach(tr => {
          if (tr.style.display === "none") {
            const cb = tr.querySelector(".row-check");
            if (cb) cb.checked = false;
          }
        });
  
        updateBulkBar();
      }
  
      function applySearch() {
        const term = ($q?.value || "").toLowerCase().trim();
        rows.forEach(tr => {
          const text = tr.innerText.toLowerCase();
          tr.dataset.searchMatch = (!term || text.includes(term)) ? "1" : "0";
        });
        applyVisibility();
      }
  
      function updateBulkBar() {
        const any = $tbl.querySelectorAll(".row-check:checked").length > 0;
        $bulkBar?.classList.toggle("d-none", !any);
      }
  
      // 이벤트 바인딩
      $q?.addEventListener("input", applySearch);
  
      $rail?.addEventListener("click", e => {
        const a = e.target.closest("[data-filter-group]");
        if (!a) return;
        e.preventDefault();
        $rail.querySelectorAll(".list-group-item").forEach(x => x.classList.remove("active"));
        a.classList.add("active");
  
        const g = a.dataset.filterGroup; // '__ALL__' | '__NONE__' | '그룹명'
        rows.forEach(tr => {
          const tg = tr.dataset.group || "__NONE__";
          const ok = (g === "__ALL__") || (g === "__NONE__" && tg === "__NONE__") || (g === tg);
          tr.dataset.groupMatch = ok ? "1" : "0";
        });
        applyVisibility();
      });
  
      $checkAll?.addEventListener("change", () => {
        rows.forEach(tr => {
          if (tr.style.display !== "none") {
            const cb = tr.querySelector(".row-check");
            if (cb) cb.checked = $checkAll.checked;
          }
        });
        updateBulkBar();
      });
  
      $tbl.querySelectorAll(".row-check").forEach(cb => cb.addEventListener("change", updateBulkBar));
  
      // 초기 1회 계산
      applySearch();
    }
  
    // 전역 노출
    window.AdminTableFilter = { init: initTableFilter };
  })();
  