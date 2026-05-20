/* ============================================================
 * review.js — PICJEJU Review System Full Version
 * ============================================================ */

const STORE_RV_UPLOADERS = new Map();
const rvAsset = window.picjejuAsset || ((path) => `/assets/${String(path || "").replace(/^\//, "")}`);

document.addEventListener("DOMContentLoaded", () => {
  rvInitSwiper();
  rvInitSortButtons();
  rvInitPhotoFilter();
  rvInitRatingDropdown();
  rvInitUploaders();
  rvInitWriteForm();
  rvInitEditForm();
  rvInitDelete();
  rvInitReport();
  rvInitLightbox();
  rvInitStarDelegation();
});

/* ----------------- 공통 유틸 ----------------- */
function rvGetRatingFromItem(item) {
  return parseInt(item.getAttribute("data-rating"), 10) || 0;
}

function rvToggleEmptyState() {
  const items = document.querySelectorAll(".rv-item");
  const empty = document.querySelector(".rv-empty");
  if (!empty) return;

  let hasVisible = false;
  items.forEach(i => { if (i.style.display !== "none") hasVisible = true; });
  empty.style.display = hasVisible ? "none" : "block";
}

/* ----------------- Swiper ----------------- */
function rvInitSwiper() {
  document.querySelectorAll(".rv-images.swiper").forEach(el => {
    if (el.swiper) return;
    new Swiper(el, {
      slidesPerView: 6,
      spaceBetween: 16,
      freeMode: true,
      breakpoints: {
        0: { slidesPerView: 3.5, spaceBetween: 10 },
        768: { slidesPerView: 6, spaceBetween: 16 }
      }
    });
  });
}

/* ----------------- 정렬 ----------------- */
function rvInitSortButtons() {
  const btns = document.querySelectorAll(".sort-label");
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      btns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      rvSort(btn.dataset.sort);
    });
  });
}

function rvSort(type) {
  const list = document.querySelector(".rv-list");
  if (!list) return;

  const items = Array.from(document.querySelectorAll(".rv-item"));

  if (type === "latest") {
    items.sort((a, b) => {
      const da = new Date(a.querySelector(".date").textContent);
      const db = new Date(b.querySelector(".date").textContent);
      return db - da;
    });
  } else {
    // 베스트 = 별점 높은 순
    items.sort((a, b) => rvGetRatingFromItem(b) - rvGetRatingFromItem(a));
  }

  items.forEach(i => list.appendChild(i));
  rvApplyRatingFilter();
}

/* ----------------- 포토 리뷰만 ----------------- */
function rvInitPhotoFilter() {
  const checks = document.querySelectorAll("[data-rv-photo-only]");
  if (!checks.length) return;

  checks.forEach(chk => {
    chk.addEventListener("change", () => {
      checks.forEach(peer => {
        if (peer !== chk) peer.checked = chk.checked;
      });
      rvApplyRatingFilter();
    });
  });
}

/* ----------------- 별점 드롭다운 (정확히 점수 equal) ----------------- */
function rvInitRatingDropdown() {
  const btns = document.querySelectorAll("[data-rv-sort-btn]");
  const menus = document.querySelectorAll("[data-rv-sort-menu]");
  if (!btns.length || !menus.length) return;

  btns.forEach(btn => {
    btn.dataset.ratingExact = "";
  });

  menus.forEach(menu => {
    menu.querySelectorAll("[data-rating]").forEach(item => {
      item.addEventListener("click", e => {
      e.preventDefault();
      const val = item.dataset.rating || "";
      const label = (item.textContent || "").trim();
      btns.forEach(btn => {
        btn.dataset.ratingExact = val;
        btn.textContent = label;
      });
      rvApplyRatingFilter();
    });
  });
  });
}

function rvApplyRatingFilter() {
  const btn = document.querySelector("[data-rv-sort-btn]");
  if (!btn) return;

  const exact = btn.dataset.ratingExact;
  const photoOnly = [...document.querySelectorAll("[data-rv-photo-only]")]
    .some(chk => chk.checked);

  document.querySelectorAll(".rv-item").forEach(item => {
    let visible = true;
    const rating = rvGetRatingFromItem(item);

    if (exact !== "" && rating !== parseInt(exact, 10)) {
      visible = false;
    }

    if (photoOnly) {
      const hasImg = !!item.querySelector(".rv-images img");
      if (!hasImg) visible = false;
    }

    item.style.display = visible ? "" : "none";
  });

  rvToggleEmptyState();
}

