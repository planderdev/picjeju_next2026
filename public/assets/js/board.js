/* =======================================================
 * comment.js
 * (.cmt-* 네임스페이스 / 전역 재사용 안전)
 * - 인라인 대댓글 폼
 * - 닉네임 보호
 * - 파일 업로더(썸네일 미리보기)
 * - 댓글 등록 후 첨부 이미지를 Swiper 슬라이더로 변환
 * ======================================================= */

const CMT_UPLOADERS = new Map();
const cmtAsset = window.picjejuAsset || ((path) => `/assets/${String(path || "").replace(/^\//, "")}`);

document.addEventListener('DOMContentLoaded', () => {
  cmtInit();
  cmtInitSliders();
});

/* =======================================================
 * 1. 댓글 시스템 초기화
 * ======================================================= */
function cmtInit(root = document) {
  cmtInitInlineReply(root);
  cmtInitUploader(root);
}

/* =======================================================
 * 2. 인라인 답글 폼
 * ======================================================= */
function cmtInitInlineReply(root = document) {
  let inlineForm = null;

  document.addEventListener('click', (e) => {
    const replyBtn  = e.target.closest('.cmt-action-reply');
    const cancelBtn = e.target.closest('[data-action="cmt-cancel-reply"]');

    /* ===== 답글 버튼 클릭 ===== */
    if (replyBtn) {
      const item = replyBtn.closest('.cmt-item');
      const slot = item?.querySelector('.cmt-inline-reply-slot');
      if (!slot) return;

      // 같은 슬롯이면 토글 닫기
      if (inlineForm && inlineForm.parentElement === slot) {
        const uploader = CMT_UPLOADERS.get(inlineForm);
        if (uploader) uploader.cleanup();
        inlineForm.remove();
        CMT_UPLOADERS.delete(inlineForm);
        inlineForm = null;
        item.classList.remove('reply-active');
        return;
      }

      // 기존 폼 제거
      if (inlineForm) {
        const uploader = CMT_UPLOADERS.get(inlineForm);
        if (uploader) uploader.cleanup();
        inlineForm.remove();
        CMT_UPLOADERS.delete(inlineForm);
        const prevItem = inlineForm.closest('.cmt-item');
        if (prevItem) prevItem.classList.remove('reply-active');
      }

      // 새 폼 생성
      inlineForm = cmtCreateInlineReplyForm();
      slot.innerHTML = '';
      slot.appendChild(inlineForm);
      item.classList.add('reply-active');

      // 업로더 초기화
      cmtInitUploader(inlineForm);

      // 닉네임 자동 추가
      const nick = item.querySelector('.cmt-author')?.textContent.trim() || '';
      const ta   = inlineForm.querySelector('textarea[name="content"]');
      if (nick) {
        const prefix = `@${nick} `;
        ta.value = prefix;
        cmtProtectNickname(ta, prefix);
        ta.focus();
        ta.setSelectionRange(prefix.length, prefix.length);
      } else ta.focus();
    }

    /* ===== 취소 버튼 ===== */
    if (cancelBtn) {
      const formToRemove = cancelBtn.closest('.cmt-inline-reply-form');
      const item = cancelBtn.closest('.cmt-item');
      if (formToRemove) {
        const uploader = CMT_UPLOADERS.get(formToRemove);
        if (uploader) uploader.cleanup();
        formToRemove.remove();
        CMT_UPLOADERS.delete(formToRemove);
        if (formToRemove === inlineForm) inlineForm = null;
        if (item) item.classList.remove('reply-active');
      }
    }
  });
}

/* ===== 답글폼 생성 ===== */
function cmtCreateInlineReplyForm(){
  const f = document.createElement('form');
  f.className='cmt-inline-reply-form cmt-form';
  f.setAttribute('data-cmt-uploader','');
  f.setAttribute('data-endpoint','/api/comments');

  f.innerHTML = `
    <textarea name="content" class="pj-field pj-u-mb-2" rows="3"></textarea>
    <div class="cmt-grid"></div>
    <div class="cmt-cta pj-u-d-flex pj-u-align-items-center pj-u-justify-content-between">
      <label class="pj-button pj-button--link pj-u-p-0 pj-u-m-0">
        <img src="${cmtAsset("images/svg/icon_photo.svg")}">
        <input type="file" class="pj-visually-hidden cmt-input" accept="image/*" multiple>
      </label>
      <div class="pj-u-d-flex pj-u-gap-2">
        <button type="button" class="pj-button pj-button--gray pj-button--pill" data-action="cmt-cancel-reply">취소</button>
        <button type="submit" class="pj-button pj-button--primary pj-button--pill">작성</button>
      </div>
    </div>
  `;
  return f;
}

