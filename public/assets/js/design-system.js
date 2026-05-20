(function () {
  "use strict";

  const SELECTOR_FOCUSABLE = [
    "a[href]",
    "area[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  const SELECTORS = {
    modal: ".pj-modal, .pj-modal",
    modalShown: ".pj-modal.show, .pj-modal.show",
    offcanvas: ".pj-offcanvas, .pj-offcanvas",
    offcanvasShown: ".pj-offcanvas.show, .pj-offcanvas.show",
    dropdown: ".pj-dropdown, .pj-dropdown",
    dropdownMenu: ".pj-dropdown-menu, .pj-dropdown-menu",
    dropdownMenuShown: ".pj-dropdown-menu.show, .pj-dropdown-menu.show",
    nav: ".nav, .pj-nav, [role='tablist']",
    activeNav: ".pj-nav-link.active, .pj-nav-link.active, [data-pj-toggle='tab'].active",
    activePane: ".pj-tab-pane.active, .pj-tab-pane.show, .pj-tab-pane.active, .pj-tab-pane.show"
  };

  function resolveElement(element) {
    if (!element) return null;
    if (typeof element === "string") return document.querySelector(element);
    if (element.jquery) return element[0];
    return element;
  }

  function getTargetFromTrigger(trigger) {
    const target = trigger.getAttribute("data-pj-target") || trigger.getAttribute("href");
    if (!target || target === "#") return null;
    try {
      return document.querySelector(target);
    } catch (_) {
      return null;
    }
  }

  function emit(element, name, detail) {
    const event = new CustomEvent(name, {
      bubbles: true,
      cancelable: true,
      detail: detail || {}
    });
    element.dispatchEvent(event);
    return event;
  }

  function getFocusable(element) {
    return Array.from(element.querySelectorAll(SELECTOR_FOCUSABLE)).filter((node) => {
      const style = window.getComputedStyle(node);
      return style.visibility !== "hidden" && style.display !== "none";
    });
  }

  function createBackdrop(kind, onClick) {
    const backdrop = document.createElement("div");
    backdrop.className = `pj-${kind}-backdrop`;
    document.body.appendChild(backdrop);
    backdrop.addEventListener("click", onClick);
    window.requestAnimationFrame(() => backdrop.classList.add("show"));
    return backdrop;
  }

  function removeBackdrop(backdrop) {
    if (!backdrop) return;
    backdrop.classList.remove("show");
    window.setTimeout(() => backdrop.remove(), 160);
  }

  function dataBool(element, name, fallback) {
    const value = element.getAttribute(name);
    if (value === null) return fallback;
    return value !== "false";
  }

  function makeComponent(name, proto) {
    const store = new WeakMap();

    class Component {
      constructor(element, options) {
        this._element = resolveElement(element);
        this._options = options || {};
        if (!this._element) return;
        store.set(this._element, this);
        if (proto.init) proto.init.call(this);
      }

      static getInstance(element) {
        const resolved = resolveElement(element);
        return resolved ? store.get(resolved) || null : null;
      }

      static getOrCreateInstance(element, options) {
        const resolved = resolveElement(element);
        if (!resolved) return null;
        return store.get(resolved) || new Component(resolved, options);
      }

      static get NAME() {
        return name;
      }
    }

    Object.keys(proto).forEach((key) => {
      if (key !== "init") Component.prototype[key] = proto[key];
    });

    return Component;
  }

  const Modal = makeComponent("modal", {
    init() {
      this._backdrop = null;
      this._isShown = this._element.classList.contains("show");
      this._handleBackgroundClick = (event) => {
        if (event.target === this._element && this._shouldCloseOnBackdrop()) this.hide();
      };
      this._element.addEventListener("click", this._handleBackgroundClick);
    },

    _getBackdropOption() {
      if (Object.prototype.hasOwnProperty.call(this._options, "backdrop")) {
        return this._options.backdrop;
      }
      const value = this._element.getAttribute("data-pj-backdrop");
      return value === null ? true : value;
    },

    _hasBackdrop() {
      const value = this._getBackdropOption();
      return value !== false && value !== "false";
    },

    _shouldCloseOnBackdrop() {
      const value = this._getBackdropOption();
      return value !== false && value !== "false" && value !== "static";
    },

    show() {
      if (!this._element || this._isShown) return;
      if (emit(this._element, "show.ui.modal").defaultPrevented) return;

      document.querySelectorAll(SELECTORS.modalShown).forEach((modal) => {
        if (modal !== this._element) Modal.getOrCreateInstance(modal).hide();
      });

      this._isShown = true;
      this._element.style.display = "block";
      this._element.removeAttribute("aria-hidden");
      this._element.setAttribute("aria-modal", "true");
      this._element.setAttribute("role", "dialog");
      document.body.classList.add("pj-modal-open");
      if (this._hasBackdrop()) {
        this._backdrop = createBackdrop("modal", () => {
          if (this._shouldCloseOnBackdrop()) this.hide();
        });
      }

      window.requestAnimationFrame(() => {
        this._element.classList.add("show");
        const focusTarget = getFocusable(this._element)[0] || this._element;
        if (!focusTarget.hasAttribute("tabindex")) focusTarget.setAttribute("tabindex", "-1");
        focusTarget.focus({ preventScroll: true });
        emit(this._element, "shown.ui.modal");
      });
    },

    hide() {
      if (!this._element || !this._isShown) return;
      if (emit(this._element, "hide.ui.modal").defaultPrevented) return;

      this._isShown = false;
      this._element.classList.remove("show");
      window.setTimeout(() => {
        this._element.style.display = "none";
        this._element.setAttribute("aria-hidden", "true");
        this._element.removeAttribute("aria-modal");
        this._element.removeAttribute("role");
        removeBackdrop(this._backdrop);
        this._backdrop = null;
        if (!document.querySelector(SELECTORS.modalShown)) document.body.classList.remove("pj-modal-open");
        emit(this._element, "hidden.ui.modal");
      }, 160);
    },

    toggle() {
      this._isShown ? this.hide() : this.show();
    }
  });

  const Offcanvas = makeComponent("offcanvas", {
    init() {
      this._backdrop = null;
      this._isShown = this._element.classList.contains("show");
    },

    show() {
      if (!this._element || this._isShown) return;
      if (emit(this._element, "show.ui.offcanvas").defaultPrevented) return;

      this._isShown = true;
      this._element.style.visibility = "visible";
      this._element.removeAttribute("aria-hidden");
      this._element.setAttribute("aria-modal", "true");
      this._element.setAttribute("role", "dialog");

      const shouldScroll = dataBool(this._element, "data-pj-scroll", false);
      const shouldBackdrop = dataBool(this._element, "data-pj-backdrop", true);
      if (!shouldScroll) document.body.classList.add("pj-offcanvas-open");
      if (shouldBackdrop) this._backdrop = createBackdrop("offcanvas", () => this.hide());

      window.requestAnimationFrame(() => {
        this._element.classList.add("show");
        const focusTarget = getFocusable(this._element)[0] || this._element;
        if (!focusTarget.hasAttribute("tabindex")) focusTarget.setAttribute("tabindex", "-1");
        focusTarget.focus({ preventScroll: true });
        emit(this._element, "shown.ui.offcanvas");
      });
    },

    hide() {
      if (!this._element || !this._isShown) return;
      if (emit(this._element, "hide.ui.offcanvas").defaultPrevented) return;

      this._isShown = false;
      this._element.classList.remove("show");
      window.setTimeout(() => {
        this._element.style.visibility = "hidden";
        this._element.setAttribute("aria-hidden", "true");
        this._element.removeAttribute("aria-modal");
        this._element.removeAttribute("role");
        removeBackdrop(this._backdrop);
        this._backdrop = null;
        if (!document.querySelector(SELECTORS.offcanvasShown)) document.body.classList.remove("pj-offcanvas-open");
        emit(this._element, "hidden.ui.offcanvas");
      }, 300);
    },

    toggle() {
      this._isShown ? this.hide() : this.show();
    }
  });

  const Dropdown = makeComponent("dropdown", {
    init() {
      this._menu = this._findMenu();
    },

    _findMenu() {
      const parent = this._element.closest(SELECTORS.dropdown) || this._element.parentElement;
      return parent ? parent.querySelector(SELECTORS.dropdownMenu) : null;
    },

    show() {
      if (!this._element) return;
      document.querySelectorAll(SELECTORS.dropdownMenuShown).forEach((menu) => {
        if (menu !== this._menu) menu.classList.remove("show");
      });
      document.querySelectorAll("[data-pj-toggle='dropdown'].show").forEach((button) => {
        if (button !== this._element) button.classList.remove("show");
      });
      this._menu = this._findMenu();
      if (!this._menu) return;
      this._element.classList.add("show");
      this._element.setAttribute("aria-expanded", "true");
      this._menu.classList.add("show");
      emit(this._element, "shown.ui.dropdown");
    },

    hide() {
      if (!this._element) return;
      this._menu = this._findMenu();
      this._element.classList.remove("show");
      this._element.setAttribute("aria-expanded", "false");
      if (this._menu) this._menu.classList.remove("show");
      emit(this._element, "hidden.ui.dropdown");
    },

    toggle() {
      this._menu = this._findMenu();
      if (this._menu && this._menu.classList.contains("show")) this.hide();
      else this.show();
    }
  });

  const Collapse = makeComponent("collapse", {
    show() {
      if (!this._element || this._element.classList.contains("show")) return;
      if (emit(this._element, "show.ui.collapse").defaultPrevented) return;
      this._element.classList.add("show");
      emit(this._element, "shown.ui.collapse");
    },

    hide() {
      if (!this._element || !this._element.classList.contains("show")) return;
      if (emit(this._element, "hide.ui.collapse").defaultPrevented) return;
      this._element.classList.remove("show");
      emit(this._element, "hidden.ui.collapse");
    },

    toggle() {
      this._element.classList.contains("show") ? this.hide() : this.show();
    }
  });

  const Tab = makeComponent("tab", {
    show() {
      if (!this._element || this._element.classList.contains("active")) return;
      const parent = this._element.closest(SELECTORS.nav) || this._element.parentElement;
      const target = getTargetFromTrigger(this._element);
      const activeTab = parent ? parent.querySelector(SELECTORS.activeNav) : null;

      if (activeTab && emit(activeTab, "hide.ui.tab", { relatedTarget: this._element }).defaultPrevented) return;
      if (emit(this._element, "show.ui.tab", { relatedTarget: activeTab }).defaultPrevented) return;

      if (parent) {
        parent.querySelectorAll(SELECTORS.activeNav).forEach((tab) => {
          tab.classList.remove("active");
          tab.setAttribute("aria-selected", "false");
        });
      }

      const paneContainer = target ? target.parentElement : null;
      if (paneContainer) {
        paneContainer.querySelectorAll(SELECTORS.activePane).forEach((pane) => {
          pane.classList.remove("active", "show");
        });
      }

      this._element.classList.add("active");
      this._element.setAttribute("aria-selected", "true");
      if (target) target.classList.add("active", "show");

      if (activeTab) emit(activeTab, "hidden.ui.tab", { relatedTarget: this._element });
      emit(this._element, "shown.ui.tab", { relatedTarget: activeTab });
    }
  });

  function dismissClosest(trigger, type) {
    const root = trigger.closest(type === "modal" ? SELECTORS.modal : SELECTORS.offcanvas);
    if (!root) return;
    const Constructor = type === "modal" ? Modal : Offcanvas;
    Constructor.getOrCreateInstance(root).hide();
  }

  document.addEventListener("click", (event) => {
    const dismiss = event.target.closest("[data-pj-dismiss]");
    if (dismiss) {
      const type = dismiss.getAttribute("data-pj-dismiss");
      if (type === "modal" || type === "offcanvas") {
        event.preventDefault();
        dismissClosest(dismiss, type);
        return;
      }
    }

    const trigger = event.target.closest("[data-pj-toggle]");
    if (!trigger) {
      if (!event.target.closest(SELECTORS.dropdownMenu)) {
        document.querySelectorAll("[data-pj-toggle='dropdown'].show").forEach((button) => {
          Dropdown.getOrCreateInstance(button).hide();
        });
      }
      return;
    }

    const type = trigger.getAttribute("data-pj-toggle");
    const target = getTargetFromTrigger(trigger);

    if (type === "modal" && target) {
      event.preventDefault();
      Modal.getOrCreateInstance(target).show();
    }

    if (type === "offcanvas" && target) {
      event.preventDefault();
      Offcanvas.getOrCreateInstance(target).show();
    }

    if (type === "dropdown") {
      event.preventDefault();
      Dropdown.getOrCreateInstance(trigger).toggle();
    }

    if (type === "collapse" && target) {
      event.preventDefault();
      Collapse.getOrCreateInstance(target).toggle();
      trigger.classList.toggle("pj-collapsed", !target.classList.contains("show"));
      trigger.setAttribute("aria-expanded", target.classList.contains("show") ? "true" : "false");
    }

    if (type === "tab" && target) {
      event.preventDefault();
      Tab.getOrCreateInstance(trigger).show();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const notificationPanel = document.querySelector(".pj-notification-panel.is-open");
    if (notificationPanel) {
      closeNotificationPanel({ focusTrigger: true });
      return;
    }

    const openModal = Array.from(document.querySelectorAll(SELECTORS.modalShown)).pop();
    if (openModal) {
      Modal.getOrCreateInstance(openModal).hide();
      return;
    }

    const openOffcanvas = Array.from(document.querySelectorAll(SELECTORS.offcanvasShown)).pop();
    if (openOffcanvas) {
      Offcanvas.getOrCreateInstance(openOffcanvas).hide();
      return;
    }

    document.querySelectorAll("[data-pj-toggle='dropdown'].show").forEach((button) => {
      Dropdown.getOrCreateInstance(button).hide();
    });
  });

  function ready(callback) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback);
    else callback();
  }

  const SELECT_ENHANCE_SELECTOR = "select.pj-field, select.pj-select, select.front-editor__select";
  const SELECT_ICON_SRC = "/assets/images/svg/icon_chevron_bottom.svg";
  let selectObserver = null;

  function shouldEnhanceSelect(select) {
    return select
      && select.tagName === "SELECT"
      && !select.multiple
      && Number(select.getAttribute("size") || 1) <= 1
      && select.getAttribute("data-pj-native-select") !== "true";
  }

  function createSelectIcon() {
    const icon = document.createElement("img");
    icon.className = "pj-select-shell__icon";
    icon.setAttribute("src", SELECT_ICON_SRC);
    icon.alt = "";
    icon.decoding = "async";
    icon.setAttribute("aria-hidden", "true");
    return icon;
  }

  function syncSelectIcon(shell) {
    const currentIcon = shell.querySelector(".pj-select-shell__icon");
    const currentIconSrc = currentIcon?.getAttribute("src") || "";
    const isCurrentSvg = currentIcon
      && currentIcon.tagName === "IMG"
      && (currentIconSrc === SELECT_ICON_SRC || currentIcon.src.endsWith(SELECT_ICON_SRC));

    if (isCurrentSvg) return;

    const icon = createSelectIcon();
    if (currentIcon) currentIcon.replaceWith(icon);
    else shell.appendChild(icon);
  }

  function enhanceSelect(select) {
    if (!shouldEnhanceSelect(select)) return;

    const currentShell = select.parentElement?.classList.contains("pj-select-shell")
      ? select.parentElement
      : null;

    if (currentShell) {
      syncSelectIcon(currentShell);
      return;
    }

    const shell = document.createElement("span");
    shell.className = "pj-select-shell";
    select.parentNode.insertBefore(shell, select);
    shell.appendChild(select);
    syncSelectIcon(shell);
  }

  function initSelectShells(root) {
    const scope = root && root.nodeType === 1 ? root : document;
    if (scope.matches?.(SELECT_ENHANCE_SELECTOR)) enhanceSelect(scope);
    scope.querySelectorAll?.(SELECT_ENHANCE_SELECTOR).forEach(enhanceSelect);
  }

  function observeSelectShells() {
    if (selectObserver || !document.body) return;

    selectObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) initSelectShells(node);
        });
      });
    });

    selectObserver.observe(document.body, { childList: true, subtree: true });
  }

  function showToast(message) {
    let region = document.querySelector(".pj-toast-region");
    if (!region) {
      region = document.createElement("div");
      region.className="pj-toast-region";
      region.setAttribute("aria-live", "polite");
      region.setAttribute("aria-atomic", "true");
      document.body.appendChild(region);
    }

    const toast = document.createElement("div");
    toast.className="pj-toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    region.appendChild(toast);

    window.requestAnimationFrame(() => toast.classList.add("is-visible"));
    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => toast.remove(), 200);
    }, 2600);
  }

  function installMessageFallbacks() {
    if (window.__picjejuMessageFallbacksInstalled) return;
    window.__picjejuMessageFallbacksInstalled = true;
    window.alert = (message) => showToast(String(message || ""));
  }

  function installStaticApiFallback() {
    if (!window.fetch || !window.location.pathname.includes("/html-design-system/")) return;
    if (window.__picjejuStaticApiFallbackInstalled) return;
    window.__picjejuStaticApiFallbackInstalled = true;

    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      let url;
      try {
        const rawUrl = typeof input === "string" ? input : input.url;
        url = new URL(rawUrl, window.location.href);
      } catch (_) {
        return nativeFetch(input, init);
      }

      if (url.origin === window.location.origin && url.pathname.startsWith("/api/")) {
        return Promise.resolve(new Response(JSON.stringify({ ok: true, demo: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }));
      }

      return nativeFetch(input, init);
    };
  }

  const NOTIFICATION_STORAGE_KEY = "picjeju.notifications.read.v1";
  const NOTIFICATION_ITEMS = [
    {
      id: "event-morning-club",
      category: "공연/축제",
      tone: "event",
      title: "모닝 플리 디제잉 팝업 일정이 열려요",
      body: "골드브루와 함께하는 팝업 상세 일정과 장소를 확인해 보세요.",
      time: "방금",
      href: "event.html"
    },
    {
      id: "community-reply",
      category: "커뮤니티",
      tone: "community",
      title: "내 글에 새로운 댓글이 달렸어요",
      body: "제주 동행 모집 글에 새 반응이 있어 커뮤니티에서 바로 확인할 수 있어요.",
      time: "12분 전",
      href: "community.html"
    },
    {
      id: "shop-cart",
      category: "픽제주몰",
      tone: "shop",
      title: "장바구니에 담긴 상품을 잊지 마세요",
      body: "로컬 상품 주문을 이어서 진행하거나 수량을 다시 확인할 수 있어요.",
      time: "1시간 전",
      href: "cart.html"
    },
    {
      id: "newsletter-weekly",
      category: "뉴스레터",
      tone: "letter",
      title: "이번 주 제주 소식이 준비됐어요",
      body: "축제, 동네 소식, 로컬 마켓 소식을 뉴스레터로 모아봤습니다.",
      time: "어제",
      href: "https://picjeju.stibee.com/",
      external: true
    }
  ];
  let activeNotificationTrigger = null;

  function escapeNotificationHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function getNotificationReadIds() {
    try {
      const value = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      const ids = value ? JSON.parse(value) : [];
      return new Set(Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : []);
    } catch (_) {
      return new Set();
    }
  }

  function setNotificationReadIds(ids) {
    try {
      window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(Array.from(ids)));
    } catch (_) {
      // Ignore storage failures; the panel can still work for the current page view.
    }
  }

  function getNotificationHref(item) {
    if (!item.href) return "#";
    if (item.external || /^https?:\/\//i.test(item.href)) return item.href;
    return getPageUrl(item.href);
  }

  function getNotificationPageUrl() {
    return getPageUrl("notifications.html");
  }

  function getNotificationItems() {
    const readIds = getNotificationReadIds();
    return NOTIFICATION_ITEMS.map((item) => Object.assign({}, item, { read: readIds.has(item.id) }));
  }

  function getUnreadNotificationCount() {
    return getNotificationItems().filter((item) => !item.read).length;
  }

  function syncNotificationTriggers(isOpen) {
    const unreadCount = getUnreadNotificationCount();
    const countText = unreadCount > 9 ? "9+" : String(unreadCount);

    document.querySelectorAll("[data-pj-notification-count]").forEach((badge) => {
      badge.textContent = countText;
      badge.hidden = unreadCount === 0;
      badge.setAttribute("aria-hidden", "true");
    });

    document.querySelectorAll(".action-bell, [data-pj-action='notifications']").forEach((trigger) => {
      trigger.setAttribute("data-pj-action", "notifications");
      trigger.setAttribute("data-pj-href", getNotificationPageUrl());
      trigger.setAttribute("aria-label", unreadCount > 0 ? `알림 ${unreadCount}개 보기` : "알림 보기");
      trigger.removeAttribute("aria-controls");
      trigger.removeAttribute("aria-expanded");
    });
  }

  function getNotificationListMarkup(items) {
    return items.map((item) => {
      const href = escapeNotificationHtml(getNotificationHref(item));
      const target = item.external ? ' target="_blank" rel="noopener"' : "";
      return `
        <li class="pj-notification-item">
          <a class="pj-notification-link pj-notification-link--${escapeNotificationHtml(item.tone)}${item.read ? " is-read" : ""}" href="${href}" data-pj-notification-id="${escapeNotificationHtml(item.id)}"${target}>
            <span class="pj-notification-dot" aria-hidden="true"></span>
            <span class="pj-notification-copy">
              <span class="pj-notification-meta">
                <span class="pj-notification-category">${escapeNotificationHtml(item.category)}</span>
                <span class="pj-notification-time">${escapeNotificationHtml(item.time)}</span>
              </span>
              <strong>${escapeNotificationHtml(item.title)}</strong>
              <span class="pj-notification-body">${escapeNotificationHtml(item.body)}</span>
            </span>
          </a>
        </li>`;
    }).join("");
  }

  function getNotificationSummary(items) {
    const unreadCount = items.filter((item) => !item.read).length;
    return {
      unreadCount,
      title: unreadCount > 0 ? `새 알림 ${unreadCount}개` : "새 알림 없음",
      text: unreadCount > 0
        ? "관심 행사와 커뮤니티 소식을 한곳에 모았어요."
        : "모든 알림을 확인했습니다."
    };
  }

  function renderNotificationPanel(panel) {
    const items = getNotificationItems();
    const summary = getNotificationSummary(items);
    const listMarkup = getNotificationListMarkup(items);

    panel.innerHTML = `
      <div class="pj-notification-head">
        <div>
          <p class="pj-notification-kicker">PICJEJU 알림</p>
          <h2 class="pj-notification-title" id="pjNotificationTitle">놓치기 쉬운 소식</h2>
        </div>
        <button type="button" class="pj-notification-close" data-pj-notification-close aria-label="알림 닫기" title="알림 닫기">×</button>
      </div>
      <div class="pj-notification-summary">
        <strong>${summary.title}</strong>
        <span>${summary.text}</span>
      </div>
      <div class="pj-notification-actions">
        <button type="button" class="pj-button pj-button--primary pj-button--sm" data-pj-notification-read${summary.unreadCount === 0 ? " disabled" : ""}>모두 읽음</button>
        <a class="pj-button pj-button--outline-primary pj-button--sm" href="${escapeNotificationHtml(getPageUrl("mypage.html"))}">마이페이지</a>
      </div>
      <ul class="pj-notification-list">
        ${listMarkup}
      </ul>`;
    syncNotificationTriggers(panel.classList.contains("is-open"));
  }

  function renderNotificationPage(container) {
    const items = getNotificationItems();
    const summary = getNotificationSummary(items);
    const listMarkup = getNotificationListMarkup(items);
    container.innerHTML = `
      <article class="notification-page-card">
        <div class="notification-page-hero">
          <div>
            <p class="notification-page-kicker">PICJEJU 알림</p>
            <h1 class="notification-page-title">놓치기 쉬운 소식</h1>
            <p class="notification-page-copy">${summary.text}</p>
          </div>
        </div>
        <div class="notification-page-toolbar">
          <div>
            <strong>${summary.title}</strong>
            <span>행사, 커뮤니티, 쇼핑, 뉴스레터 알림을 확인하세요.</span>
          </div>
          <button type="button" class="pj-button pj-button--primary" data-pj-notification-read${summary.unreadCount === 0 ? " disabled" : ""}>모두 읽음</button>
        </div>
        <ul class="pj-notification-list notification-page-list">
          ${listMarkup}
        </ul>
      </article>`;
  }

  function ensureNotificationPanel() {
    let panel = document.querySelector(".pj-notification-panel");
    if (panel) return panel;

    panel = document.createElement("section");
    panel.className = "pj-notification-panel";
    panel.id = "pjNotificationPanel";
    panel.tabIndex = -1;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-labelledby", "pjNotificationTitle");
    panel.setAttribute("aria-hidden", "true");
    renderNotificationPanel(panel);
    document.body.appendChild(panel);
    return panel;
  }

  function refreshNotificationPanel() {
    const panel = document.querySelector(".pj-notification-panel");
    if (panel) renderNotificationPanel(panel);
    document.querySelectorAll("[data-pj-notification-page]").forEach((container) => renderNotificationPage(container));
    syncNotificationTriggers(Boolean(panel && panel.classList.contains("is-open")));
  }

  function markNotificationRead(id, shouldRefresh) {
    if (!id) return;
    const readIds = getNotificationReadIds();
    if (!readIds.has(id)) {
      readIds.add(id);
      setNotificationReadIds(readIds);
    }
    if (shouldRefresh !== false) refreshNotificationPanel();
  }

  function markAllNotificationsRead() {
    setNotificationReadIds(new Set(NOTIFICATION_ITEMS.map((item) => item.id)));
    refreshNotificationPanel();
    showToast("알림을 모두 읽음 처리했습니다.");
  }

  function closeNotificationPanel(options) {
    const panel = document.querySelector(".pj-notification-panel.is-open");
    if (panel) {
      panel.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
    }
    syncNotificationTriggers(false);
    if (options && options.focusTrigger && activeNotificationTrigger && activeNotificationTrigger.isConnected) {
      activeNotificationTrigger.focus({ preventScroll: true });
    }
  }

  function openNotificationPanel(trigger) {
    const panel = ensureNotificationPanel();
    activeNotificationTrigger = trigger || activeNotificationTrigger;
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    renderNotificationPanel(panel);
    panel.focus({ preventScroll: true });
  }

  function toggleNotificationPanel(trigger) {
    const panel = ensureNotificationPanel();
    if (panel.classList.contains("is-open")) closeNotificationPanel({ focusTrigger: false });
    else openNotificationPanel(trigger);
  }

  function goToNotificationPage() {
    const target = new URL(getNotificationPageUrl(), window.location.href);
    if (target.pathname === window.location.pathname) {
      closeNotificationPanel({ focusTrigger: false });
      document.querySelectorAll(SELECTORS.offcanvasShown).forEach((element) => {
        Offcanvas.getOrCreateInstance(element).hide();
      });
      refreshNotificationPanel();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.location.href = target.href;
  }

  function ensureReportModal() {
    let modal = document.getElementById("modalReport");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.className="pj-modal pj-fade";
    modal.id = "modalReport";
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="pj-modal-dialog pj-modal-dialog--centered">
        <form class="pj-modal-content" id="reportForm">
          <div class="pj-modal-header">
            <h5 class="pj-modal-title">신고하기</h5>
            <button type="button" class="pj-button-close" data-pj-dismiss="modal" aria-label="닫기"></button>
          </div>
          <div class="pj-modal-body">
            <input type="hidden" name="target_id" id="reportReviewId">
            <label class="pj-label" for="pjReportReason">신고 사유</label>
            <textarea class="pj-field" id="pjReportReason" name="reason" rows="4" placeholder="신고 사유를 입력해주세요."></textarea>
          </div>
          <div class="pj-modal-footer">
            <button type="button" class="pj-button pj-button--gray" data-pj-dismiss="modal">취소</button>
            <button type="submit" class="pj-button pj-button--danger">신고</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(modal);
    return modal;
  }

  function findReportId(trigger) {
    const target = trigger.closest("[data-review-id], [data-comment-id], [data-post-id], .rv-item, .cmt-item");
    if (!target) return "";
    return target.getAttribute("data-review-id") ||
      target.getAttribute("data-comment-id") ||
      target.getAttribute("data-post-id") ||
      "";
  }

  function openReportModal(trigger) {
    const modal = ensureReportModal();
    const field = modal.querySelector("#reportReviewId, [name='target_id'], [name='review_id']");
    if (field) field.value = findReportId(trigger);
    const textarea = modal.querySelector("textarea");
    if (textarea) textarea.value = "";
    Modal.getOrCreateInstance(modal).show();
  }

  function isNotificationTrigger(trigger) {
    if (!trigger) return false;
    if (trigger.matches(".action-bell, [data-pj-action='notifications']")) return true;
    return trigger.matches("a[href='#'], button") && trigger.textContent.trim().includes("알림");
  }

  function isReportTrigger(trigger) {
    if (!trigger) return false;
    if (trigger.matches(".rv-report, .cmt-action-report, [data-pj-report]")) return true;
    return /신고/.test(trigger.textContent.trim()) && trigger.closest(".rv-item, .cmt-item, article, .comment");
  }

  function getActionText(trigger) {
    return (trigger.getAttribute("aria-label") || trigger.getAttribute("title") || trigger.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getPageUrl(page) {
    if (window.picjejuPage) return window.picjejuPage(page);
    return page;
  }

  function updateChoice(trigger) {
    const text = getActionText(trigger);
    const menu = trigger.closest(SELECTORS.dropdownMenu);
    if (menu) {
      menu.querySelectorAll(".pj-dropdown-item.active, .pj-dropdown-item.active").forEach((item) => item.classList.remove("active"));
      trigger.classList.add("active");

      const dropdown = menu.closest(SELECTORS.dropdown);
      const toggle = dropdown ? dropdown.querySelector("[data-pj-toggle='dropdown']") : null;
      if (toggle && text) toggle.textContent = text;
      if (toggle) Dropdown.getOrCreateInstance(toggle).hide();
    }
    showToast(text ? `${text} 기준으로 변경했습니다.` : "선택이 변경되었습니다.");
  }

  function getLinkHref(trigger) {
    if (!trigger) return "";
    return trigger.getAttribute("href") || trigger.getAttribute("data-pj-href") || "";
  }

  function updatePagination(trigger) {
    const nav = trigger.closest(".page-nav");
    if (!nav) return false;

    const links = Array.from(nav.querySelectorAll("a, button")).filter((link) => /^\d+$/.test(getActionText(link)));
    const active = links.find((link) => link.classList.contains("active"));
    let index = active ? links.indexOf(active) : 0;

    if (trigger.closest(".prev")) index = Math.max(0, index - 1);
    else if (trigger.closest(".next")) index = Math.min(links.length - 1, index + 1);
    else if (/^\d+$/.test(getActionText(trigger))) index = links.indexOf(trigger);

    links.forEach((link) => link.classList.remove("active"));
    if (links[index]) {
      links[index].classList.add("active");
      showToast(`${getActionText(links[index])}페이지로 이동했습니다.`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    return true;
  }

  function handleDemoAction(trigger) {
    if (trigger.matches(".cmt-action-edit")) {
      showToast("수정 기능은 정적 데모에서 확인용으로 처리됩니다.");
      return true;
    }
    if (trigger.matches(".cmt-action-move")) {
      showToast("이동 기능은 정적 데모에서 확인용으로 처리됩니다.");
      return true;
    }
    if (trigger.matches(".cmt-action-delete")) {
      showToast("삭제 기능은 정적 데모에서 확인용으로 처리됩니다.");
      return true;
    }
    return false;
  }

  function handlePlaceholderLink(trigger) {
    if (!trigger || getLinkHref(trigger) !== "#") return false;
    if (trigger.hasAttribute("data-pj-toggle") || trigger.hasAttribute("data-pj-target")) return false;

    const text = getActionText(trigger);

    if (updatePagination(trigger)) return true;

    if (trigger.classList.contains("pj-dropdown-item") || trigger.classList.contains("pj-dropdown-item") || trigger.closest(SELECTORS.dropdownMenu)) {
      updateChoice(trigger);
      return true;
    }

    if (trigger.closest(".sns-icons")) {
      showToast("간편 로그인은 정적 데모 화면에서 연결되지 않습니다.");
      return true;
    }

    if (/목록/.test(text)) {
      window.location.href = getPageUrl("community.html");
      return true;
    }

    if (/글쓰기/.test(text)) {
      showToast("글쓰기는 로그인 후 이용할 수 있습니다.");
      return true;
    }

    if (/신청하기/.test(text)) {
      window.location.href = getPageUrl("apply.html");
      return true;
    }

    if (/자세히보기/.test(text)) {
      showToast("자세히보기 링크는 정적 데모에서 확인용으로 처리됩니다.");
      return true;
    }

    if (/뉴스레터/.test(text)) {
      window.open("https://picjeju.stibee.com/", "_blank", "noopener");
      return true;
    }

    if (/사업자정보/.test(text)) {
      showToast("사업자정보 확인은 외부 연동 항목입니다.");
      return true;
    }

    if (/ABOUT/i.test(text)) {
      showToast("ABOUT 페이지는 준비 중입니다.");
      return true;
    }

    return false;
  }

  function runJavascriptLink(href) {
    const code = href.replace(/^javascript:\s*/i, "").trim();
    if (!code || code === "void(0)" || code === "void 0") return;

    if (/^Kakao\.Channel\.chat/.test(code) && window.Kakao && window.Kakao.Channel) {
      window.Kakao.Channel.chat({ channelPublicId: "_tJxizxj" });
      return;
    }

    window.location.href = href;
  }

  function handleButtonLink(trigger, event) {
    if (!trigger || trigger.tagName !== "BUTTON") return false;
    const href = trigger.getAttribute("data-pj-href");
    if (!href || href === "#") return false;

    if (/^javascript:/i.test(href)) {
      runJavascriptLink(href);
      return true;
    }

    const target = trigger.getAttribute("data-pj-link-target") || ((event.metaKey || event.ctrlKey) ? "_blank" : "");
    if (target && target !== "_self") {
      window.open(href, target, "noopener");
      return true;
    }

    window.location.href = href;
    return true;
  }

  function initPicjejuInteractions() {
    document.addEventListener("click", (event) => {
      const notificationClose = event.target.closest("[data-pj-notification-close]");
      if (notificationClose) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeNotificationPanel({ focusTrigger: true });
        return;
      }

      const notificationReadButton = event.target.closest("[data-pj-notification-read]");
      if (notificationReadButton) {
        event.preventDefault();
        event.stopImmediatePropagation();
        markAllNotificationsRead();
        return;
      }

      const notificationItem = event.target.closest("[data-pj-notification-id]");
      if (notificationItem) {
        markNotificationRead(notificationItem.getAttribute("data-pj-notification-id"), false);
        window.setTimeout(refreshNotificationPanel, 0);
      }

      const notificationTrigger = event.target.closest("a, button");
      if (isNotificationTrigger(notificationTrigger)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        goToNotificationPage();
        return;
      }

      const reportTrigger = event.target.closest("button, a");
      if (isReportTrigger(reportTrigger)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openReportModal(reportTrigger);
        return;
      }

      const cartTrigger = event.target.closest(".action-cart[href='#'], .action-cart[data-pj-href='#'], [data-pj-action='cart']");
      if (cartTrigger) {
        const cart = document.getElementById("cart");
        if (cart) {
          event.preventDefault();
          Offcanvas.getOrCreateInstance(cart).show();
        }
        return;
      }

      const logoutTrigger = event.target.closest(".action-logout, a[href$='#logout']");
      if (logoutTrigger) {
        event.preventDefault();
        showToast("로그아웃 데모가 처리되었습니다.");
      }
    }, true);

    document.addEventListener("click", (event) => {
      if (event.defaultPrevented) return;

      const actionTrigger = event.target.closest("button, a");
      if (actionTrigger && handleDemoAction(actionTrigger)) {
        event.preventDefault();
        return;
      }

      const placeholderTrigger = event.target.closest("a[href='#'], button[data-pj-href='#']");
      if (placeholderTrigger && handlePlaceholderLink(placeholderTrigger)) {
        event.preventDefault();
        return;
      }

      const linkButton = event.target.closest("button[data-pj-href]");
      if (linkButton && handleButtonLink(linkButton, event)) {
        event.preventDefault();
      }
    });

    document.addEventListener("click", (event) => {
      const panel = document.querySelector(".pj-notification-panel.is-open");
      if (!panel) return;
      if (event.target.closest(".pj-notification-panel") || event.target.closest(".action-bell, [data-pj-action='notifications']")) return;
      closeNotificationPanel({ focusTrigger: false });
    });

    document.addEventListener("submit", (event) => {
      const form = event.target.closest("#reportForm, [data-pj-report-form]");
      if (!form) return;
      event.preventDefault();
      event.stopImmediatePropagation();

      const textarea = form.querySelector("textarea");
      if (textarea && !textarea.value.trim()) {
        textarea.focus();
        showToast("신고 사유를 입력해주세요.");
        return;
      }

      const modal = form.closest(SELECTORS.modal);
      if (modal) Modal.getOrCreateInstance(modal).hide();
      form.reset();
      showToast("신고가 접수되었습니다.");
    }, true);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(SELECTORS.modal).forEach((element) => {
      element.style.display = element.classList.contains("show") ? "block" : "none";
      Modal.getOrCreateInstance(element);
    });

    document.querySelectorAll(SELECTORS.offcanvas).forEach((element) => {
      element.style.visibility = element.classList.contains("show") ? "visible" : "hidden";
      Offcanvas.getOrCreateInstance(element);
    });

    document.querySelectorAll("[data-pj-toggle='tab'].active").forEach((trigger) => {
      Tab.getOrCreateInstance(trigger).show();
    });
  });

  ready(() => {
    initSelectShells(document);
    observeSelectShells();
    installMessageFallbacks();
    installStaticApiFallback();
    refreshNotificationPanel();
    syncNotificationTriggers(false);
    initPicjejuInteractions();
  });

  window.picjejuUI = Object.assign(window.picjejuUI || {}, {
    Modal,
    Offcanvas,
    Dropdown,
    Collapse,
    Tab,
    enhanceSelects: initSelectShells
  });
  window.picjejuToast = showToast;
})();
