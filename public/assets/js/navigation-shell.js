(() => {
  const ready = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  };

  const renderMobileUser = () => {
    const root = document.querySelector(".mo-user-info");
    if (!root) return;

    const isLoggedIn = document.body.classList.contains("is-logged-in");
    const userName = "페르난도";
    const userAvatar = window.picjejuAsset ? window.picjejuAsset("images/avatar-sample.png") : "/assets/images/avatar-sample.png";

    if (isLoggedIn) {
      root.innerHTML = `
        <div class="user">
          <img src="${userAvatar}" alt="">
          <span>${userName}</span>
        </div>
      `;
      return;
    }

    root.innerHTML = '<button type="button" class="pj-button pj-button--primary" data-pj-toggle="modal" data-pj-target="#loginModal">로그인</button>';
  };

  const initGlobalMenu = () => {
    const items = Array.from(document.querySelectorAll("#main-menu > li"));
    const targetBox = document.querySelector("#global-sub-container");
    if (!items.length || !targetBox) return;

    let activeItem = null;

    const activateMenu = (item) => {
      if (!item) return;
      activeItem?.classList.remove("active");
      item.classList.add("active");
      activeItem = item;

      const key = item.dataset.sub;
      const source = key ? document.querySelector(`#${key}`) : null;
      targetBox.replaceChildren();
      if (source instanceof HTMLTemplateElement) {
        targetBox.append(source.content.cloneNode(true));
      } else if (source) {
        targetBox.innerHTML = source.innerHTML;
      }
      targetBox.querySelector(".sub-menu > li")?.classList.add("active");
    };

    items.forEach((item) => {
      item.addEventListener("mouseenter", () => activateMenu(item));
      item.addEventListener("focusin", () => activateMenu(item));
    });

    activateMenu(items.find((item) => item.dataset.sub) || items[0]);
  };

  const initMobileNav = () => {
    const buttons = Array.from(document.querySelectorAll(".mo-nav-btn"));
    if (!buttons.length) return;
    const getControlledSubmenu = (button) => {
      const id = button.getAttribute("aria-controls");
      if (id) return document.getElementById(id);

      const sibling = button.nextElementSibling;
      return sibling?.classList.contains("mo-sub") ? sibling : null;
    };
    const submenuButtons = buttons.filter(getControlledSubmenu);

    const openSub = (element) => {
      if (!element) return;
      if (!element.querySelector("a.current")) {
        element.querySelector(".active")?.classList.remove("active");
        element.querySelector("li")?.classList.add("active");
      }
      element.classList.add("open");
      element.style.height = `${element.scrollHeight}px`;
      const button = element.previousElementSibling;
      if (button?.classList.contains("mo-nav-btn")) button.setAttribute("aria-expanded", "true");
      element.addEventListener("transitionend", () => {
        if (element.classList.contains("open")) element.style.height = "auto";
      }, { once: true });
    };

    const closeSub = (element) => {
      if (!element || !element.classList.contains("open")) return;
      element.style.height = `${element.scrollHeight}px`;
      requestAnimationFrame(() => {
        element.style.height = "0px";
      });
      element.querySelector(".active")?.classList.remove("active");
      element.addEventListener("transitionend", () => {
        if (!element.style.height || element.style.height === "0px") element.classList.remove("open");
      }, { once: true });
      const button = element.previousElementSibling;
      if (button?.classList.contains("mo-nav-btn")) button.setAttribute("aria-expanded", "false");
    };

    submenuButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const subMenu = getControlledSubmenu(button);
        if (!subMenu) return;

        document.querySelectorAll(".mo-sub").forEach((other) => {
          if (other !== subMenu) closeSub(other);
        });
        submenuButtons.forEach((otherButton) => {
          otherButton.classList.remove("active");
          otherButton.setAttribute("aria-expanded", "false");
        });

        if (subMenu.classList.contains("open")) {
          closeSub(subMenu);
        } else {
          openSub(subMenu);
          button.classList.add("active");
        }
      });
    });

    const currentFile = location.pathname.split("/").pop();
    if (!currentFile) return;

    document.querySelectorAll(".mo-sub li a, .mo-nav-link").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const hrefFile = href.split("/").pop();
      if (hrefFile !== currentFile) return;

      link.classList.add("current");
      const subMenu = link.closest(".mo-sub");
      if (!subMenu) return;

      openSub(subMenu);
      const parentButton = subMenu.previousElementSibling;
      if (parentButton?.classList.contains("mo-nav-btn")) parentButton.classList.add("active");
    });
  };

  ready(() => {
    renderMobileUser();
    initGlobalMenu();
    initMobileNav();
  });
})();