/* ----------------- 업로더 (comment와 동일 구조) ----------------- */
function rvInitUploaders(root = document) {
  const forms = root.querySelectorAll("[data-review-uploader]:not([data-review-uploader-init])");
  forms.forEach(form => {
    const uploader = rvSetupUploader(form);
    if (uploader) STORE_RV_UPLOADERS.set(form, uploader);
  });
}

// comment.js의 구조를 그대로 베껴온 버전 (클래스만 rv-)
function rvSetupUploader(form) {
  form.setAttribute("data-review-uploader-init", "true");

  const input = form.querySelector(".rv-input");
  const grid  = form.querySelector(".rv-grid, .rv-edit-grid");
  if (!input || !grid) return null;

  const state = { items: [], maxFiles: 10, maxSize: 10 * 1024 * 1024 };

  const cleanup = () => {
    state.items.forEach(it => {
      if (it.blob && it.url) URL.revokeObjectURL(it.url);
    });
    state.items = [];
    rvRenderThumbs(grid, state.items);
  };

  input.addEventListener("change", e => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.size > state.maxSize) return;
      const url = URL.createObjectURL(file);
      const id  = "rv_" + Math.random().toString(36).slice(2);
      state.items.push({ id, file, url, blob: true });
    });
    rvRenderThumbs(grid, state.items);
    input.value = "";
  });

  form.addEventListener("click", e => {
    const rm = e.target.closest("[data-rv-remove]");
    if (!rm) return;
    e.preventDefault();
    const id = rm.getAttribute("data-rv-remove");
    const idx = state.items.findIndex(x => x.id === id);
    if (idx >= 0) {
      if (state.items[idx].blob && state.items[idx].url) {
        URL.revokeObjectURL(state.items[idx].url);
      }
      state.items.splice(idx, 1);
      rvRenderThumbs(grid, state.items);
    }
  });

  return { state, grid, input, cleanup };
}

function rvRenderThumbs(grid, items) {
  grid.innerHTML = "";
  items.forEach(({ id, url }) => {
    const col = document.createElement("div");
    col.className="rv-thumb";
    col.innerHTML = `
      <div class="thumb pj-u-position-relative">
        <img src="${url}" alt="">
        <button type="button" class="pj-button pj-button--link remove" data-rv-remove="${id}">&times;</button>
      </div>`;
    grid.appendChild(col);
  });
}

/* ----------------- 별점 클릭 Delegation (작성/수정 공통) ----------------- */
function rvInitStarDelegation() {
  document.addEventListener("click", e => {
    const btn = e.target.closest(".rv-star");
    if (!btn) return;

    const group = btn.closest(".rv-stars-select");
    const form  = btn.closest("form");
    if (!group || !form) return;

    const input = form.querySelector("input[name='rating']");
    if (!input) return;

    const val = parseInt(btn.dataset.value, 10) || 0;
    input.value = val;

    const stars = group.querySelectorAll(".rv-star");
    stars.forEach((s, idx) => {
      const img = s.querySelector("img");
      if (!img) return;
      if (idx < val) {
        img.src = rvAsset("images/svg/icon_star_fill.svg");
        s.classList.add("active");
      } else {
        img.src = rvAsset("images/svg/icon_star.svg");
        s.classList.remove("active");
      }
    });
  });
}

/* ----------------- 리뷰 작성 ----------------- */
function rvInitWriteForm() {
  const modal = document.getElementById("modalReview");
  if (!modal) return;

  const form = modal.querySelector(".rv-form");
  const uploader = STORE_RV_UPLOADERS.get(form);

  form.addEventListener("submit", e => {
    e.preventDefault();

    const content = form.querySelector("textarea[name='content']").value.trim();
    const rating  = parseInt(form.querySelector("input[name='rating']").value || "0", 10);

    if (!rating) { alert("별점을 선택해주세요."); return; }
    if (!content) { alert("내용을 입력해주세요."); return; }

    const imgs = (uploader ? uploader.state.items : []).map(it => it.url);

    rvAddNewReview({
      rating,
      content,
      images: imgs,
      created_at: new Date().toISOString().slice(0,16).replace("T"," ")
    });

    if (uploader) uploader.cleanup();
    form.reset();
    form.querySelector("input[name='rating']").value = 0;

    const bs = picjejuUI.Modal.getInstance(modal);
    if (bs) bs.hide();
  });
}

