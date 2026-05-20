// /admin/assets/js/admin.js
// Bootstrap-free admin interactions with a small compatibility layer for legacy pages.
(function () {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const ready = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const designTokenStorageKey = "admin.designSystem.tokens";
  const designTokenMap = {
    primary: "--admin-primary",
    primaryHover: "--admin-primary-hover",
    success: "--admin-success",
    warning: "--admin-warning",
    danger: "--admin-danger",
    radius: "--admin-radius-md"
  };
  const legacyDesignTokenDefaults = {
    primary: "#3182f6",
    primaryHover: "#1b64da"
  };
  const currentDesignTokenDefaults = {
    primary: "#ff6633",
    primaryHover: "#dd572b"
  };

  function normalizeDesignTokens(tokens = {}) {
    const next = { ...tokens };
    let changed = false;
    Object.entries(legacyDesignTokenDefaults).forEach(([key, value]) => {
      if (String(next[key] || "").toLowerCase() === value) {
        next[key] = currentDesignTokenDefaults[key];
        changed = true;
      }
    });
    return { tokens: next, changed };
  }

  function applyDesignTokens(tokens = {}) {
    Object.entries(designTokenMap).forEach(([key, cssVar]) => {
      const value = tokens[key];
      if (value) document.documentElement.style.setProperty(cssVar, value);
    });
  }

  try {
    const normalized = normalizeDesignTokens(JSON.parse(localStorage.getItem(designTokenStorageKey) || "{}"));
    if (normalized.changed) {
      localStorage.setItem(designTokenStorageKey, JSON.stringify(normalized.tokens));
    }
    applyDesignTokens(normalized.tokens);
  } catch {
    localStorage.removeItem(designTokenStorageKey);
  }

  window.AdminDesignSystemTokens = {
    storageKey: designTokenStorageKey,
    apply: applyDesignTokens
  };

  const getTarget = (trigger) => {
    const raw = trigger?.getAttribute("data-bs-target") || trigger?.getAttribute("href") || "";
    if (!raw || raw === "#") return null;
    try {
      return document.querySelector(raw);
    } catch {
      return null;
    }
  };
  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  function focusFirstIn(element) {
    const focusable = element?.querySelector("[autofocus], input:not([disabled]):not([type='hidden']), select:not([disabled]), textarea:not([disabled])")
      || element?.querySelector(focusableSelector);
    window.setTimeout(() => (focusable || element)?.focus?.({ preventScroll: true }), 80);
  }

  function normalizeFormButtons(root = document) {
    $$("form button:not([type])", root).forEach((button) => {
      button.type = "button";
    });
  }

  function hasAccessibleName(element) {
    if (!element) return true;
    if (element.getAttribute("aria-label") || element.getAttribute("aria-labelledby") || element.getAttribute("title")) return true;
    if (element.id && document.querySelector(`label[for="${CSS.escape(element.id)}"]`)) return true;
    if (element.closest("label")) return true;
    if (element.getAttribute("placeholder")) return true;
    return !!textWithoutIcons(element);
  }

  function labelFromContext(element) {
    const field = element.closest(".mb-3, .form-group, .form-field, .row, .col, [class*='col-'], td, th");
    const label = field?.querySelector("label, .form-label, .form-check-label, .small, .fw-semibold");
    return (label?.textContent || "").replace(/[*:]/g, "").replace(/\s+/g, " ").trim();
  }

  function enhanceAdminAccessibility(root = document) {
    $$("img", root).forEach((img) => {
      if (img.hasAttribute("alt")) return;
      const src = img.getAttribute("src") || "";
      img.setAttribute("alt", src.includes("sample-thumb") ? "Item thumbnail" : "");
    });

    $$("a, button", root).forEach((control) => {
      if (hasAccessibleName(control)) return;
      if (control.classList.contains("dropdown-toggle-split")) {
        control.setAttribute("aria-label", "More actions");
      } else if (control.classList.contains("btn-close")) {
        control.setAttribute("aria-label", "Close");
      } else if (control.classList.contains("toastui-editor-toolbar-icons")) {
        control.setAttribute("aria-label", "More editor tools");
      } else if (control.getAttribute("data-bs-toggle") === "dropdown") {
        control.setAttribute("aria-label", "Open menu");
      } else {
        control.setAttribute("aria-label", control.tagName === "A" ? "Open link" : "Action");
      }
    });

    $$("input, select, textarea", root).forEach((control) => {
      if (control.type === "hidden" || hasAccessibleName(control)) return;
      const contextLabel = labelFromContext(control);
      if (contextLabel) {
        control.setAttribute("aria-label", contextLabel);
        return;
      }
      if (control.matches(".row-check, .rowchk, .cat-check, .pt-check, .chk-tpl, .bn-active, .toggle-visible")) {
        control.setAttribute("aria-label", control.classList.contains("toggle-visible") || control.classList.contains("bn-active") ? "Toggle visibility" : "Select row");
      } else if (/checkall/i.test(control.id || "") || /all/i.test(control.name || "")) {
        control.setAttribute("aria-label", "Select all rows");
      } else if (control.type === "checkbox" || control.type === "radio") {
        control.setAttribute("aria-label", "Select option");
      } else if (control.type === "file") {
        control.setAttribute("aria-label", "Upload file");
      } else if (control.type === "color") {
        control.setAttribute("aria-label", "Color value");
      } else if (control.matches(".admin-datepicker-input, .flatpickr-input") || /date|start|end|from|to|reserve|period/i.test(`${control.id} ${control.name}`)) {
        control.setAttribute("aria-label", "Date");
      } else {
        control.setAttribute("aria-label", control.tagName === "TEXTAREA" ? "Text content" : "Input field");
      }
    });
  }

  const store = new WeakMap();

  class BaseControl {
    constructor(element) {
      this._element = typeof element === "string" ? document.querySelector(element) : element;
      if (this._element) store.set(this._element, this);
    }
    static getInstance(element) {
      const el = typeof element === "string" ? document.querySelector(element) : element;
      return el ? store.get(el) || null : null;
    }
    static getOrCreateInstance(element, options) {
      const el = typeof element === "string" ? document.querySelector(element) : element;
      if (!el) return null;
      return this.getInstance(el) || new this(el, options);
    }
  }

  const backdrop = {
    show(kind = "modal") {
      let el = document.querySelector(`.admin-backdrop[data-kind="${kind}"]`);
      if (!el) {
        el = document.createElement("div");
        el.className = "admin-backdrop";
        el.dataset.kind = kind;
        document.body.appendChild(el);
      }
      requestAnimationFrame(() => el.classList.add("show"));
      return el;
    },
    hide(kind = "modal") {
      document.querySelectorAll(`.admin-backdrop[data-kind="${kind}"]`).forEach((el) => {
        el.classList.remove("show");
        window.setTimeout(() => el.remove(), 180);
      });
    }
  };

  class Modal extends BaseControl {
    show() {
      if (!this._element) return;
      this._element.hidden = false;
      this._element.style.display = "block";
      this._element.removeAttribute("aria-hidden");
      this._element.setAttribute("aria-modal", "true");
      document.body.classList.add("modal-open");
      backdrop.show("modal");
      requestAnimationFrame(() => this._element.classList.add("show"));
      focusFirstIn(this._element);
      this._element.dispatchEvent(new CustomEvent("shown.bs.modal", { bubbles: true }));
    }
    hide() {
      if (!this._element) return;
      this._element.classList.remove("show");
      this._element.setAttribute("aria-hidden", "true");
      this._element.removeAttribute("aria-modal");
      document.body.classList.remove("modal-open");
      backdrop.hide("modal");
      window.setTimeout(() => {
        this._element.style.display = "none";
        this._element.hidden = true;
        this._element._adminReturnFocus?.focus?.({ preventScroll: true });
        this._element._adminReturnFocus = null;
        this._element.dispatchEvent(new CustomEvent("hidden.bs.modal", { bubbles: true }));
      }, 180);
    }
    toggle() {
      this._element?.classList.contains("show") ? this.hide() : this.show();
    }
  }

  class Offcanvas extends BaseControl {
    show() {
      if (!this._element) return;
      this._element.hidden = false;
      this._element.style.visibility = "visible";
      backdrop.show("offcanvas");
      requestAnimationFrame(() => this._element.classList.add("show"));
      focusFirstIn(this._element);
    }
    hide() {
      if (!this._element) return;
      this._element.classList.remove("show");
      backdrop.hide("offcanvas");
      window.setTimeout(() => {
        this._element.style.visibility = "hidden";
        this._element.hidden = true;
        this._element._adminReturnFocus?.focus?.({ preventScroll: true });
        this._element._adminReturnFocus = null;
      }, 180);
    }
    toggle() {
      this._element?.classList.contains("show") ? this.hide() : this.show();
    }
  }

  class Collapse extends BaseControl {
    constructor(element, options = {}) {
      super(element);
      if (options.toggle) this.toggle();
    }
    show() {
      if (!this._element) return;
      const parentSelector = this._element.getAttribute("data-bs-parent");
      if (parentSelector) {
        $$(".collapse.show", document.querySelector(parentSelector) || document).forEach((el) => {
          if (el !== this._element) Collapse.getOrCreateInstance(el)?.hide();
        });
      }
      this._element.classList.add("show");
      $$(`[href="#${this._element.id}"], [data-bs-target="#${this._element.id}"]`).forEach((trigger) => {
        trigger.setAttribute("aria-expanded", "true");
      });
    }
    hide() {
      if (!this._element) return;
      this._element.classList.remove("show");
      $$(`[href="#${this._element.id}"], [data-bs-target="#${this._element.id}"]`).forEach((trigger) => {
        trigger.setAttribute("aria-expanded", "false");
      });
    }
    toggle() {
      this._element?.classList.contains("show") ? this.hide() : this.show();
    }
  }

  class Dropdown extends BaseControl {
    show() {
      if (!this._element) return;
      closeDropdowns(this._element);
      const menu = this._element.closest(".dropdown")?.querySelector(".dropdown-menu");
      menu?.classList.add("show");
      this._element.setAttribute("aria-expanded", "true");
    }
    hide() {
      if (!this._element) return;
      const menu = this._element.closest(".dropdown")?.querySelector(".dropdown-menu");
      menu?.classList.remove("show");
      this._element.setAttribute("aria-expanded", "false");
    }
    toggle() {
      const menu = this._element?.closest(".dropdown")?.querySelector(".dropdown-menu");
      menu?.classList.contains("show") ? this.hide() : this.show();
    }
  }

  class Tab extends BaseControl {
    show() {
      if (!this._element) return;
      const target = getTarget(this._element);
      if (!target) return;
      const nav = this._element.closest(".nav, [role='tablist']") || document;
      $$("[data-bs-toggle='tab'], [data-bs-toggle='pill']", nav).forEach((trigger) => {
        trigger.classList.remove("active");
        trigger.setAttribute("aria-selected", "false");
      });
      const paneRoot = target.parentElement || document;
      $$(".tab-pane.active, .tab-pane.show", paneRoot).forEach((pane) => {
        if (pane === target) return;
        pane.classList.remove("active", "show");
        pane.hidden = true;
      });
      this._element.classList.add("active");
      this._element.setAttribute("aria-selected", "true");
      target.hidden = false;
      target.classList.add("active", "show");
      this._element.dispatchEvent(new CustomEvent("shown.bs.tab", { bubbles: true, detail: { target } }));
    }
  }

  class Toast extends BaseControl {
    constructor(element, options = {}) {
      super(element);
      this._options = { delay: 2200, ...options };
    }
    show() {
      if (!this._element) return;
      this._element.hidden = false;
      this._element.classList.add("show");
      if (this._options.delay !== 0) {
        window.setTimeout(() => this.hide(), this._options.delay);
      }
    }
    hide() {
      if (!this._element) return;
      this._element.classList.remove("show");
      window.setTimeout(() => this._element?.remove(), 180);
    }
  }

  function placeFloatingTip(tip, trigger) {
    if (!tip || !trigger) return;
    const rect = trigger.getBoundingClientRect();
    const margin = 10;
    const width = tip.offsetWidth || 220;
    const top = Math.max(margin, rect.bottom + margin);
    const left = Math.min(
      window.innerWidth - width - margin,
      Math.max(margin, rect.left + rect.width / 2 - width / 2)
    );
    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;
  }

  class FloatingTip extends BaseControl {
    constructor(element, options = {}) {
      super(element);
      this._options = options;
      this._tip = null;
    }
    _content() {
      const title = this._element.getAttribute("data-bs-title") || this._element.getAttribute("title") || this._element.dataset.adminOriginalTitle || "";
      const content = this._element.getAttribute("data-bs-content") || this._element.getAttribute("data-content") || "";
      if (this._element.hasAttribute("title")) {
        this._element.dataset.adminOriginalTitle = title;
        this._element.removeAttribute("title");
      }
      return { title, content };
    }
    hide() {
      this._tip?.remove();
      this._tip = null;
    }
  }

  class Tooltip extends FloatingTip {
    constructor(element, options = {}) {
      super(element, options);
      if (!this._element || this._element.dataset.adminTooltipBound) return;
      this._element.dataset.adminTooltipBound = "1";
      this._element.addEventListener("mouseenter", () => this.show());
      this._element.addEventListener("focus", () => this.show());
      this._element.addEventListener("mouseleave", () => this.hide());
      this._element.addEventListener("blur", () => this.hide());
    }
    show() {
      if (!this._element) return;
      const { title } = this._content();
      if (!title) return;
      this.hide();
      const tip = document.createElement("div");
      tip.className = "admin-floating-tip";
      tip.setAttribute("role", "tooltip");
      tip.textContent = title;
      document.body.appendChild(tip);
      this._tip = tip;
      placeFloatingTip(tip, this._element);
    }
  }

  class Popover extends FloatingTip {
    constructor(element, options = {}) {
      super(element, options);
    }
    show() {
      if (!this._element) return;
      const { title, content } = this._content();
      const body = content || title;
      if (!body) return;
      this.hide();
      const tip = document.createElement("div");
      tip.className = "admin-floating-tip admin-floating-tip--popover";
      tip.setAttribute("role", "dialog");
      tip.innerHTML = `${content && title ? `<strong>${escapeHtml(title)}</strong>` : ""}<span>${escapeHtml(body)}</span>`;
      document.body.appendChild(tip);
      this._tip = tip;
      placeFloatingTip(tip, this._element);
    }
    toggle() {
      this._tip ? this.hide() : this.show();
    }
  }

  function closeDropdowns(except) {
    $$(".dropdown-menu.show").forEach((menu) => {
      const dropdown = menu.closest(".dropdown");
      if (except && dropdown?.contains(except)) return;
      menu.classList.remove("show");
      dropdown?.querySelector("[data-bs-toggle='dropdown']")?.setAttribute("aria-expanded", "false");
    });
  }

  function allowsBackdropDismiss(element) {
    return element?.getAttribute("data-bs-backdrop") !== "static";
  }

  function topVisible(selector) {
    const elements = $$(selector);
    return elements[elements.length - 1] || null;
  }

  function markButtonBusy(button, delay = 520) {
    if (!button || button.disabled || button.classList.contains("btn-link")) return;
    const original = button.innerHTML;
    button.dataset.adminOriginalHtml = original;
    button.classList.add("is-loading");
    button.setAttribute("aria-busy", "true");
    button.disabled = true;
    window.setTimeout(() => {
      button.innerHTML = button.dataset.adminOriginalHtml || original;
      button.classList.remove("is-loading");
      button.removeAttribute("aria-busy");
      button.disabled = false;
      delete button.dataset.adminOriginalHtml;
    }, delay);
  }

  function getDatepickerConfig(input) {
    const originalType = (input.getAttribute("type") || "text").toLowerCase();
    const meta = [
      input.id,
      input.name,
      input.className,
      input.placeholder,
      input.dataset.adminDateMode,
      input.dataset.adminDateType
    ].join(" ").toLowerCase();

    if (input.dataset.adminDatepicker === "false") return null;
    if (["checkbox", "radio", "file", "hidden", "search", "number", "email", "password", "url", "tel"].includes(originalType)) {
      if (!input.classList.contains("flatpickr") && !input.classList.contains("flatpickr-range")) return null;
    }

    const isRange = input.classList.contains("flatpickr-range")
      || input.dataset.adminDateMode === "range"
      || /\b(range|period)\b|기간|시작일\s*~|시작~종료/.test(meta);
    const isTime = originalType === "time" || input.dataset.adminDateType === "time";
    const isDateTime = originalType === "datetime-local"
      || input.dataset.adminDateType === "datetime"
      || /datetime|reserveat|start_at|end_at|startat|endat|날짜\/시간|일시|시간 선택/.test(meta);

    const config = {
      locale: window.flatpickr?.l10ns?.ko || "ko",
      allowInput: true,
      disableMobile: true,
      dateFormat: "Y-m-d"
    };

    if (isRange) config.mode = "range";
    if (isTime && !isRange) {
      config.noCalendar = true;
      config.enableTime = true;
      config.time_24hr = true;
      config.dateFormat = "H:i";
    } else if (isDateTime && !isRange) {
      config.enableTime = true;
      config.time_24hr = true;
      config.dateFormat = "Y-m-d H:i";
    }

    const min = input.getAttribute("min");
    const max = input.getAttribute("max");
    if (min && !isTime) config.minDate = min;
    if (max && !isTime) config.maxDate = max;
    return config;
  }

  function initAdminDatepickers(root = document) {
    if (!window.flatpickr) return;
    const selector = [
      ".flatpickr",
      ".flatpickr-range",
      "input[data-datepicker]",
      "input[data-admin-datepicker]",
      "input[type='date']",
      "input[type='datetime-local']",
      "input[type='time']",
      "input[type='month']",
      "input[id*='Date']",
      "input[id*='date']",
      "input[id*='Range']",
      "input[id*='range']",
      "input[id*='Period']",
      "input[id*='period']",
      "input[name*='date']",
      "input[name*='period']"
    ].join(",");

    $$(selector, root).forEach((input) => {
      if (!(input instanceof HTMLInputElement) || input._flatpickr || input.dataset.adminDatepickerReady) return;
      const config = getDatepickerConfig(input);
      if (!config) return;
      input.dataset.adminOriginalType = input.getAttribute("type") || "text";
      input.setAttribute("type", "text");
      input.setAttribute("autocomplete", "off");
      input.classList.add("admin-datepicker-input");
      input.dataset.adminDatepickerReady = "1";
      window.flatpickr(input, config);
    });
  }

  function observeDatepickerFields() {
    if (!window.MutationObserver) return;
    let queued = false;
    const observer = new MutationObserver((mutations) => {
      if (queued) return;
      if (!mutations.some((mutation) => Array.from(mutation.addedNodes).some((node) => node.nodeType === 1))) return;
      queued = true;
      window.requestAnimationFrame(() => {
        queued = false;
        initAdminDatepickers();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  const iconButtonLabels = {
    "ri-eye-line": "노출",
    "ri-eye-off-line": "미노출",
    "ri-edit-2-line": "수정",
    "ri-pencil-line": "수정",
    "ri-delete-bin-line": "삭제",
    "ri-more-2-line": "더보기",
    "ri-more-2-fill": "더보기",
    "ri-file-copy-line": "복제",
    "ri-search-line": "보기",
    "ri-download-2-line": "내보내기",
    "ri-printer-line": "출력",
    "ri-close-line": "닫기",
    "ri-menu-line": "메뉴",
    "ri-add-line": "추가",
    "ri-save-line": "저장"
  };

  function textWithoutIcons(element) {
    const clone = element.cloneNode(true);
    clone.querySelectorAll("i, svg").forEach((icon) => icon.remove());
    return (clone.textContent || "").trim();
  }

  function enhanceIconButtons(root = document) {
    $$("button.btn, a.btn", root).forEach((button) => {
      const icon = button.querySelector("i[class*='ri-']");
      if (!icon) return;
      const text = textWithoutIcons(button);
      if (!text) button.classList.add("btn-icon-only");
      if (button.getAttribute("aria-label") || button.getAttribute("title")) return;
      const iconClass = Array.from(icon.classList).find((name) => iconButtonLabels[name]);
      const label = iconClass ? iconButtonLabels[iconClass] : "작업";
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
    });
  }

  function syncSelectedRows(root = document) {
    $$("tbody tr", root).forEach((row) => {
      const checked = !!row.querySelector(".form-check-input:checked, .row-check:checked, .rowchk:checked");
      row.classList.toggle("is-selected", checked);
    });
  }

  function initAdminEnhancements(root = document) {
    document.body.classList.add("admin-enhanced");
    enhanceAdminAccessibility(root);
    enhanceIconButtons(root);
    syncSelectedRows(root);
  }

  function observeAdminEnhancements() {
    if (!window.MutationObserver) return;
    let queued = false;
    const observer = new MutationObserver((mutations) => {
      if (queued) return;
      if (!mutations.some((mutation) => Array.from(mutation.addedNodes).some((node) => node.nodeType === 1))) return;
      queued = true;
      window.requestAnimationFrame(() => {
        queued = false;
        initAdminEnhancements();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function visibleFocusable(surface) {
    return $$(focusableSelector, surface).filter((element) => {
      if (element.disabled || element.getAttribute("aria-hidden") === "true") return false;
      const style = window.getComputedStyle(element);
      return style.visibility !== "hidden" && style.display !== "none" && element.getClientRects().length > 0;
    });
  }

  function trapSurfaceFocus(event) {
    if (event.key !== "Tab") return false;
    const surface = topVisible(".modal.show") || topVisible(".offcanvas.show");
    if (!surface) return false;
    const focusable = visibleFocusable(surface);
    if (!focusable.length) {
      event.preventDefault();
      surface.focus?.({ preventScroll: true });
      return true;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
      return true;
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
      return true;
    }
    return false;
  }

  const memberNavItems = [
    { href: "/admin/member/list", label: "사용자 목록", icon: "ri-user-3-line", match: ["/admin/member/list", "/admin/member/add"] },
    { href: "/admin/member/permission", label: "운영진", icon: "ri-shield-user-line", match: ["/admin/member/permission"] },
    { href: "/admin/member/kakao_friend", label: "친구톡", icon: "ri-kakao-talk-fill", match: ["/admin/member/kakao_friend"] },
    { href: "/admin/member/alimtalk", label: "알림톡", icon: "ri-message-3-line", match: ["/admin/member/alimtalk"] },
    { href: "/admin/member/sms", label: "SMS·알림톡", icon: "ri-chat-settings-line", match: ["/admin/member/sms"] },
    { href: "/admin/member/send", label: "발송 로그", icon: "ri-history-line", match: ["/admin/member/send"] }
  ];

  function normalizePath(path) {
    return (path || "/").replace(/\/index\.(php|html)$/, "").replace(/\/+$/, "") || "/";
  }

  function getCurrentNavItem(items, activePath) {
    let current = null;
    let matchLength = -1;

    items.forEach((item) => {
      item.match.forEach((path) => {
        const normalized = normalizePath(path);
        if (activePath !== normalized && !activePath.startsWith(`${normalized}/`)) return;
        if (normalized.length <= matchLength) return;
        current = item;
        matchLength = normalized.length;
      });
    });

    return current || items[0];
  }

  function initStandaloneSections() {
    const activePath = normalizePath(location.pathname);
    if (activePath === "/admin") {
      document.body.classList.add("admin-section-dashboard", "admin-dashboard-view");
    }
    if (activePath === "/admin/design") {
      document.body.classList.add("admin-section-design", "admin-design-view");
    }
  }

  function initMemberSection() {
    const activePath = normalizePath(location.pathname);
    if (!activePath.startsWith("/admin/member")) return;
    document.body.classList.add("admin-section-member");
    document.body.classList.toggle("admin-member-list-view", activePath === "/admin/member/list" || activePath.startsWith("/admin/member/list/"));
    document.body.classList.toggle("admin-member-permission-view", activePath === "/admin/member/permission" || activePath.startsWith("/admin/member/permission/"));
    document.body.classList.toggle("admin-member-message-view", activePath.startsWith("/admin/member/kakao_friend") || activePath.startsWith("/admin/member/alimtalk"));
    document.body.classList.toggle("admin-member-sms-view", activePath.startsWith("/admin/member/sms"));
    document.body.classList.toggle("admin-member-send-view", activePath.startsWith("/admin/member/send"));
    document.body.classList.toggle("admin-member-add-view", activePath.startsWith("/admin/member/add"));

    const main = $("main");
    if (!main || $(".admin-section-context", main)) return;

    const current = getCurrentNavItem(memberNavItems, activePath);
    const pageTitle = $(".top-header h1, .top-header .h5")?.textContent?.trim() || current.label;
    const shouldShowAddUser = activePath === "/admin/member/list" || activePath.startsWith("/admin/member/list/") || activePath.startsWith("/admin/member/add");

    const context = document.createElement("section");
    context.className = "admin-section-context admin-member-context";
    context.innerHTML = `
      <div class="admin-section-context__head">
        <div>
          <div class="admin-section-context__eyebrow">User Management</div>
          <h2 class="admin-section-context__title">${escapeHtml(pageTitle)}</h2>
        </div>
        ${shouldShowAddUser ? '<a class="btn btn-primary btn-sm" href="/admin/member/add"><i class="ri-user-add-line"></i> 사용자 추가</a>' : ""}
      </div>
      <nav class="admin-section-tabs" aria-label="사용자 관리 하위 메뉴">
        ${memberNavItems.map((item) => {
          const isActive = item === current;
          return `
            <a href="${item.href}" class="${isActive ? "active" : ""}" ${isActive ? 'aria-current="page"' : ""}>
              <i class="${item.icon}" aria-hidden="true"></i>
              <span>${item.label}</span>
            </a>
          `;
        }).join("")}
      </nav>
    `;
    main.prepend(context);
  }

  const pointNavItems = [
    { href: "/admin/point/list", label: "현황/내역", icon: "ri-list-check-3", match: ["/admin/point", "/admin/point/list"] },
    { href: "/admin/point/setting", label: "지급/차감하기", icon: "ri-add-circle-line", match: ["/admin/point/setting"] },
    { href: "/admin/point/chart", label: "통계", icon: "ri-bar-chart-line", match: ["/admin/point/chart"] }
  ];

  function initPointSection() {
    const activePath = normalizePath(location.pathname);
    if (!activePath.startsWith("/admin/point")) return;
    document.body.classList.add("admin-section-point");
    document.body.classList.toggle("admin-point-list-view", activePath === "/admin/point" || activePath === "/admin/point/list" || activePath.startsWith("/admin/point/list/"));
    document.body.classList.toggle("admin-point-setting-view", activePath.startsWith("/admin/point/setting"));
    document.body.classList.toggle("admin-point-chart-view", activePath.startsWith("/admin/point/chart"));

    const main = $("main");
    if (!main || $(".admin-section-context", main)) return;

    const current = getCurrentNavItem(pointNavItems, activePath);
    const pageTitle = $(".top-header h1, .top-header .h5")?.textContent?.trim() || current.label;

    const context = document.createElement("section");
    context.className = "admin-section-context admin-point-context";
    context.innerHTML = `
      <div class="admin-section-context__head">
        <div>
          <div class="admin-section-context__eyebrow">Pickpoint</div>
          <h2 class="admin-section-context__title">${escapeHtml(pageTitle)}</h2>
        </div>
        <a class="btn btn-primary btn-sm" href="/admin/point/setting"><i class="ri-add-circle-line"></i> 포인트 지급</a>
      </div>
      <nav class="admin-section-tabs" aria-label="픽포인트 하위 메뉴">
        ${pointNavItems.map((item) => {
          const isActive = item === current;
          return `
            <a href="${item.href}" class="${isActive ? "active" : ""}" ${isActive ? 'aria-current="page"' : ""}>
              <i class="${item.icon}" aria-hidden="true"></i>
              <span>${item.label}</span>
            </a>
          `;
        }).join("")}
      </nav>
    `;
    main.prepend(context);
  }

  const contentNavItems = [
    { href: "/admin/content/post", label: "포스트", icon: "ri-article-line", match: ["/admin/content/post"] },
    { href: "/admin/content/category", label: "카테고리", icon: "ri-folder-3-line", match: ["/admin/content/category"] },
    { href: "/admin/content/board", label: "게시판 관리", icon: "ri-layout-2-line", match: ["/admin/content/board"] },
    { href: "/admin/content/write", label: "게시물", icon: "ri-edit-box-line", match: ["/admin/content/write"] },
    { href: "/admin/content/comment", label: "댓글", icon: "ri-chat-3-line", match: ["/admin/content/comment"] },
    { href: "/admin/content/report", label: "신고·차단", icon: "ri-shield-flash-line", match: ["/admin/content/report"] }
  ];

  function initContentSection() {
    const activePath = normalizePath(location.pathname);
    if (!activePath.startsWith("/admin/content")) return;
    document.body.classList.add("admin-section-content");
    document.body.classList.toggle("admin-content-post-view", activePath.startsWith("/admin/content/post"));
    document.body.classList.toggle("admin-content-category-view", activePath.startsWith("/admin/content/category"));
    document.body.classList.toggle("admin-content-board-view", activePath.startsWith("/admin/content/board"));
    document.body.classList.toggle("admin-content-write-view", activePath.startsWith("/admin/content/write"));
    document.body.classList.toggle("admin-content-comment-view", activePath.startsWith("/admin/content/comment"));
    document.body.classList.toggle("admin-content-report-view", activePath.startsWith("/admin/content/report"));

    const main = $("main");
    if (!main || $(".admin-section-context", main)) return;

    const current = getCurrentNavItem(contentNavItems, activePath);
    const pageTitle = $(".top-header h1, .top-header .h5")?.textContent?.trim() || current.label;

    const context = document.createElement("section");
    context.className = "admin-section-context admin-content-context";
    context.innerHTML = `
      <div class="admin-section-context__head">
        <div>
          <div class="admin-section-context__eyebrow">Content Management</div>
          <h2 class="admin-section-context__title">${escapeHtml(pageTitle)}</h2>
        </div>
      </div>
      <nav class="admin-section-tabs" aria-label="컨텐츠 관리 하위 메뉴">
        ${contentNavItems.map((item) => {
          const isActive = item === current;
          return `
            <a href="${item.href}" class="${isActive ? "active" : ""}" ${isActive ? 'aria-current="page"' : ""}>
              <i class="${item.icon}" aria-hidden="true"></i>
              <span>${item.label}</span>
            </a>
          `;
        }).join("")}
      </nav>
    `;
    main.prepend(context);
  }

  const shoppingNavItems = [
    { href: "/admin/shopping/product", label: "상품", icon: "ri-store-2-line", match: ["/admin/shopping/product"] },
    { href: "/admin/shopping/order", label: "주문", icon: "ri-receipt-line", match: ["/admin/shopping/order"] },
    { href: "/admin/shopping/cancel", label: "취소", icon: "ri-close-circle-line", match: ["/admin/shopping/cancel"] },
    { href: "/admin/shopping/return", label: "반품", icon: "ri-arrow-go-back-line", match: ["/admin/shopping/return"] },
    { href: "/admin/shopping/exchange", label: "교환", icon: "ri-loop-left-line", match: ["/admin/shopping/exchange"] },
    { href: "/admin/shopping/review", label: "리뷰", icon: "ri-star-line", match: ["/admin/shopping/review"] },
    { href: "/admin/shopping/qna", label: "문의", icon: "ri-question-answer-line", match: ["/admin/shopping/qna"] },
    { href: "/admin/shopping/points", label: "적립금", icon: "ri-coins-line", match: ["/admin/shopping/points"] },
    { href: "/admin/shopping/coupon", label: "쿠폰", icon: "ri-coupon-3-line", match: ["/admin/shopping/coupon"] },
    { href: "/admin/shopping/best", label: "베스트/신상품", icon: "ri-medal-line", match: ["/admin/shopping/best"] },
    { href: "/admin/shopping/shipping", label: "배송설정", icon: "ri-truck-line", match: ["/admin/shopping/shipping"] },
    { href: "/admin/shopping/settings", label: "환경설정", icon: "ri-settings-3-line", match: ["/admin/shopping/settings"] }
  ];

  function initShoppingSection() {
    const activePath = normalizePath(location.pathname);
    if (!activePath.startsWith("/admin/shopping")) return;
    document.body.classList.add("admin-section-shopping");
    document.body.classList.toggle("admin-shopping-product-view", activePath.startsWith("/admin/shopping/product"));
    document.body.classList.toggle("admin-shopping-order-view", activePath.startsWith("/admin/shopping/order"));
    document.body.classList.toggle("admin-shopping-cancel-view", activePath.startsWith("/admin/shopping/cancel"));
    document.body.classList.toggle("admin-shopping-return-view", activePath.startsWith("/admin/shopping/return"));
    document.body.classList.toggle("admin-shopping-exchange-view", activePath.startsWith("/admin/shopping/exchange"));
    document.body.classList.toggle("admin-shopping-review-view", activePath.startsWith("/admin/shopping/review"));
    document.body.classList.toggle("admin-shopping-qna-view", activePath.startsWith("/admin/shopping/qna"));
    document.body.classList.toggle("admin-shopping-points-view", activePath.startsWith("/admin/shopping/points"));
    document.body.classList.toggle("admin-shopping-coupon-view", activePath.startsWith("/admin/shopping/coupon"));
    document.body.classList.toggle("admin-shopping-best-view", activePath.startsWith("/admin/shopping/best"));
    document.body.classList.toggle("admin-shopping-shipping-view", activePath.startsWith("/admin/shopping/shipping"));
    document.body.classList.toggle("admin-shopping-settings-view", activePath.startsWith("/admin/shopping/settings"));

    const main = $("main");
    if (!main || $(".admin-section-context", main)) return;

    const current = getCurrentNavItem(shoppingNavItems, activePath);
    const pageTitle = $(".top-header h1, .top-header .h5")?.textContent?.trim() || current.label;

    const context = document.createElement("section");
    context.className = "admin-section-context admin-shopping-context";
    context.innerHTML = `
      <div class="admin-section-context__head">
        <div>
          <div class="admin-section-context__eyebrow">Shopping</div>
          <h2 class="admin-section-context__title">${escapeHtml(pageTitle)}</h2>
        </div>
      </div>
      <nav class="admin-section-tabs" aria-label="쇼핑 관리 하위 메뉴">
        ${shoppingNavItems.map((item) => {
          const isActive = item === current;
          return `
            <a href="${item.href}" class="${isActive ? "active" : ""}" ${isActive ? 'aria-current="page"' : ""}>
              <i class="${item.icon}" aria-hidden="true"></i>
              <span>${item.label}</span>
            </a>
          `;
        }).join("")}
      </nav>
    `;
    main.prepend(context);
  }

  const eventNavItems = [
    { href: "/admin/event", label: "목록", icon: "ri-calendar-event-line", match: ["/admin/event"] },
    { href: "/admin/event/add", label: "추가", icon: "ri-add-box-line", match: ["/admin/event/add"] },
    { href: "/admin/event/review", label: "후기", icon: "ri-star-smile-line", match: ["/admin/event/review", "/admin/event/event/review"] },
    { href: "/admin/event/calendar", label: "일정", icon: "ri-calendar-check-line", match: ["/admin/event/calendar"] },
    { href: "/admin/event/config", label: "환경설정", icon: "ri-settings-3-line", match: ["/admin/event/config"] }
  ];

  function initEventSection() {
    const activePath = normalizePath(location.pathname);
    if (!activePath.startsWith("/admin/event")) return;
    document.body.classList.add("admin-section-event");
    document.body.classList.toggle("admin-event-list-view", activePath === "/admin/event");
    document.body.classList.toggle("admin-event-add-view", activePath.startsWith("/admin/event/add"));
    document.body.classList.toggle("admin-event-review-view", activePath.startsWith("/admin/event/review") || activePath.startsWith("/admin/event/event/review"));
    document.body.classList.toggle("admin-event-calendar-view", activePath.startsWith("/admin/event/calendar"));
    document.body.classList.toggle("admin-event-config-view", activePath.startsWith("/admin/event/config"));

    const main = $("main");
    if (!main || $(".admin-section-context", main)) return;

    const current = getCurrentNavItem(eventNavItems, activePath);
    const pageTitle = $(".top-header h1, .top-header .h5")?.textContent?.trim() || current.label;

    const context = document.createElement("section");
    context.className = "admin-section-context admin-event-context";
    context.innerHTML = `
      <div class="admin-section-context__head">
        <div>
          <div class="admin-section-context__eyebrow">Event</div>
          <h2 class="admin-section-context__title">${escapeHtml(pageTitle)}</h2>
        </div>
      </div>
      <nav class="admin-section-tabs" aria-label="공연 이벤트 하위 메뉴">
        ${eventNavItems.map((item) => {
          const isActive = item === current;
          return `
            <a href="${item.href}" class="${isActive ? "active" : ""}" ${isActive ? 'aria-current="page"' : ""}>
              <i class="${item.icon}" aria-hidden="true"></i>
              <span>${item.label}</span>
            </a>
          `;
        }).join("")}
      </nav>
    `;
    main.prepend(context);
  }

  const bannerNavItems = [
    { href: "/admin/banner", label: "목록", icon: "ri-carousel-view", match: ["/admin/banner"] },
    { href: "/admin/banner/add", label: "추가", icon: "ri-add-box-line", match: ["/admin/banner/add", "/admin/banner/edit"] }
  ];

  function initBannerSection() {
    const activePath = normalizePath(location.pathname);
    if (!activePath.startsWith("/admin/banner")) return;
    document.body.classList.add("admin-section-banner");
    document.body.classList.toggle("admin-banner-list-view", activePath === "/admin/banner");
    document.body.classList.toggle("admin-banner-add-view", activePath.startsWith("/admin/banner/add"));
    document.body.classList.toggle("admin-banner-edit-view", activePath.startsWith("/admin/banner/edit"));

    const main = $("main");
    if (!main || $(".admin-section-context", main)) return;

    const current = getCurrentNavItem(bannerNavItems, activePath);
    const pageTitle = $(".top-header h1, .top-header .h5")?.textContent?.trim() || current.label;

    const context = document.createElement("section");
    context.className = "admin-section-context admin-banner-context";
    context.innerHTML = `
      <div class="admin-section-context__head">
        <div>
          <div class="admin-section-context__eyebrow">Slide</div>
          <h2 class="admin-section-context__title">${escapeHtml(pageTitle)}</h2>
        </div>
      </div>
      <nav class="admin-section-tabs" aria-label="슬라이드 관리 하위 메뉴">
        ${bannerNavItems.map((item) => {
          const isActive = item === current;
          return `
            <a href="${item.href}" class="${isActive ? "active" : ""}" ${isActive ? 'aria-current="page"' : ""}>
              <i class="${item.icon}" aria-hidden="true"></i>
              <span>${item.label}</span>
            </a>
          `;
        }).join("")}
      </nav>
    `;
    main.prepend(context);
  }

  const statNavItems = [
    { href: "/admin/stat/summary", label: "홈", icon: "ri-dashboard-3-line", match: ["/admin/stat/summary"] },
    { href: "/admin/stat/visitor", label: "방문자", icon: "ri-user-location-line", match: ["/admin/stat/visitor"] },
    { href: "/admin/stat/shopping", label: "매출", icon: "ri-line-chart-line", match: ["/admin/stat/shopping"] },
    { href: "/admin/stat/analytics", label: "기간별 분석", icon: "ri-bar-chart-grouped-line", match: ["/admin/stat/analytics"] },
    { href: "/admin/stat/mileage", label: "적립금", icon: "ri-coins-line", match: ["/admin/stat/mileage"] },
    { href: "/admin/stat/feedback", label: "반응", icon: "ri-chat-smile-2-line", match: ["/admin/stat/feedback"] },
    { href: "/admin/stat/keyword", label: "검색어", icon: "ri-search-eye-line", match: ["/admin/stat/keyword"] },
    { href: "/admin/stat/page", label: "페이지", icon: "ri-file-chart-line", match: ["/admin/stat/page"] },
    { href: "/admin/stat/traffic", label: "유입", icon: "ri-route-line", match: ["/admin/stat/traffic"] },
    { href: "/admin/stat/site", label: "사이트", icon: "ri-global-line", match: ["/admin/stat/site"] }
  ];

  function initStatSection() {
    const activePath = normalizePath(location.pathname);
    if (!activePath.startsWith("/admin/stat")) return;
    document.body.classList.add("admin-section-stat");
    statNavItems.forEach((item) => {
      const key = item.match[0].split("/").pop();
      document.body.classList.toggle(`admin-stat-${key}-view`, item.match.some((path) => activePath === path || activePath.startsWith(`${path}/`)));
    });

    const main = $("main");
    if (!main || $(".admin-section-context", main)) return;

    const current = getCurrentNavItem(statNavItems, activePath);
    const pageTitle = $(".top-header h1, .top-header .h5")?.textContent?.trim() || current.label;

    const context = document.createElement("section");
    context.className = "admin-section-context admin-stat-context";
    context.innerHTML = `
      <div class="admin-section-context__head">
        <div>
          <div class="admin-section-context__eyebrow">Statistics</div>
          <h2 class="admin-section-context__title">${escapeHtml(pageTitle)}</h2>
        </div>
      </div>
      <nav class="admin-section-tabs" aria-label="통계 하위 메뉴">
        ${statNavItems.map((item) => {
          const isActive = item === current;
          return `
            <a href="${item.href}" class="${isActive ? "active" : ""}" ${isActive ? 'aria-current="page"' : ""}>
              <i class="${item.icon}" aria-hidden="true"></i>
              <span>${item.label}</span>
            </a>
          `;
        }).join("")}
      </nav>
    `;
    main.prepend(context);
  }

  const configNavItems = [
    { href: "/admin/config/default", label: "일반", icon: "ri-settings-3-line", match: ["/admin/config/default"] },
    { href: "/admin/config/pg", label: "전자결제", icon: "ri-bank-card-line", match: ["/admin/config/pg"] },
    { href: "/admin/config/membership", label: "회원·등급", icon: "ri-user-settings-line", match: ["/admin/config/membership"] },
    { href: "/admin/config/etc", label: "약관", icon: "ri-file-list-3-line", match: ["/admin/config/etc"] },
    { href: "/admin/config/popup", label: "팝업·배너", icon: "ri-window-line", match: ["/admin/config/popup"] },
    { href: "/admin/config/adult", label: "인증", icon: "ri-verified-badge-line", match: ["/admin/config/adult"] },
    { href: "/admin/config/oauth", label: "소셜 로그인", icon: "ri-login-circle-line", match: ["/admin/config/oauth"] },
    { href: "/admin/config/security", label: "보안·권한", icon: "ri-shield-keyhole-line", match: ["/admin/config/security"] }
  ];

  function initConfigSection() {
    const activePath = normalizePath(location.pathname);
    if (!activePath.startsWith("/admin/config")) return;
    document.body.classList.add("admin-section-config");
    configNavItems.forEach((item) => {
      const key = item.match[0].split("/").pop();
      document.body.classList.toggle(`admin-config-${key}-view`, item.match.some((path) => activePath === path || activePath.startsWith(`${path}/`)));
    });

    const main = $("main");
    if (!main || $(".admin-section-context", main)) return;

    const current = getCurrentNavItem(configNavItems, activePath);
    const pageTitle = $(".top-header h1, .top-header .h5")?.textContent?.replace(/\s+/g, " ").trim() || current.label;

    const context = document.createElement("section");
    context.className = "admin-section-context admin-config-context";
    context.innerHTML = `
      <div class="admin-section-context__head">
        <div>
          <div class="admin-section-context__eyebrow">Settings</div>
          <h2 class="admin-section-context__title">${escapeHtml(pageTitle)}</h2>
        </div>
      </div>
      <nav class="admin-section-tabs" aria-label="환경설정 하위 메뉴">
        ${configNavItems.map((item) => {
          const isActive = item === current;
          return `
            <a href="${item.href}" class="${isActive ? "active" : ""}" ${isActive ? 'aria-current="page"' : ""}>
              <i class="${item.icon}" aria-hidden="true"></i>
              <span>${item.label}</span>
            </a>
          `;
        }).join("")}
      </nav>
    `;
    main.prepend(context);
  }

  function initAppstoreSection() {
    const activePath = normalizePath(location.pathname);
    if (!activePath.startsWith("/admin/appstore")) return;
    document.body.classList.add("admin-section-appstore");

    const main = $("main");
    if (!main) return;

    const appItems = $$("main > .row.g-3 > [class*='col-']", main);
    appItems.forEach((item) => {
      const card = $(".card", item);
      if (!card) return;
      item.classList.add("admin-app-card-wrap");
      card.classList.add("admin-app-card");
      const title = $("h2, h3, .h6", card)?.textContent?.trim() || "";
      const badge = $(".badge", card)?.textContent?.trim() || "";
      item.dataset.appName = title;
      item.dataset.status = badge.includes("미사용") ? "inactive" : badge.includes("예정") ? "planned" : "ready";
    });

    if (!$(".admin-section-context", main)) {
      const pageTitle = $(".top-header h1, .top-header .h5")?.textContent?.trim() || "앱스토어";
      const context = document.createElement("section");
      context.className = "admin-section-context admin-appstore-context";
      context.innerHTML = `
        <div class="admin-section-context__head">
          <div>
            <div class="admin-section-context__eyebrow">App Store</div>
            <h2 class="admin-section-context__title">${escapeHtml(pageTitle)}</h2>
          </div>
        </div>
        <div class="admin-appstore-summary" aria-label="앱스토어 요약">
          <span><strong>${appItems.length}</strong> 전체 앱</span>
          <span><strong>${appItems.filter((item) => item.dataset.status === "ready").length}</strong> 연동 준비</span>
          <span><strong>${appItems.filter((item) => item.dataset.status === "planned").length}</strong> 연결 예정</span>
        </div>
      `;
      main.prepend(context);
    }

    if (!$(".admin-appstore-toolbar", main)) {
      const toolbar = document.createElement("section");
      toolbar.className = "admin-appstore-toolbar";
      toolbar.innerHTML = `
        <div class="input-group">
          <span class="input-group-text"><i class="ri-search-line" aria-hidden="true"></i></span>
          <input type="search" class="form-control" id="appstoreSearch" placeholder="앱 이름, 설명 검색" aria-label="앱 검색">
        </div>
        <div class="admin-appstore-filter" role="group" aria-label="앱 상태 필터">
          <button type="button" class="active" data-app-filter="all">전체</button>
          <button type="button" data-app-filter="ready">연동 준비</button>
          <button type="button" data-app-filter="planned">연결 예정</button>
          <button type="button" data-app-filter="inactive">미사용</button>
        </div>
      `;
      $(".admin-section-context", main)?.after(toolbar);
    }

    const searchInput = $("#appstoreSearch", main);
    const filterButtons = $$("[data-app-filter]", main);
    const applyFilter = () => {
      const term = (searchInput?.value || "").trim().toLowerCase();
      const status = filterButtons.find((button) => button.classList.contains("active"))?.dataset.appFilter || "all";
      appItems.forEach((item) => {
        const haystack = item.textContent.toLowerCase();
        const matchesTerm = !term || haystack.includes(term);
        const matchesStatus = status === "all" || item.dataset.status === status;
        item.classList.toggle("is-hidden", !(matchesTerm && matchesStatus));
      });
    };
    searchInput?.addEventListener("input", applyFilter);
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        filterButtons.forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        applyFilter();
      });
    });
  }

  window.AdminDatepicker = {
    refresh: initAdminDatepickers
  };

  window.bootstrap = {
    Modal,
    Offcanvas,
    Collapse,
    Dropdown,
    Tab,
    Toast,
    Tooltip,
    Popover
  };
  window.dispatchEvent(new Event("bootstrap:ready"));

  function normalizeToastMessage(message) {
    return String(message || "처리되었습니다.")
      .replace(/\s*\(데모\)/g, "")
      .replace(/데모 모드:\s*/g, "")
      .replace(/저장\(데모\): 폼 정보가 수집되었습니다\./g, "저장되었습니다.")
      .replace(/임시저장\(데모\)/g, "임시 저장되었습니다.")
      .replace(/임시저장 삭제\(데모\)/g, "임시 저장이 삭제되었습니다.")
      .replace(/\s*[✅🗑️]/g, "")
      .trim();
  }

  function showToast(message, type = "info") {
    let region = $(".admin-toast-region");
    if (!region) {
      region = document.createElement("div");
      region.className = "admin-toast-region";
      region.setAttribute("aria-live", "polite");
      region.setAttribute("aria-atomic", "true");
      document.body.appendChild(region);
    }

    const text = normalizeToastMessage(message);
    const toastType = type === "error" ? "danger" : (type || "info");
    const toastIcon = {
      success: "ri-checkbox-circle-fill",
      info: "ri-information-fill",
      warning: "ri-error-warning-fill",
      danger: "ri-close-circle-fill"
    }[toastType] || "ri-checkbox-circle-fill";
    const toast = document.createElement("div");
    toast.className = `admin-toast admin-toast--${toastType}`;
    toast.setAttribute("role", "status");
    toast.innerHTML = `
      <span class="admin-toast__icon" aria-hidden="true"><i class="${toastIcon}"></i></span>
      <span class="admin-toast__message">${escapeHtml(text)}</span>
      <button type="button" class="admin-toast__close" aria-label="닫기"><i class="ri-close-line"></i></button>
    `;
    region.appendChild(toast);
    toast.querySelector(".admin-toast__close")?.addEventListener("click", () => toast.remove());
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => toast.remove(), 180);
    }, 2400);
  }

  window.AdminToast = { show: showToast };
  window.adminToast = showToast;
  window.adminNativeAlert = window.alert?.bind(window);
  window.alert = (message) => showToast(String(message || ""));

  function getSubmitMessage(form) {
    const explicit = form.getAttribute("data-admin-toast") || form.getAttribute("data-toast");
    if (explicit) return explicit;

    const submitter = document.activeElement?.closest("button, input[type='submit']");
    const triggerText = submitter && form.contains(submitter)
      ? (submitter.textContent || submitter.value || "")
      : "";
    const titleText = form.closest(".modal")?.querySelector(".modal-title")?.textContent || "";
    const text = `${triggerText} ${titleText}`;

    if (/삭제|제거/.test(text)) return "삭제되었습니다.";
    if (/등록|추가|생성|작성|신규/.test(text)) return "등록되었습니다.";
    if (/수정|편집|변경|적용|답변/.test(text)) return "수정되었습니다.";
    return "저장되었습니다.";
  }

  function shouldHandleMockSubmit(form) {
    if (!form || form.hasAttribute("data-native-submit")) return false;
    if (form.matches('[role="search"], .prod-search')) return false;
    const action = (form.getAttribute("action") || "").trim();
    return !action || action === "#" || action.startsWith("javascript:");
  }

  document.addEventListener("click", (event) => {
    const modalSurface = event.target.closest(".modal.show");
    if (modalSurface && event.target === modalSurface) {
      if (allowsBackdropDismiss(modalSurface)) Modal.getOrCreateInstance(modalSurface)?.hide();
      return;
    }

    const backdropSurface = event.target.closest(".admin-backdrop");
    if (backdropSurface && event.target === backdropSurface) {
      const kind = backdropSurface.dataset.kind;
      const target = kind === "offcanvas" ? topVisible(".offcanvas.show") : topVisible(".modal.show");
      if (allowsBackdropDismiss(target)) {
        if (kind === "offcanvas") Offcanvas.getOrCreateInstance(target)?.hide();
        else Modal.getOrCreateInstance(target)?.hide();
      }
      return;
    }

    const dropdownTrigger = event.target.closest("[data-bs-toggle='dropdown']");
    if (dropdownTrigger) {
      event.preventDefault();
      Dropdown.getOrCreateInstance(dropdownTrigger)?.toggle();
      return;
    }

    const tabTrigger = event.target.closest("[data-bs-toggle='tab'], [data-bs-toggle='pill']");
    if (tabTrigger) {
      event.preventDefault();
      Tab.getOrCreateInstance(tabTrigger)?.show();
      return;
    }

    const collapseTrigger = event.target.closest("[data-bs-toggle='collapse']");
    if (collapseTrigger) {
      event.preventDefault();
      Collapse.getOrCreateInstance(getTarget(collapseTrigger))?.toggle();
      return;
    }

    const modalTrigger = event.target.closest("[data-bs-toggle='modal']");
    if (modalTrigger) {
      event.preventDefault();
      const target = getTarget(modalTrigger);
      if (target) target._adminReturnFocus = modalTrigger;
      Modal.getOrCreateInstance(target)?.show();
      return;
    }

    const offcanvasTrigger = event.target.closest("[data-bs-toggle='offcanvas'], [data-notify-trigger]");
    if (offcanvasTrigger) {
      event.preventDefault();
      const target = getTarget(offcanvasTrigger) || $("#offcanvasNotify");
      if (target) target._adminReturnFocus = offcanvasTrigger;
      Offcanvas.getOrCreateInstance(target)?.show();
      return;
    }

    const popoverTrigger = event.target.closest("[data-bs-toggle='popover']");
    if (popoverTrigger) {
      event.preventDefault();
      Popover.getOrCreateInstance(popoverTrigger)?.toggle();
      return;
    }

    const dismiss = event.target.closest("[data-bs-dismiss]");
    if (dismiss) {
      const type = dismiss.getAttribute("data-bs-dismiss");
      const root = dismiss.closest(`.${type}`);
      if (type === "modal") Modal.getOrCreateInstance(root)?.hide();
      if (type === "offcanvas") Offcanvas.getOrCreateInstance(root)?.hide();
      if (type === "toast") Toast.getOrCreateInstance(root)?.hide();
      if (type === "alert") root?.remove();
      return;
    }

    const toastTrigger = event.target.closest("[data-admin-toast]");
    if (toastTrigger) {
      if (toastTrigger.matches('a[href="#"]')) event.preventDefault();
      markButtonBusy(toastTrigger);
      showToast(toastTrigger.getAttribute("data-admin-toast") || "처리되었습니다.");
      return;
    }

    const dropdownItem = event.target.closest(".dropdown-menu .dropdown-item");
    if (dropdownItem) {
      if (dropdownItem.matches('a[href="#"]')) event.preventDefault();
      window.setTimeout(() => closeDropdowns(), 0);
    }

    const hashLink = event.target.closest('a[href="#"]');
    if (hashLink) event.preventDefault();

    if (!event.target.closest(".dropdown")) closeDropdowns();
  });

  document.addEventListener("submit", (event) => {
    if (event.defaultPrevented) return;
    const form = event.target.closest("form");
    if (form?.matches('[role="search"]')) {
      event.preventDefault();
      const keyword = form.querySelector('input[type="search"], input[name="q"], input')?.value?.trim();
      showToast(keyword ? `"${keyword}" 검색을 준비했습니다.` : "검색어를 입력해 주세요.", keyword ? "info" : "warning");
      return;
    }
    if (!shouldHandleMockSubmit(form)) return;
    event.preventDefault();
    if (form.checkValidity && !form.checkValidity()) {
      form.classList.add("was-validated");
      showToast("필수 정보를 확인해 주세요.", "warning");
      form.querySelector(":invalid")?.focus?.({ preventScroll: false });
      return;
    }
    const submitter = event.submitter || document.activeElement?.closest("button, input[type='submit']");
    if (submitter && form.contains(submitter)) markButtonBusy(submitter);
    const modal = form.closest(".modal");
    if (modal) Modal.getOrCreateInstance(modal)?.hide();
    showToast(getSubmitMessage(form));
  });

  document.addEventListener("change", (event) => {
    if (!event.target?.matches?.(".form-check-input, .row-check, .rowchk")) return;
    syncSelectedRows(event.target.closest("table") || document);
  });

  document.addEventListener("keydown", (event) => {
    if (trapSurfaceFocus(event)) return;
    if (event.key !== "Escape") return;
    closeDropdowns();
    $$(".modal.show").forEach((el) => Modal.getOrCreateInstance(el)?.hide());
    $$(".offcanvas.show").forEach((el) => Offcanvas.getOrCreateInstance(el)?.hide());
  });

  ready(() => {
    normalizeFormButtons();

    $$(".offcanvas, .modal").forEach((el) => {
      el.hidden = !el.classList.contains("show");
      if (el.classList.contains("offcanvas")) el.style.visibility = el.classList.contains("show") ? "visible" : "hidden";
    });

    $$(".tab-pane").forEach((pane) => {
      pane.hidden = !(pane.classList.contains("active") || pane.classList.contains("show"));
    });
    $$("[data-bs-toggle='tab'], [data-bs-toggle='pill']").forEach((trigger) => {
      trigger.setAttribute("aria-selected", trigger.classList.contains("active") ? "true" : "false");
    });
    $$("[data-bs-toggle='tooltip']").forEach((trigger) => Tooltip.getOrCreateInstance(trigger));
    $$("[data-bs-toggle='popover']").forEach((trigger) => Popover.getOrCreateInstance(trigger));
    initAdminDatepickers();
    observeDatepickerFields();
    initAdminEnhancements();
    observeAdminEnhancements();
    initStandaloneSections();
    initMemberSection();
    initPointSection();
    initContentSection();
    initShoppingSection();
    initEventSection();
    initBannerSection();
    initStatSection();
    initConfigSection();
    initAppstoreSection();
    initAdminEnhancements();

    const activePath = normalizePath(location.pathname);
    const sidebarPath = activePath === "/admin/point" ? "/admin/point/list" : activePath;
    $$(".sidebar .menu a[href], .offcanvas .menu a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href === "#" || href.startsWith("javascript:") || href.startsWith("http")) return;
      const url = new URL(href, location.origin);
      const linkPath = normalizePath(url.pathname);
      if (linkPath !== sidebarPath) return;
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
      const collapse = link.closest(".collapse");
      if (collapse) {
        Collapse.getOrCreateInstance(collapse)?.show();
        $$(`[href="#${collapse.id}"], [data-bs-target="#${collapse.id}"]`).forEach((trigger) => {
          trigger.classList.add("active-parent");
        });
      }
    });

    requestAnimationFrame(() => {
      $$(".sidebar").forEach((sidebar) => {
        const activeLink = $(".menu a.active[aria-current='page']", sidebar);
        if (!activeLink) return;

        const sidebarRect = sidebar.getBoundingClientRect();
        const activeRect = activeLink.getBoundingClientRect();
        const visibleTop = sidebarRect.top + 16;
        const visibleBottom = sidebarRect.bottom - 16;
        if (activeRect.top >= visibleTop && activeRect.bottom <= visibleBottom) return;

        const activeTop = activeRect.top - sidebarRect.top + sidebar.scrollTop;
        const targetTop = activeTop - (sidebar.clientHeight / 2) + (activeRect.height / 2);
        sidebar.scrollTo({ top: Math.max(0, targetTop), behavior: "auto" });
      });
    });

    const notifyPanel = $("#offcanvasNotify");
    if (notifyPanel) initNotifyPanel(notifyPanel);

    $("#formAdminProfile")?.addEventListener("submit", (event) => {
      event.preventDefault();
      Modal.getOrCreateInstance($("#mdAdminProfile"))?.hide();
      showToast("관리자 정보가 수정되었습니다.");
    });
  });

  function initNotifyPanel(panel) {
    const list = $("#notifyList", panel);
    const empty = $("#notifyEmpty", panel);

    const syncVisibility = () => {
      const has = !!list?.children.length;
      if (list) list.style.display = has ? "block" : "none";
      if (empty) empty.style.display = "none";
    };

    syncVisibility();

    panel.addEventListener("click", (event) => {
      const actionButton = event.target.closest(".dropdown-item[data-action]");
      if (!actionButton) return;

      event.preventDefault();
      const item = actionButton.closest(".list-group-item");
      const action = actionButton.dataset.action;

      if (action === "mark-read") {
        item?.classList.remove("bg-body-tertiary");
        item?.querySelector(".badge.text-bg-primary")?.remove();
        showToast("알림을 읽음 처리했습니다.");
      }
      if (action === "open") {
        const url = item?.getAttribute("data-url");
        if (url) window.open(url, "_blank");
        else showToast("연결된 상세 페이지가 없습니다.", "warning");
      }
      if (action === "delete") {
        item?.remove();
        syncVisibility();
        showToast("알림을 삭제했습니다.");
      }

      closeDropdowns();
    });

    panel.querySelector("[data-notify-markread]")?.addEventListener("click", () => {
      $$("#notifyList .list-group-item", panel).forEach((item) => {
        item.classList.remove("bg-body-tertiary");
        item.querySelector(".badge.text-bg-primary")?.remove();
      });
      showToast("모든 알림을 읽음 처리했습니다.");
    });

    window.notifyCenter = {
      render(items) {
        if (!Array.isArray(items) || !list) return;
        list.innerHTML = "";
        items.forEach((item) => {
          const li = document.createElement("li");
          li.className = `list-group-item d-flex gap-2 align-items-start${item.unread ? " bg-body-tertiary" : ""}`;
          li.dataset.url = item.url || "";
          li.innerHTML = `
            <i class="${escapeHtml(item.icon || "ri-notification-2-line")} fs-5 mt-1"></i>
            <div class="flex-grow-1">
              <div class="d-flex">
                <div class="fw-semibold">${escapeHtml(item.title || "")}</div>
                ${item.unread ? '<span class="badge rounded-pill text-bg-primary ms-2">New</span>' : ""}
                <small class="ms-auto text-body-secondary">${escapeHtml(item.time || "")}</small>
              </div>
              ${item.desc ? `<div class="small text-body-secondary mt-1">${escapeHtml(item.desc)}</div>` : ""}
            </div>
          `;
          list.appendChild(li);
        });
        syncVisibility();
      }
    };
  }
})();