/* =======================================================
 * 3. 닉네임 보호
 * ======================================================= */
function cmtProtectNickname(textarea, prefix) {
  const prefixLength = prefix.length;

  textarea.addEventListener('keydown', (e) => {
    if (['Backspace','Delete'].includes(e.key)) {
      if (textarea.selectionStart <= prefixLength) {
        e.preventDefault();
        textarea.setSelectionRange(prefixLength, prefixLength);
      }
    }
  });

  textarea.addEventListener('input', () => {
    if (!textarea.value.startsWith(prefix)) {
      const pos = textarea.selectionStart;
      textarea.value = prefix + textarea.value.slice(prefixLength);
      textarea.setSelectionRange(Math.max(prefixLength, pos), Math.max(prefixLength, pos));
    }
  });
}

/* =======================================================
 * 4. 파일 업로더 (썸네일 미리보기)
 * ======================================================= */
function cmtInitUploader(root = document) {
  const forms = root.querySelectorAll('[data-cmt-uploader]:not([data-cmt-uploader-init])');
  forms.forEach(form => {
    const uploader = cmtSetupUploader(form);
    if (uploader) CMT_UPLOADERS.set(form, uploader);
  });
}

function cmtSetupUploader(form) {
  form.setAttribute('data-cmt-uploader-init', 'true');

  const input = form.querySelector('.cmt-input');
  const grid  = form.querySelector('.cmt-grid');
  const ta    = form.querySelector('textarea[name="content"]');
  if (!input || !grid || !ta) return null;

  const state = { items: [], maxFiles: 10, maxSize: 10 * 1024 * 1024 };
  const cleanup = () => {
    state.items.forEach(it => it.url && URL.revokeObjectURL(it.url));
    state.items = [];
    cmtRenderThumbs(grid, state.items);
  };

  input.addEventListener('change', e => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.size > state.maxSize) return;
      const url = URL.createObjectURL(file);
      const id = 'f_' + Math.random().toString(36).slice(2);
      state.items.push({ id, file, url });
    });
    cmtRenderThumbs(grid, state.items);
    input.value = '';
  });

  form.addEventListener('click', e => {
    const rm = e.target.closest('[data-cmt-remove]');
    if (!rm) return;
    e.preventDefault();
    const id = rm.getAttribute('data-cmt-remove');
    const idx = state.items.findIndex(x => x.id === id);
    if (idx >= 0) {
      URL.revokeObjectURL(state.items[idx].url);
      state.items.splice(idx, 1);
      cmtRenderThumbs(grid, state.items);
    }
  });

  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const content = (ta.value || '').trim();
    if (!content && state.items.length === 0) { ta.focus(); return; }

    const parentItem = form.closest('.cmt-item');
    const parentId = parentItem?.dataset.commentId || null;

    await new Promise(r => setTimeout(r, 300));
    cmtAddNewComment(content, state.items.map(it => it.url), parentId);
    cleanup();
    ta.value = '';
    cmtToast('등록되었습니다.');
  });

  return { cleanup };
}

/* =======================================================
 * 전역 change 이벤트 (동적 업로더 자동 감지)
 * ======================================================= */
document.addEventListener('change', e => {
  const input = e.target.closest('.cmt-input');
  if (!input) return;
  const form = input.closest('[data-cmt-uploader]');
  if (!form) return;
  if (!CMT_UPLOADERS.has(form)) {
    const uploader = cmtSetupUploader(form);
    if (uploader) CMT_UPLOADERS.set(form, uploader);
  }
});

/* =======================================================
 * 5. 썸네일 미리보기 렌더
 * ======================================================= */