function rvAddNewReview(obj) {
  const list = document.querySelector(".rv-list");
  if (!list) return;
  const div  = document.createElement("div");

  div.className="rv-item";
  div.dataset.rating = obj.rating;

  div.innerHTML = `
    <div class="rv-head pj-u-d-flex pj-u-gap-3 pj-u-mb-2">
      <img src="${rvAsset("images/avatar-sample.png")}" class="avatar pj-u-rounded-circle" alt="">
      <div class="meta">
        <div class="name pj-u-fw-bold">나</div>
        <div class="stars">
          ${rvGenStars(obj.rating)}
        </div>
      </div>
    </div>

    <div class="rv-content pj-u-mt-2">${obj.content}</div>

    ${
      obj.images && obj.images.length
        ? `
    <div class="rv-images swiper pj-u-mt-3">
      <div class="swiper-wrapper">
        ${obj.images.map(u => `<div class="swiper-slide"><img src="${u}" alt=""></div>`).join("")}
      </div>
    </div>`
        : ""
    }

    <div class="rv-bottom pj-u-d-flex pj-u-justify-content-between pj-u-align-items-center pj-u-mt-3">
      <span class="date pj-u-text-muted small">${obj.created_at}</span>
      <div class="rv-actions pj-u-d-flex pj-u-gap-3 pj-u-align-items-center">
          <button type="button" class="pj-button pj-button--link pj-u-p-0 rv-edit">수정</button>
          <button type="button" class="pj-button pj-button--link pj-u-p-0 rv-delete">삭제</button>
      </div>
    </div>
  `;

  list.prepend(div);

  rvInitSwiper();
  rvApplyRatingFilter();
}

function rvGenStars(n) {
  let html = "";
  for (let i=1;i<=5;i++) {
    html += `<img src="${rvAsset(`images/svg/${i<=n?'icon_star_fill.svg':'icon_star.svg'}`)}" alt="">`;
  }
  return html;
}

/* ----------------- 리뷰 수정 ----------------- */
function rvInitEditForm() {
  const modal = document.getElementById("modalReviewEdit");
  if (!modal) return;

  const form = modal.querySelector(".rv-edit-form");
  const grid = modal.querySelector(".rv-edit-grid");
  const inputFile = modal.querySelector(".rv-edit-input");
  let target = null;
  let state = { items: [] };

  // 수정 버튼 클릭
  document.addEventListener("click", e => {
    const btn = e.target.closest(".rv-edit");
    if (!btn) return;

    target = btn.closest(".rv-item");
    if (!target) return;

    const rating = rvGetRatingFromItem(target);
    const content = target.querySelector(".rv-content").innerHTML.trim();

    form.querySelector("textarea[name='content']").value = content;
    form.querySelector("input[name='rating']").value = rating;

    // 별점 이미지 반영
    const stars = modal.querySelectorAll(".rv-edit-stars .rv-star");
    stars.forEach((s, idx) => {
      const img = s.querySelector("img");
      if (idx < rating) {
        img.src = rvAsset("images/svg/icon_star_fill.svg");
        s.classList.add("active");
      } else {
        img.src = rvAsset("images/svg/icon_star.svg");
        s.classList.remove("active");
      }
    });

    // 기존 이미지들 로딩
    state.items = [];
    const imgs = target.querySelectorAll(".rv-images img");
    imgs.forEach((img, idx) => {
      state.items.push({
        id: "orig_" + idx,
        url: img.src,
        file: null,
        blob: false
      });
    });
    rvRenderThumbs(grid, state.items);

    new picjejuUI.Modal(modal).show();
  });

  // 새 이미지 추가
  inputFile.addEventListener("change", e => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      state.items.push({
        id: "edit_" + Math.random().toString(36).slice(2),
        url,
        file,
        blob: true
      });
    });
    rvRenderThumbs(grid, state.items);
    inputFile.value = "";
  });

  // 썸네일 삭제
  grid.addEventListener("click", e => {
    const rm = e.target.closest("[data-rv-remove]");
    if (!rm) return;
    const id = rm.getAttribute("data-rv-remove");
    const idx = state.items.findIndex(x => x.id === id);
    if (idx >= 0) {
      if (state.items[idx].blob && state.items[idx].url) {
        URL.revokeObjectURL(state.items[idx].url);
      }
      state.items.splice(idx, 1);
      rvRenderThumbs(grid, state.items);
    }
  });

  // 수정 저장
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!target) return;

    const rating = parseInt(form.querySelector("input[name='rating']").value || "0", 10);
    const content = form.querySelector("textarea[name='content']").value;

    target.dataset.rating = rating;
    target.querySelector(".rv-content").innerHTML = content;
    target.querySelector(".stars").innerHTML = rvGenStars(rating);

    const wrap = target.querySelector(".rv-images .swiper-wrapper");
    if (wrap) {
      wrap.innerHTML = state.items
        .map(it => `<div class="swiper-slide"><img src="${it.url}" alt=""></div>`)
        .join("");
    } else if (state.items.length) {
      const box = document.createElement("div");
      box.className="rv-images swiper pj-u-mt-3";
      box.innerHTML = `
        <div class="swiper-wrapper">
          ${state.items.map(it => `<div class="swiper-slide"><img src="${it.url}" alt=""></div>`).join("")}
        </div>`;
      target.insertBefore(box, target.querySelector(".rv-bottom"));
    }

    const bs = picjejuUI.Modal.getInstance(modal);
    if (bs) bs.hide();

    rvInitSwiper();
    rvApplyRatingFilter();
  });
}

