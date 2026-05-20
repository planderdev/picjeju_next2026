(() => {
  const STORAGE_KEY = "searchUI_recent";
  const FALLBACK_KEYWORDS = ["바다축제", "제주데이트", "플리마켓", "오늘추천", "제주숲맛집"];

  const ready = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  };

  const unique = (items) => Array.from(new Set(items.map((item) => String(item || "").trim()).filter(Boolean)));

  const loadRecent = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(stored) ? unique(stored) : [];
    } catch {
      return [];
    }
  };

  const saveRecent = (items) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unique(items).slice(0, 10)));
  };

  const createChip = (label, onClick) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className="chip";
    chip.textContent = label;
    chip.addEventListener("click", () => onClick(label));
    return chip;
  };

  const getResultUrl = (root, query) => {
    const resultPath = root.dataset.resultPath || "store.html";
    const separator = resultPath.includes("?") ? "&" : "?";
    const target = `${resultPath}${separator}q=${encodeURIComponent(query)}`;
    return window.picjejuPage ? window.picjejuPage(target) : target;
  };

  const initSearch = (root) => {
    const form = root.querySelector("#searchUIForm");
    const input = root.querySelector("#searchUIInput");
    const clearButton = root.querySelector(".search-ui-clear");
    const recentWrap = root.querySelector("#searchUIRecent");
    const recommendationsWrap = root.querySelector("#searchUIRecs");
    const clearHistoryButton = root.querySelector("#searchUIClearHistory");
    if (!form || !input || !recentWrap || !recommendationsWrap) return;

    const keywords = unique(Array.from(recommendationsWrap.querySelectorAll(".chip"), (chip) => chip.textContent));
    const defaultKeywords = keywords.length ? keywords : FALLBACK_KEYWORDS;

    const handleSearch = (query) => {
      const nextQuery = String(query || "").trim();
      if (!nextQuery) return;

      saveRecent([nextQuery, ...loadRecent()]);
      renderRecent();
      window.location.href = getResultUrl(root, nextQuery);
    };

    const renderChips = (container, items) => {
      container.replaceChildren(...items.map((item) => createChip(item, handleSearch)));
    };

    const renderRecent = () => {
      const recent = loadRecent();
      renderChips(recentWrap, recent.length ? recent : defaultKeywords);
    };

    renderChips(recommendationsWrap, defaultKeywords);
    renderRecent();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      handleSearch(input.value);
    });

    clearHistoryButton?.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      renderRecent();
    });

    input.addEventListener("input", () => {
      if (clearButton) clearButton.style.display = input.value ? "block" : "none";
    });

    clearButton?.addEventListener("click", () => {
      input.value = "";
      clearButton.style.display = "none";
      input.focus();
    });
  };

  ready(() => {
    document.querySelectorAll("[data-search-ui]").forEach(initSearch);
  });
})();