function cmtRenderThumbs(grid, items) {
  grid.innerHTML = '';
  items.forEach(({ id, file, url }) => {
    const col = document.createElement('div');
    col.className='thum-preview';
    col.innerHTML = `
      <div class="thumb pj-u-position-relative">
        <img src="${url}" alt="${file.name}">
        <button type="button" class="remove" data-cmt-remove="${id}"></button>
      </div>`;
    grid.appendChild(col);
  });
}

/* =======================================================
 * 6. 댓글 등록 후 새 댓글/대댓글 추가
 * ======================================================= */
function cmtAddNewComment(text, urls, parentId = null) {
  const container = document.querySelector('.cmt-container');
  const newCmt = document.createElement('div');
  newCmt.className = parentId ? 'cmt-item reply-item' : 'cmt-item root-item';

  newCmt.innerHTML = `
    <div class="cmt-head">
      <img class="cmt-avatar" src="${cmtAsset("images/avatar-sample.png")}" alt="">
      <div class="cmt-author pj-u-fw-bold">${parentId ? '대댓글' : '나'}</div>
    </div>
    <div class="cmt-body pj-u-d-flex pj-u-flex-column pj-u-gap-3">
      <div class="cmt-text">${text}</div>
      ${urls.length ? `
        <div class="cmt-images swiper">
          <div class="swiper-wrapper">
            ${urls.map(u => `<div class="swiper-slide"><img src="${u}" alt=""></div>`).join('')}
          </div>
        </div>` : ''}
    </div>
  `;

  // ✅ root-item / reply-item 모두 같은 레벨에서 추가
  container.appendChild(newCmt);
  cmtInitSliders();
}

/* =======================================================
 * 7. Swiper 슬라이더 초기화
 * ======================================================= */
function cmtInitSliders() {
    document.querySelectorAll('.cmt-images.swiper').forEach(el => {
      if (el.swiper) return;
      new Swiper(el, {
        freeMode: true,
        slidesPerView: 6,
        spaceBetween: 16,
        breakpoints: {
          0: {
            slidesPerView: 3.5,
            spaceBetween: 8,
          },
          768: {
            slidesPerView: 6,
            spaceBetween: 16,
          }
        }
      });
    });
  }
  

/* =======================================================
 * 8. 간단 토스트
 * ======================================================= */
function cmtToast(msg) {
  const el = document.createElement('div');
  el.textContent = msg;
  Object.assign(el.style, {
    position:'fixed', left:'50%', bottom:'24px', transform:'translateX(-50%)',
    background:'#222', color:'#fff',
    padding:'8px 12px', borderRadius:'12px', zIndex:1055, opacity:'0.95'
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}


/* =======================================================
 * 9. 라이트박스 (이미지 클릭 시 확대 보기)
 * ======================================================= */
document.addEventListener('click', e => {
    const img = e.target.closest('.cmt-images img');
    if (!img) return;

    const swiper = img.closest('.swiper')?.swiper;
    if (swiper && swiper.allowClick === false) return;

    e.preventDefault();
  
    // 기존 라이트박스 있으면 제거
    const existing = document.querySelector('.cmt-lightbox');
    if (existing) {
      existing.querySelector('.cmt-lightbox-close')?.click();
      if (document.body.contains(existing)) existing.remove();
    }
  
    // 라이트박스 요소 생성
    const overlay = document.createElement('div');
    overlay.className='cmt-lightbox';
    overlay.innerHTML = `
     <button class="cmt-lightbox-close" aria-label="닫기"></button>
      <div class="cmt-lightbox-inner">
        <img src="${img.currentSrc || img.src}" alt=""> 
      </div>
    `;
  
    document.body.appendChild(overlay);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const closeLightbox = () => {
      overlay.remove();
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onLightboxKeydown);
    };

    const onLightboxKeydown = event => {
      if (event.key === 'Escape') closeLightbox();
    };
  
    // 닫기 이벤트
    overlay.addEventListener('click', e => {
      if (e.target.classList.contains('cmt-lightbox') || e.target.classList.contains('cmt-lightbox-close')) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', onLightboxKeydown);
  });
  
  
