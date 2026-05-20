(() => {
  const ready = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  };

  const createId = () => `file_${Math.random().toString(36).slice(2)}`;

  const BOARD_CATEGORY_GROUPS = {
    "jeju-life-news": {
      label: "제주살이 뉴스",
      items: [
        { value: "jeju-news", label: "제주뉴스" },
        { value: "youth-support", label: "청년지원" },
        { value: "jeju-jobs", label: "제주일자리" }
      ]
    },
    "community-tip": {
      label: "제주살이 꿀팁",
      single: true,
      items: [
        { value: "community-tip", label: "제주살이 꿀팁" }
      ]
    },
    "picjeju-friends": {
      label: "픽제주 친구들",
      single: true,
      items: [
        { value: "picjeju-friends", label: "픽제주 친구들" }
      ]
    },
    "community-event": {
      label: "이벤트",
      single: true,
      items: [
        { value: "community-event", label: "이벤트" }
      ]
    },
    market: {
      label: "장터",
      items: [
        { value: "talent-class", label: "재능나눔/클래스" },
        { value: "giveaway", label: "나눔" },
        { value: "sale", label: "판매" }
      ]
    },
    "point-exchange": {
      label: "픽포인트 거래소",
      items: [
        { value: "point-buy", label: "구해요" },
        { value: "point-sell", label: "팔아요" },
        { value: "point-done", label: "거래완료" }
      ]
    }
  };

  const PRIMARY_CATEGORY_ALIASES = {
    event: "community-event",
    community: "jeju-life-news",
    "board-news": "jeju-life-news",
    "community-friends": "picjeju-friends",
    "board-market": "market",
    "pickpoint-exchange": "point-exchange",
    "point-market": "point-exchange",
    point: "point-exchange"
  };

  const CATEGORY_ALIASES = {
    "board-news": "jeju-news",
    "youth-program": "youth-support",
    jobs: "jeju-jobs",
    tip: "community-tip",
    "picjeju-event": "community-event",
    event: "community-event",
    "community-friends": "picjeju-friends",
    friends: "picjeju-friends",
    "board-market": "sale",
    "market-sale": "sale",
    sharing: "giveaway",
    sell: "sale",
    "point-exchange": "point-buy",
    buy: "point-buy",
    "point-buy": "point-buy",
    "point-purchase": "point-buy",
    "point-wanted": "point-buy",
    "point-sale": "point-sell",
    "point-sell": "point-sell",
    done: "point-done",
    complete: "point-done",
    completed: "point-done",
    "point-done": "point-done",
    "trade-done": "point-done"
  };

  const POINT_EXCHANGE_CATEGORY_ALIASES = {
    "point-exchange": "point-buy",
    buy: "point-buy",
    sell: "point-sell",
    done: "point-done",
    complete: "point-done",
    completed: "point-done"
  };

  const normalizePrimaryCategory = (value) => {
    const key = String(value || "").trim();
    return PRIMARY_CATEGORY_ALIASES[key] || key;
  };

  const normalizeSubCategory = (value, primaryValue = "") => {
    const key = String(value || "").trim();
    if (!key) return "";
    if (primaryValue === "point-exchange") {
      return POINT_EXCHANGE_CATEGORY_ALIASES[key] || CATEGORY_ALIASES[key] || key;
    }
    return CATEGORY_ALIASES[key] || key;
  };

  const showToast = (message) => {
    const container = document.getElementById("pj-toast-container") || document.body;
    const toast = document.createElement("div");
    toast.className = "pj-toast is-visible";
    toast.textContent = message;
    container.appendChild(toast);
    window.setTimeout(() => toast.remove(), 1800);
  };

  const initEditor = (root) => {
    const body = root.querySelector("[data-editor-body]");
    const output = root.querySelector("[data-editor-output]");
    const blockSelect = root.querySelector("[data-editor-block]");
    const imageInput = root.querySelector("[data-editor-image]");
    if (!body || !output) return null;

    const sync = () => {
      output.value = body.innerHTML.trim();
      body.classList.toggle("is-empty", !body.textContent.trim() && !body.querySelector("img"));
    };

    const focusEditor = () => body.focus();

    root.addEventListener("click", (event) => {
      const commandButton = event.target.closest("[data-editor-command]");
      if (commandButton) {
        event.preventDefault();
        focusEditor();
        document.execCommand(commandButton.dataset.editorCommand, false, null);
        sync();
        return;
      }

      const linkButton = event.target.closest("[data-editor-link]");
      if (linkButton) {
        event.preventDefault();
        focusEditor();
        const href = window.prompt("링크 URL을 입력해 주세요.");
        if (href) document.execCommand("createLink", false, href);
        sync();
      }
    });

    if (blockSelect) {
      blockSelect.addEventListener("change", () => {
        focusEditor();
        document.execCommand("formatBlock", false, blockSelect.value || "p");
        sync();
      });
    }

    if (imageInput) {
      imageInput.addEventListener("change", () => {
        focusEditor();
        Array.from(imageInput.files || []).forEach((file) => {
          if (!file.type.startsWith("image/")) return;
          const url = URL.createObjectURL(file);
          document.execCommand("insertHTML", false, `<p><img src="${url}" alt="${file.name}"></p>`);
        });
        imageInput.value = "";
        sync();
      });
    }

    body.addEventListener("input", sync);
    body.addEventListener("blur", sync);
    sync();

    return { body, output, sync };
  };

  const initRichEditor = (root) => {
    if (!root) return null;

    const body = root.querySelector("[data-editor-body]");
    const output = root.querySelector("[data-editor-output]");
    const fallback = root.querySelector("[data-editor-fallback]");
    const fallbackTextarea = fallback?.querySelector("textarea");
    if (!body || !output) return null;

    const toPlainText = (html) => {
      const template = document.createElement("template");
      template.innerHTML = html || "";
      return (template.content.textContent || "").replace(/\s+/g, " ").trim();
    };

    const createFallbackAdapter = () => {
      body.hidden = true;
      if (fallback) fallback.hidden = false;

      const input = fallbackTextarea || body;
      if (!fallbackTextarea) {
        body.hidden = false;
        body.contentEditable = "true";
        body.classList.add("front-editor__body");
      }

      const sync = () => {
        output.value = fallbackTextarea ? fallbackTextarea.value.trim() : body.innerHTML.trim();
        if (output.value) root.classList.remove("is-invalid");
      };
      const getText = () => (fallbackTextarea ? fallbackTextarea.value : body.textContent).trim();
      const hasContent = () => {
        if (fallbackTextarea) return Boolean(fallbackTextarea.value.trim());
        return Boolean(body.textContent.trim() || body.querySelector("img"));
      };
      const focus = () => input.focus();

      input.addEventListener("input", sync);
      input.addEventListener("blur", sync);
      sync();

      return { root, body: input, output, sync, getText, hasContent, focus };
    };

    const EditorConstructor = window.toastui?.Editor;
    if (!EditorConstructor) return createFallbackAdapter();

    try {
      const toastEditor = new EditorConstructor({
        el: body,
        height: "400px",
        initialEditType: "wysiwyg",
        previewStyle: "vertical",
        placeholder: body.dataset.placeholder || ""
      });

      if (fallback) fallback.hidden = true;
      body.hidden = false;

      const getHtml = () => (typeof toastEditor.getHTML === "function" ? toastEditor.getHTML() : "");
      const getText = () => {
        const markdown = typeof toastEditor.getMarkdown === "function" ? toastEditor.getMarkdown() : "";
        return (markdown || toPlainText(getHtml())).replace(/\s+/g, " ").trim();
      };
      const sync = () => {
        output.value = getHtml().trim();
        if (hasContent()) root.classList.remove("is-invalid");
      };
      const hasContent = () => Boolean(getText() || /<img\b/i.test(getHtml()));
      const focus = () => {
        if (typeof toastEditor.focus === "function") {
          toastEditor.focus();
          return;
        }
        body.querySelector("[contenteditable='true'], textarea")?.focus();
      };

      if (typeof toastEditor.on === "function") {
        toastEditor.on("change", sync);
      }
      body.addEventListener("blur", sync, true);
      sync();

      return { root, body, output, sync, getText, hasContent, focus, editor: toastEditor };
    } catch (error) {
      console.warn("Toast UI Editor initialization failed.", error);
      return createFallbackAdapter();
    }
  };

  const initFileInput = ({ input, list, thumbOnly = false }) => {
    if (!input || !list) return { files: [], clear: () => {} };

    const state = { files: [] };

    const clear = () => {
      state.files.forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
      state.files = [];
      list.innerHTML = "";
    };

    const render = () => {
      list.innerHTML = "";
      state.files.forEach((item) => {
        const node = document.createElement("div");
        node.className = thumbOnly ? "front-board-write__thumb-item" : "front-board-write__file-item";
        node.innerHTML = item.url
          ? `<img src="${item.url}" alt="${item.file.name}"><button type="button" data-remove-file="${item.id}" aria-label="파일 삭제"></button>`
          : `<span>${item.file.name}</span><button type="button" data-remove-file="${item.id}" aria-label="파일 삭제"></button>`;
        list.appendChild(node);
      });
    };

    input.addEventListener("change", () => {
      if (thumbOnly) clear();
      Array.from(input.files || []).forEach((file) => {
        const item = { id: createId(), file };
        if (file.type.startsWith("image/")) item.url = URL.createObjectURL(file);
        state.files.push(item);
      });
      input.value = "";
      render();
    });

    list.addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove-file]");
      if (!button) return;
      const index = state.files.findIndex((item) => item.id === button.dataset.removeFile);
      if (index < 0) return;
      if (state.files[index].url) URL.revokeObjectURL(state.files[index].url);
      state.files.splice(index, 1);
      render();
    });

    return { files: state.files, clear };
  };

  const getSelectedCategory = (form) => {
    const primarySelect = form.querySelector("[data-board-primary-category]");
    const subSelect = form.querySelector("[data-board-sub-category]");
    const primaryValue = primarySelect?.value || "";
    const subValue = subSelect?.value || "";
    const group = BOARD_CATEGORY_GROUPS[primaryValue];
    const item = group?.items.find((entry) => entry.value === subValue);

    return {
      primaryValue,
      primaryLabel: group?.label || "",
      subValue: item ? item.value : "",
      subLabel: item?.label || ""
    };
  };

  const syncCategoryFields = (form) => {
    const selected = getSelectedCategory(form);
    const hiddenCategory = form.querySelector("#boardCategory");
    if (hiddenCategory) hiddenCategory.value = selected.subValue;
    return selected;
  };

  const findPrimaryBySubCategory = (subValue) => {
    if (!subValue) return "";
    return Object.entries(BOARD_CATEGORY_GROUPS).find(([, group]) =>
      group.items.some((item) => item.value === subValue)
    )?.[0] || "";
  };

  const populateSubCategories = (subSelect, primaryValue, selectedValue = "") => {
    const group = BOARD_CATEGORY_GROUPS[primaryValue];
    const placeholder = new Option(
      group ? "하위분류를 선택해 주세요." : "대분류를 먼저 선택해 주세요.",
      ""
    );

    subSelect.disabled = false;
    subSelect.replaceChildren(placeholder);
    if (!group) return;

    group.items.forEach((item) => {
      subSelect.add(new Option(item.label, item.value));
    });

    if (group.items.some((item) => item.value === selectedValue)) {
      subSelect.value = selectedValue;
    } else if (group.single && group.items[0]) {
      subSelect.value = group.items[0].value;
    }

    if (group.single) subSelect.disabled = true;
  };

  const initCategorySelects = (form) => {
    const primarySelect = form.querySelector("[data-board-primary-category]");
    const subSelect = form.querySelector("[data-board-sub-category]");
    if (!primarySelect || !subSelect) return;

    const params = new URLSearchParams(window.location.search);
    let requestedPrimary = normalizePrimaryCategory(params.get("primary"));
    const requestedSub = normalizeSubCategory(params.get("sub"), requestedPrimary);
    const requestedSubPrimary = findPrimaryBySubCategory(requestedSub);

    if (requestedSubPrimary && requestedSubPrimary !== requestedPrimary) {
      requestedPrimary = requestedSubPrimary;
    }

    if (BOARD_CATEGORY_GROUPS[requestedPrimary]) {
      primarySelect.value = requestedPrimary;
    }

    populateSubCategories(subSelect, primarySelect.value, requestedSub);
    syncCategoryFields(form);

    primarySelect.addEventListener("change", () => {
      populateSubCategories(subSelect, primarySelect.value);
      syncCategoryFields(form);
    });

    subSelect.addEventListener("change", () => {
      syncCategoryFields(form);
    });
  };

  const collectFormData = ({ form, editor, thumbnail, attachments }) => {
    editor.sync();
    const selected = syncCategoryFields(form);
    const formData = new FormData(form);
    formData.set("primaryCategory", selected.primaryValue);
    formData.set("primaryCategoryLabel", selected.primaryLabel);
    formData.set("subCategory", selected.subValue);
    formData.set("subCategoryLabel", selected.subLabel);
    formData.set("category", selected.subValue);
    formData.set("content", editor.output.value);
    thumbnail.files.forEach((item) => formData.append("thumbnailFile", item.file));
    attachments.files.forEach((item) => formData.append("files[]", item.file));
    return formData;
  };

  const setInvalid = (control, invalid = true) => {
    if (!control) return;
    control.classList.toggle("is-invalid", invalid);
    if (invalid) {
      control.setAttribute("aria-invalid", "true");
    } else {
      control.removeAttribute("aria-invalid");
    }
  };

  const setEditorInvalid = (editor, invalid = true) => {
    editor.root?.classList.toggle("is-invalid", invalid);
    if (invalid) {
      editor.body?.setAttribute?.("aria-invalid", "true");
    } else {
      editor.body?.removeAttribute?.("aria-invalid");
    }
  };

  const clearInvalidStates = (form, editor) => {
    form.querySelectorAll(".is-invalid").forEach((control) => setInvalid(control, false));
    setEditorInvalid(editor, false);
  };

  const setSubmitting = (form, isSubmitting) => {
    const submitButton = form.querySelector('[type="submit"]');
    const buttons = form.querySelectorAll("button");
    form.classList.toggle("is-submitting", isSubmitting);
    form.setAttribute("aria-busy", isSubmitting ? "true" : "false");

    buttons.forEach((button) => {
      button.disabled = isSubmitting;
    });

    if (!submitButton) return;
    if (!submitButton.dataset.defaultLabel) submitButton.dataset.defaultLabel = submitButton.textContent.trim();
    submitButton.textContent = isSubmitting ? "등록 중..." : submitButton.dataset.defaultLabel;
  };

  const validate = (form, editor) => {
    clearInvalidStates(form, editor);
    syncCategoryFields(form);
    const primaryCategory = form.querySelector("[data-board-primary-category]");
    const subCategory = form.querySelector("[data-board-sub-category]");
    const title = form.querySelector("#boardTitle");

    if (!primaryCategory?.value) {
      setInvalid(primaryCategory);
      primaryCategory?.focus();
      showToast("대분류를 선택해 주세요.");
      return false;
    }

    if (!subCategory?.value) {
      setInvalid(subCategory);
      subCategory?.focus();
      showToast("하위분류를 선택해 주세요.");
      return false;
    }

    if (!title.value.trim()) {
      setInvalid(title);
      title.focus();
      showToast("제목을 입력해 주세요.");
      return false;
    }

    if (!editor.hasContent()) {
      setEditorInvalid(editor);
      editor.focus();
      showToast("내용을 입력해 주세요.");
      return false;
    }

    return true;
  };

  const initBoardWrite = () => {
    const form = document.querySelector("[data-board-write-form]");
    if (!form) return;

    initCategorySelects(form);

    const editor = initRichEditor(form.querySelector("[data-board-editor]"));
    if (!editor) return;

    form.addEventListener("input", (event) => {
      if (event.target.matches(".is-invalid")) setInvalid(event.target, false);
    });

    form.addEventListener("change", (event) => {
      if (event.target.matches(".is-invalid")) setInvalid(event.target, false);
    });

    const thumbnail = initFileInput({
      input: form.querySelector("#boardThumbnail"),
      list: form.querySelector("[data-board-thumb-preview]"),
      thumbOnly: true
    });

    const attachments = initFileInput({
      input: form.querySelector("#boardFiles"),
      list: form.querySelector("[data-board-file-list]")
    });

    form.querySelector("[data-board-cancel]")?.addEventListener("click", () => {
      history.length > 1 ? history.back() : (window.location.href = "board-news.html");
    });

    form.querySelector("[data-board-draft]")?.addEventListener("click", () => {
      const payload = Object.fromEntries(collectFormData({ form, editor, thumbnail, attachments }).entries());
      localStorage.setItem("picjejuBoardDraft", JSON.stringify({ ...payload, savedAt: new Date().toISOString() }));
      showToast("임시저장되었습니다.");
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!validate(form, editor)) return;

      const formData = collectFormData({ form, editor, thumbnail, attachments });
      setSubmitting(form, true);

      try {
        const response = await fetch(form.dataset.endpoint || "/api/posts", {
          method: "POST",
          body: formData
        });
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        localStorage.removeItem("picjejuBoardDraft");
        showToast("게시글이 등록되었습니다.");
        window.setTimeout(() => {
          window.location.href = "board-news.html";
        }, 650);
      } catch (error) {
        console.warn(error);
        setSubmitting(form, false);
        showToast("등록에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    });
  };

  ready(initBoardWrite);
})();