/* ----------------- 삭제 ----------------- */
function rvInitDelete() {
  const modal = document.getElementById("modalReviewDelete");
  if (!modal) return;

  let target = null;

  document.addEventListener("click", e => {
    const btn = e.target.closest(".rv-delete");
    if (!btn) return;
    target = btn.closest(".rv-item");
    new picjejuUI.Modal(modal).show();
  });

  document.getElementById("rvDeleteConfirm").addEventListener("click", () => {
    if (target) target.remove();
    const bs = picjejuUI.Modal.getInstance(modal);
    if (bs) bs.hide();
    rvApplyRatingFilter();
  });
}

/* ----------------- 신고 ----------------- */
function rvInitReport() {
  const modal = document.getElementById("modalReport");
  if (!modal) return;

  const form = modal.querySelector("form");

  document.addEventListener("click", e => {
    const btn = e.target.closest(".rv-report");
    if (!btn) return;
    // 필요한 경우 review_id 세팅 가능
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const bs = picjejuUI.Modal.getInstance(modal);
    if (bs) bs.hide();
    alert("신고가 접수되었습니다.");
  });
}

/* ----------------- 라이트박스 ----------------- */
function rvInitLightbox() {
  document.addEventListener("click", e => {
    const img = e.target.closest(".rv-images img");
    if (!img) return;

    const overlay = document.createElement("div");
    overlay.className="rv-lightbox";
    overlay.innerHTML = `
      <div class="inner">
        <img src="${img.src}" alt="">
      </div>`;
    overlay.addEventListener("click", () => overlay.remove());
    document.body.appendChild(overlay);
  });
}

/* ----------------- 동적 업로더 자동 연결 ----------------- */
document.addEventListener("change", e => {
  const input = e.target.closest(".rv-input");
  if (!input) return;
  const form = input.closest("[data-review-uploader]");
  if (!form) return;
  if (!STORE_RV_UPLOADERS.has(form)) {
    const uploader = rvSetupUploader(form);
    if (uploader) STORE_RV_UPLOADERS.set(form, uploader);
  }
});


document.addEventListener("DOMContentLoaded", () => {

    const fileInput = document.querySelector(".qna-file-input");
    const grid = document.querySelector(".qna-grid");
  
    if (fileInput) {
      fileInput.addEventListener("change", e => {
        const files = Array.from(e.target.files);
  
        grid.innerHTML = ""; // 초기화
        
        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = () => {
            const img = document.createElement("img");
            img.src = reader.result;
            grid.appendChild(img);
          };
          reader.readAsDataURL(file);
        });
      });
    }
  
    // 모달 열릴 때 초기화
    const modal = document.getElementById("modalQna");
    modal?.addEventListener("show.ui.modal", () => {
      grid.innerHTML = "";
      fileInput.value = "";
    });
  
  });

  
