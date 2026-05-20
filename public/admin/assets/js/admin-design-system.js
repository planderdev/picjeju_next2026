// /admin/assets/js/admin-design-system.js
// Lightweight controls for the admin design-system management page.
(function () {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const storageKey = window.AdminDesignSystemTokens?.storageKey || "admin.designSystem.tokens";
  const cssVars = {
    primary: "--admin-primary",
    primaryHover: "--admin-primary-hover",
    success: "--admin-success",
    warning: "--admin-warning",
    danger: "--admin-danger",
    radius: "--admin-radius-md"
  };
  const legacyDefaults = {
    primary: "#3182f6",
    primaryHover: "#1b64da"
  };
  const currentDefaults = {
    primary: "#ff6633",
    primaryHover: "#dd572b"
  };

  function normalizeTokens(tokens = {}) {
    const next = { ...tokens };
    let changed = false;
    Object.entries(legacyDefaults).forEach(([key, value]) => {
      if (String(next[key] || "").toLowerCase() === value) {
        next[key] = currentDefaults[key];
        changed = true;
      }
    });
    if (changed) localStorage.setItem(storageKey, JSON.stringify(next));
    return next;
  }

  function showToast(message) {
    if (window.adminToast) {
      window.adminToast(message);
      return;
    }
    const event = new CustomEvent("admin:toast", { detail: { message } });
    window.dispatchEvent(event);
  }

  function loadTokens() {
    try {
      return normalizeTokens(JSON.parse(localStorage.getItem(storageKey) || "{}"));
    } catch {
      return {};
    }
  }

  function saveTokens(tokens) {
    localStorage.setItem(storageKey, JSON.stringify(tokens));
    window.AdminDesignSystemTokens?.apply?.(tokens);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = $("#adminDsForm");
    const tokens = loadTokens();

    $$("[data-ds-token]", form).forEach((field) => {
      const key = field.dataset.dsToken;
      if (tokens[key]) field.value = tokens[key];
    });

    form?.addEventListener("input", (event) => {
      const field = event.target.closest("[data-ds-token]");
      if (!field) return;
      const next = loadTokens();
      next[field.dataset.dsToken] = field.value;
      window.AdminDesignSystemTokens?.apply?.(next);
    });

    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const next = {};
      $$("[data-ds-token]", form).forEach((field) => {
        next[field.dataset.dsToken] = field.value;
      });
      saveTokens(next);
      showToast("어드민 디자인 시스템 설정이 저장되었습니다.");
    });

    $$("[data-ds-reset]").forEach((button) => button.addEventListener("click", () => {
      localStorage.removeItem(storageKey);
      Object.values(cssVars).forEach((cssVar) => {
        document.documentElement.style.removeProperty(cssVar);
      });
      $$("[data-ds-token]", form).forEach((field) => {
        const fallback = field.getAttribute("data-ds-default");
        if (fallback) field.value = fallback;
      });
      showToast("디자인 시스템 설정을 기본값으로 되돌렸습니다.");
    }));

    $$("[data-ds-copy]").forEach((button) => {
      button.addEventListener("click", async () => {
        const value = button.getAttribute("data-ds-copy") || "";
        try {
          await navigator.clipboard.writeText(value);
          showToast(`${value} 값을 복사했습니다.`);
        } catch {
          showToast("복사 권한을 확인해주세요.");
        }
      });
    });
  });
})();
