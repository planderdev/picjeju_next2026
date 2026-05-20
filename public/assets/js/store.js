// store.js — 통합 정리본 v2 (중복 제거 & 리뷰 필터/갤러리 안정화)

document.addEventListener('DOMContentLoaded', () => {
    console.log('[store] DOM ready');
  
    // ===== 유틸 =====
    const $  = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
    const fmtNum = (n) => (n || 0).toLocaleString('ko-KR');
    const money  = (n) => fmtNum(n) + '원';
  
    // ===== 1) 상세 이미지 Swiper (있을 때만) =====
    if (window.Swiper) {
      try {
        const thumbs = new Swiper('#swiperThumbs', {
          slidesPerView: 5,
          spaceBetween: 14,
          watchSlidesProgress: true,
          freeMode: true,
          breakpoints: { 0: { slidesPerView: 4 }, 768: { slidesPerView: 5 } }
        });
        new Swiper('#swiperMain', {
          spaceBetween: 10,
          navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
          thumbs: { swiper: thumbs }
        });
      } catch (e) { console.warn('[store] Swiper init skipped:', e); }
    }
  
    // ===== 2) 좋아요 토글 =====
    $$('#likeBtn').forEach(btn => btn.addEventListener('click', () => btn.classList.toggle('active')));
  
    // ===== 3) 리뷰 더보기 =====
    $('#reviewMoreBtn')?.addEventListener('click', (e) => {
      $$('.review-item.hidden').forEach(el => el.classList.remove('hidden'));
      e.currentTarget.remove();
    });
  
    // ===== 4) Buy Offcanvas 컨트롤러 (옵션/단일 통합) =====
    const oc = $('#buyOffcanvas');
    const fmt = n => (n || 0).toLocaleString('ko-KR') + '원';
  
    function initBuyBox() {
      const mode = (oc.dataset.productType || 'option').toLowerCase();
      const totalEl = oc.querySelector('#mobileTotalPrice');
  
      const optBox    = oc.querySelector('#mobileProductBox');
      const simpleBox = oc.querySelector('#mobileSimpleBox');
      optBox?.classList.add('d-none');
      simpleBox?.classList.add('d-none');
  
      if (simpleBox && simpleBox.parentNode) {
        const fresh = simpleBox.cloneNode(true);
        simpleBox.parentNode.replaceChild(fresh, simpleBox);
      }
      const simpleRoot = oc.querySelector('#mobileSimpleBox');
  
      if (mode === 'option') {
        optBox?.classList.remove('d-none');
  
        const selectEl = oc.querySelector('#mobileOptionSelect');
        const listEl   = oc.querySelector('#mobileSelections');
        const basket   = new Map(); // sku -> { label, unit, qty }
  
        const updateTotal = () => {
          let sum = 0;
          basket.forEach(it => sum += it.unit * it.qty);
          if (totalEl) totalEl.textContent = fmt(sum);
        };
  
        const renderList = () => {
          if (!listEl) return;
          listEl.innerHTML = '';
          basket.forEach((it, sku) => {
            const row = document.createElement('div');
            row.className='mobile-opt';
            row.dataset.sku = sku;
            row.innerHTML = `
              <div class="mobile-opt-head">
                <span class="mobile-opt-label pj-u-fw-medium">${it.label}</span>
                <button type="button" class="pj-button-close" data-action="remove" aria-label="옵션 삭제"></button>
              </div>
              <div class="mobile-opt-body">
                <button type="button" class="pj-button pj-button--sm pj-button--outline-light" data-action="dec"><i class="ri-subtract-line"></i></button>
                <output class="mobile-qty-output" data-role="qty">${it.qty}</output>
                <button type="button" class="pj-button pj-button--sm pj-button--outline-light" data-action="inc"><i class="ri-add-line"></i></button>
                <span class="pj-u-ms-auto pj-u-fw-bold" data-role="price">${fmt(it.unit * it.qty)}</span>
              </div>`;
            listEl.appendChild(row);
          });
          updateTotal();
        };
  
        selectEl?.addEventListener('change', () => {
          const opt = selectEl.options[selectEl.selectedIndex];
          if (!opt || !opt.value) return;
          const sku   = opt.value;
          const label = opt.text;
          const unit  = (parseInt(opt.dataset.price,10) || 0) + (parseInt(opt.dataset.extra,10) || 0);
  
          if (basket.has(sku)) {
            const it = basket.get(sku); it.qty += 1; basket.set(sku, it);
          } else {
            basket.set(sku, { label, unit, qty: 1 });
          }
          selectEl.value = '';
          renderList();
        });
  
        oc.querySelector('#mobileSelections')?.addEventListener('click', (e) => {
          const btn  = e.target.closest('[data-action]');
          if (!btn) return;
          const act  = btn.dataset.action;
          const card = btn.closest('.mobile-opt');
          const sku  = card?.dataset.sku;
          if (!sku || !basket.has(sku)) return;
  
          const it = basket.get(sku);
          if (act === 'inc') it.qty += 1;
          if (act === 'dec') it.qty = Math.max(1, it.qty - 1);
          if (act === 'remove') { basket.delete(sku); renderList(); return; }
  
          basket.set(sku, it);
          card.querySelector('[data-role="qty"]').textContent   = it.qty;
          card.querySelector('[data-role="price"]').textContent = fmt(it.unit * it.qty);
          updateTotal();
        });
  
        updateTotal();
      }
  
      if (mode === 'simple') {
        simpleRoot?.classList.remove('d-none');
        const msbLabel = simpleRoot.querySelector('#msbLabel');
        const msbQtyEl = simpleRoot.querySelector('#msbQty');
        const msbPrice = simpleRoot.querySelector('#msbPrice');
  
        let unit = parseInt(oc.dataset.unitPrice || '0', 10);
        let qty  = 1;
  
        if (msbLabel) msbLabel.textContent = oc.dataset.simpleLabel || '단일상품';
  
        const render = () => {
          if (msbQtyEl) msbQtyEl.textContent = qty;
          if (msbPrice) msbPrice.textContent = fmt(qty * unit);
          if (totalEl)  totalEl.textContent  = fmt(qty * unit);
        };
        render();
  
        simpleRoot.addEventListener('click', (e) => {
          const inc = e.target.closest('[data-action="inc"], #msbInc');
          const dec = e.target.closest('[data-action="dec"], #msbDec');
          if (inc) { qty += 1; render(); }
          if (dec) { qty = Math.max(1, qty - 1); render(); }
        });
      }
  
      oc.querySelector('#mobileCartBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        const cart = $('#cartOffcanvas');
        if (cart) picjejuUI.Offcanvas.getOrCreateInstance(cart).show();
      });
    }
  
    if (oc) {
      oc.addEventListener('shown.ui.offcanvas', initBuyBox);
      initBuyBox();
    }
  
    /* ===== 리뷰 UI (업로드 미리보기, ⋯메뉴, 필터, 라이트박스, 갤러리) ===== */
    (() => {
      if (window.__rvBound) return;
      window.__rvBound = true;
  
      const qs  = (sel, root=document) => root.querySelector(sel);
      const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  
      // 공용 참조
      const listEl   = qs('.review-list');
      const tplReply = qs('#rv-reply-form-tpl');
  
      /* --- 업로드 미리보기 --- */
      const fileInput   = qs('.review-form .img-upload input[type="file"]');
      const previewsBox = qs('#rv-previews');
      const dt = new DataTransfer();
  
      function makePreview(file) {
        if (!previewsBox) return;
        const url = URL.createObjectURL(file);
  
        const wrap = document.createElement('div');
        wrap.className='rv-preview';
        wrap.dataset.name     = file.name;
        wrap.dataset.size     = String(file.size);
        wrap.dataset.lastmod  = String(file.lastModified);
        wrap.innerHTML = `<img alt=""><button type="button" class="rv-remove" aria-label="이미지 삭제">&times;</button>`;
  
        wrap.querySelector('img').src = url;
        wrap.querySelector('.rv-remove')?.addEventListener('click', () => {
          const idx = [...dt.files].findIndex(f =>
            f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
          );
          if (idx > -1) dt.items.remove(idx);
          if (fileInput) fileInput.files = dt.files;
          URL.revokeObjectURL(url);
          wrap.remove();
        });
  
        previewsBox.appendChild(wrap);
      }
  
      fileInput?.addEventListener('change', (e) => {
        const picked = [...(e.target.files || [])];
        picked.forEach(f => {
          const exists = [...dt.files].some(x =>
            x.name === f.name && x.size === f.size && x.lastModified === f.lastModified
          );
          if (!exists) { dt.items.add(f); makePreview(f); }
        });
        fileInput.files = dt.files;
        fileInput.value = '';
      });
  
      /* --- ⋯ 드롭다운(수정/삭제) 생성 --- */
      function ensureReviewMenus(root = listEl || document){
        qsa('.review-item', root).forEach(item => {
          if (item.querySelector('.rv-actions')) return;
          const wrap = document.createElement('div');
          wrap.className='rv-actions pj-dropdown';
          Object.assign(wrap.style, { position:'absolute', top:'0', right:'0', zIndex:'2' });
          wrap.innerHTML = `
            <button type="button" class="rv-more pj-button pj-button--sm" data-pj-toggle="dropdown" aria-label="더보기"
                    style="width:32px;height:32px;display:inline-grid;place-items:center;border-radius:8px;">
              <i class="ri-more-2-line"></i>
            </button>
            <ul class="pj-dropdown-menu pj-dropdown-menu-end">
              <li><button type="button" class="pj-dropdown-item rv-act-edit">수정</button></li>
              <li><button type="button" class="pj-dropdown-item rv-act-delete">삭제</button></li>
            </ul>`;
          if (getComputedStyle(item).position === 'static') item.style.position = 'relative';
          item.appendChild(wrap);
        });
      }
      ensureReviewMenus();
      if (window.MutationObserver && listEl) {
        let timer = null;
        new MutationObserver(() => {
          clearTimeout(timer);
          timer = setTimeout(() => ensureReviewMenus(listEl), 80);
        }).observe(listEl, { childList: true, subtree: true });
      }
  
      // 인라인 편집
      function startEdit(item){
        if (!item || item.classList.contains('rv-editing')) return;
        const p = item.querySelector('.body');
        if (!p) return;
  
        item.classList.add('rv-editing');
        p.hidden = true;
  
        const form = document.createElement('form');
        form.className='rv-edit-form';
        form.innerHTML = `
          <textarea class="pj-field" rows="4" aria-label="리뷰 수정">${(p.textContent||'').trim()}</textarea>
          <div class="rv-edit-actions" style="display:flex;gap:.5rem;justify-content:flex-end;margin-top:.5rem;">
            <button type="button" class="pj-button pj-button--light pj-button--sm rv-edit-cancel">취소</button>
            <button type="submit" class="pj-button pj-button--dark pj-button--sm">저장</button>
          </div>`;
        p.insertAdjacentElement('afterend', form);
  
        form.querySelector('.rv-edit-cancel')?.addEventListener('click', () => {
          form.remove(); p.hidden = false; item.classList.remove('rv-editing');
        });
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const val = form.querySelector('textarea')?.value?.trim() ?? '';
          p.textContent = val; // TODO: 서버 저장 연동
          form.remove(); p.hidden = false; item.classList.remove('rv-editing');
        });
      }
  
      // 클릭 위임 (대댓글 토글/신고/라이트박스/수정/삭제)
      listEl?.addEventListener('click', (e) => {
        // 대댓글 폼
        const replyBtn = e.target.closest('.reply-count');
        if (replyBtn) {
          e.preventDefault();
          const item = replyBtn.closest('.review-item');
          if (!item || !tplReply) return;
          const opened = item.querySelector('.rv-reply-form');
          if (opened) opened.remove();
          else {
            const frag = document.importNode(tplReply.content, true);
            const form = frag.querySelector('.rv-reply-form');
            replyBtn.insertAdjacentElement('afterend', form);
            form.querySelector('.rv-reply-cancel')?.addEventListener('click', () => form.remove());
            form.addEventListener('submit', (ev) => {
              ev.preventDefault();
              alert('대댓글이 등록되었습니다. (데모)');
              form.remove();
            });
          }
          return;
        }
  
        // 신고
        const reportBtn = e.target.closest('.report');
        if (reportBtn) {
          e.preventDefault();
          const modalEl = qs('#rv-report-modal');
          if (modalEl && window.picjejuUI?.Modal) {
            picjejuUI.Modal.getOrCreateInstance(modalEl).show();
          } else {
            console.warn('[review] DesignSystem Modal 누락');
            alert('신고 창을 열 수 없습니다.');
          }
          return;
        }
  
        // 라이트박스
        const thumbImg = e.target.closest('.gallery .thumbnail img');
        if (thumbImg) {
          e.preventDefault();
          const gallery = thumbImg.closest('.gallery');
          if (!gallery) return;
          const srcList = qsa('img', gallery).map(img => img.getAttribute('src')).filter(Boolean);
          openLightbox(srcList, thumbImg.getAttribute('src'));
          return;
        }
  
        // 수정/삭제
        const editBtn = e.target.closest('.rv-act-edit');
        if (editBtn) {
          e.preventDefault();
          try { picjejuUI.Dropdown.getOrCreateInstance(editBtn.closest('.pj-dropdown')?.querySelector('.rv-more'))?.hide(); } catch {}
          startEdit(editBtn.closest('.review-item'));
          return;
        }
        const delBtn = e.target.closest('.rv-act-delete');
        if (delBtn) {
          e.preventDefault();
          try { picjejuUI.Dropdown.getOrCreateInstance(delBtn.closest('.pj-dropdown')?.querySelector('.rv-more'))?.hide(); } catch {}
          const item = delBtn.closest('.review-item');
          if (!item) return;
          if (confirm('이 리뷰를 삭제하시겠습니까?')) {
            const sep = item.nextElementSibling;
            if (sep?.classList?.contains('sep')) sep.remove();
            item.remove();
          }
        }
      });
  
      // 신고 모달 제출
      const reportForm = qs('#rv-report-modal form.pj-modal-content');
      reportForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const reason = reportForm.querySelector('input[name="rv-report-reason"]:checked')?.value || '';
        const detail = reportForm.querySelector('#rv-report-detail')?.value?.trim() || '';
        alert('신고가 접수되었습니다. (데모)\n사유: ' + reason + (detail ? '\n상세: ' + detail : ''));
        window.picjejuUI?.Modal?.getInstance(qs('#rv-report-modal'))?.hide();
        reportForm.reset();
      });
  
      /* --- 리뷰 필터 (포토 전용 + 평점) --- */
  
      // 스타일 주입(1회)
      if (!document.getElementById('rv-filter-style')) {
        const s = document.createElement('style');
        s.id = 'rv-filter-style';
        s.textContent = `.rv-hidden{display:none!important}`;
        document.head.appendChild(s);
      }
  
      const photoOnlyChk = qs('#onlyPhoto');
      const ratingMenu   = qs('#ratingFilter') || qs('.reviews-head .pj-dropdown-menu');
      const ratingBtn    = qs('.reviews-head [data-pj-toggle="dropdown"]');
  
      // 드롭다운 항목 data-rating 보강(없을 때만)
      ratingMenu?.querySelectorAll('.pj-dropdown-item').forEach(a => {
        if (a.hasAttribute('data-rating')) return;
        if (/전체/.test(a.textContent)) { a.dataset.rating = ''; return; }
        const yellow = a.querySelector('.pj-u-text-yellow');
        if (yellow) {
          a.dataset.rating = String((yellow.textContent.match(/★/g) || []).length);
        } else {
          a.dataset.rating = String(a.querySelectorAll('i.ri-star-fill,i.ri-star-s-fill').length || '');
        }
      });
  
      // 리뷰 아이템 평점 추출 (다양한 마크업 대응)
      function getItemRating(item) {
        // 1) data-rating 우선
        const d = item?.dataset?.rating;
        if (d != null && d !== '') {
          const v = parseInt(d, 10);
          if (!isNaN(v)) return Math.max(0, Math.min(5, v));
        }
        // 2) aria-label="별점 5점" 형태
        const aria = item.querySelector('[aria-label*="별점"],[aria-label*="rating"]')?.getAttribute('aria-label') || '';
        const m = aria.match(/(\d+)/);
        if (m) return Math.max(0, Math.min(5, parseInt(m[1], 10)));
        // 3) 텍스트 별 갯수 (.stars 또는 기타)
        const starsText = item.querySelector('.stars')?.textContent || '';
        const filled = (starsText.match(/★/g) || []).length;
        if (filled) return Math.max(0, Math.min(5, filled));
        // 4) 아이콘 갯수
        const icons = item.querySelectorAll('i.ri-star-fill,i.ri-star-s-fill').length;
        if (icons) return Math.max(0, Math.min(5, icons));
        return 0;
      }
  
      const hasPhoto = (item) =>
        item.dataset.hasPhoto === '1' || !!item.querySelector('.gallery img, .thumbnail img');
  
      const filterState = { photoOnly: !!photoOnlyChk?.checked, rating: null };
  
      function applyFilters() {
        if (!listEl) return;
        listEl.querySelectorAll('.review-item').forEach(item => {
          let show = true;
          if (filterState.rating != null) show = show && (getItemRating(item) === filterState.rating);
          if (filterState.photoOnly)      show = show && hasPhoto(item);
          item.classList.toggle('rv-hidden', !show);
          const sep = item.nextElementSibling;
          if (sep?.classList?.contains('sep')) sep.classList.toggle('rv-hidden', !show);
        });
      }
  
      photoOnlyChk?.addEventListener('change', (e) => {
        filterState.photoOnly = e.target.checked;
        applyFilters();
      });
  
      ratingMenu?.addEventListener('click', (e) => {
        const a = e.target.closest('.pj-dropdown-item');
        if (!a) return;
        e.preventDefault();
        const val = a.dataset.rating;
        filterState.rating = (val == null || val === '') ? null : parseInt(val, 10);
        if (ratingBtn) ratingBtn.innerHTML = a.innerHTML; // 버튼 라벨 동기화
        try { picjejuUI.Dropdown.getOrCreateInstance(ratingBtn)?.hide(); } catch {}
        applyFilters();
      });
  
      applyFilters();
      if (window.MutationObserver && listEl) {
        let t = null;
        new MutationObserver(() => {
          clearTimeout(t);
          t = setTimeout(applyFilters, 80);
        }).observe(listEl, { childList: true, subtree: true });
      }
  
      /* --- 라이트박스 --- */
      const lbEl    = qs('#rv-lightbox');
      const lbRoot  = qs('#rv-lightbox-swiper');
      const lbWrap  = qs('#rv-lightbox-swiper .swiper-wrapper');
      let   lbSwiper = null;
  
      function ensureLbControls() {
        if (!lbRoot) return {};
        lbRoot.querySelector('.swiper-button-prev')?.setAttribute('style', 'display:none!important');
        lbRoot.querySelector('.swiper-button-next')?.setAttribute('style', 'display:none!important');
        lbRoot.querySelector('.swiper-pagination')?.setAttribute('style', 'display:none!important');
  
        let pag  = lbRoot.querySelector('.rv-lb-pagination');
        let prev = lbRoot.querySelector('.rv-lb-prev');
        let next = lbRoot.querySelector('.rv-lb-next');
  
        if (!pag)  { pag  = document.createElement('div'); pag.className='rv-lb-pagination'; lbRoot.appendChild(pag); }
        if (!prev) { prev = document.createElement('button'); prev.type='button'; prev.className='rv-lb-arrow rv-lb-prev'; prev.setAttribute('aria-label','이전'); prev.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M15.5 19 8.5 12l7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`; lbRoot.appendChild(prev); }
        if (!next) { next = document.createElement('button'); next.type='button'; next.className='rv-lb-arrow rv-lb-next'; next.setAttribute('aria-label','다음'); next.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20"><path d="m8.5 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`; lbRoot.appendChild(next); }
        return { pag, prev, next };
      }
  
      function onEscClose(e){ if (e.key === 'Escape') closeLightbox(); }
      function openLightbox(srcList = [], currentSrc = null) {
        if (!lbEl || !lbWrap) return;
        lbWrap.innerHTML = srcList.map(src => `<div class="swiper-slide"><img src="${src}" alt=""></div>`).join('');
        const { pag, prev, next } = ensureLbControls();
  
        lbEl.hidden = false;
        lbEl.setAttribute('aria-hidden', 'false');
  
        if (!window.Swiper) { if (currentSrc) window.open(currentSrc, '_blank'); return; }
  
        if (lbSwiper) {
          lbSwiper.params.navigation = { nextEl: next, prevEl: prev };
          lbSwiper.params.pagination = {
            el: pag, clickable: true,
            bulletClass: 'rv-lb-bullet', bulletActiveClass: 'is-active',
            renderBullet: (i, className) => `<span class="${className}" aria-label="슬라이드 ${i+1}"></span>`
          };
          lbSwiper.navigation.destroy(); lbSwiper.navigation.init();
          lbSwiper.pagination.destroy(); lbSwiper.pagination.init();
          lbSwiper.pagination.render();  lbSwiper.pagination.update();
          lbSwiper.update();
        } else {
          lbSwiper = new Swiper(lbRoot, {
            loop: false, slidesPerView: 1, centeredSlides: true,
            spaceBetween: 16, speed: 350,
            navigation: { nextEl: next, prevEl: prev },
            pagination: {
              el: pag, clickable: true,
              bulletClass: 'rv-lb-bullet', bulletActiveClass: 'is-active',
              renderBullet: (i, className) => `<span class="${className}" aria-label="슬라이드 ${i+1}"></span>`
            }
          });
        }
        if (currentSrc) {
          const idx = srcList.findIndex(s => s === currentSrc);
          if (idx >= 0) lbSwiper.slideTo(idx, 0);
        }
        document.addEventListener('keydown', onEscClose);
      }
      function closeLightbox() {
        if (!lbEl) return;
        lbEl.hidden = true;
        lbEl.setAttribute('aria-hidden', 'true');
        document.removeEventListener('keydown', onEscClose);
      }
      $('.rv-lightbox-close')?.addEventListener('click', closeLightbox);
      lbEl?.addEventListener('click', (e) => { if (e.target === lbEl) closeLightbox(); });
      window.openLightbox = openLightbox;
  
      /* --- 리뷰 갤러리(인라인) v2 --- */
      if (!window.__rvInlineGalleryBoundV2) {
        window.__rvInlineGalleryBoundV2 = true;
  
        function initInlineGalleries(root = document) {
          const galleries = Array.from(root.querySelectorAll('.review-list .gallery'));
          galleries.forEach((gal) => {
            if (!gal || gal.dataset.inlineSwiper === '1') return;
  
            const imgs = Array.from(gal.querySelectorAll(':scope .thumbnail img, :scope > img'));
            if (imgs.length < 5) return;
            if (gal.querySelector(':scope > .swiper')) return;
  
            const SLIDE_W = 80, GAP = 10, PEEK = SLIDE_W * 0.5;
  
            const swiperEl = document.createElement('div');
            swiperEl.className='swiper rv-inline-gallery';
            Object.assign(swiperEl.style, { width:'100%', minHeight: SLIDE_W + 'px', paddingRight:'0px', position:'relative' });
  
            const wrapEl = document.createElement('div');
            wrapEl.className='swiper-wrapper';
            Object.assign(wrapEl.style, { display:'flex', justifyContent:'flex-start', alignItems:'center' });
  
            imgs.forEach((img) => {
              const slide = document.createElement('div');
              slide.className='swiper-slide';
              Object.assign(slide.style, { width: SLIDE_W + 'px', flex:`0 0 ${SLIDE_W}px` });
  
              let thumb = img.closest('.thumbnail');
              if (!thumb) { thumb = document.createElement('div'); thumb.className='thumbnail'; thumb.appendChild(img); }
              else { thumb.appendChild(img); }
  
              Object.assign(thumb.style, { width:SLIDE_W + 'px', height:SLIDE_W + 'px', overflow:'hidden', borderRadius:'8px' });
              Object.assign(img.style,   { width:'100%', height:'100%', objectFit:'cover', display:'block' });
  
              slide.appendChild(thumb);
              wrapEl.appendChild(slide);
            });
  
            const prevEl = document.createElement('button');
            prevEl.type = 'button';
            prevEl.className='rv-arrow rv-prev';
            prevEl.setAttribute('aria-label', '이전');
            prevEl.innerHTML = '&#x2039;';
            Object.assign(prevEl.style, { position:'absolute', top:'50%', left:'0', transform:'translateY(-50%)', zIndex:'2', width:'28px', height:'28px', borderRadius:'50%' });
  
            const nextEl = document.createElement('button');
            nextEl.type = 'button';
            nextEl.className='rv-arrow rv-next';
            nextEl.setAttribute('aria-label', '다음');
            nextEl.innerHTML = '&#x203A;';
            Object.assign(nextEl.style, { position:'absolute', top:'50%', right:'0', transform:'translateY(-50%)', zIndex:'2', width:'28px', height:'28px', borderRadius:'50%' });
  
            swiperEl.appendChild(wrapEl);
            swiperEl.appendChild(prevEl);
            swiperEl.appendChild(nextEl);
            gal.innerHTML = '';
            gal.appendChild(swiperEl);
  
            if (!window.Swiper) { console.warn('[review] Swiper JS 미탑재'); return; }
  
            const setPeek = () => {
              const contentW   = imgs.length * (SLIDE_W + GAP) - GAP;
              const containerW = swiperEl.clientWidth;
              const needPeek   = contentW > containerW;
              const val = needPeek ? `${PEEK}px` : '0px';
              swiperEl.style.setProperty('--rv-peek', val);
              swiperEl.style.paddingRight = val;
            };
  
            const s = new Swiper(swiperEl, {
              slidesPerView: 'auto',
              slidesPerGroup: 1,
              spaceBetween: GAP,
              speed: 350,
              allowTouchMove: true,
              watchOverflow: false,
              observer: true,
              observeParents: true,
              updateOnWindowResize: true,
              navigation: { nextEl, prevEl },
              on: {
                init:           (sw) => { setPeek(); sw.update(); updateArrows(sw); },
                resize:         (sw) => { setPeek(); updateArrows(sw); },
                imagesReady:    (sw) => { sw.update(); updateArrows(sw); },
                slideChange:    (sw) => updateArrows(sw),
                reachBeginning: (sw) => updateArrows(sw),
                reachEnd:       (sw) => updateArrows(sw),
                transitionEnd:  (sw) => updateArrows(sw)
              }
            });
  
            function updateArrows(sw) {
              prevEl.style.visibility = sw.isBeginning ? 'hidden' : 'visible';
              nextEl.style.visibility = sw.isEnd       ? 'hidden' : 'visible';
            }
  
            requestAnimationFrame(() => { setPeek(); s.update(); updateArrows(s); });
  
            gal.__inlineSwiper = s;
            gal.dataset.inlineSwiper = '1';
          });
        }
  
        // 초기화 + 동적 대응
        initInlineGalleries();
        if (window.MutationObserver && listEl) {
          let timer = null;
          new MutationObserver(() => {
            clearTimeout(timer);
            timer = setTimeout(() => initInlineGalleries(listEl), 80);
          }).observe(listEl, { childList: true, subtree: true });
        }
        window.initReviewGalleries = () => initInlineGalleries();
      }
    })();
  
    // === StoreTab sticky 상태 감지 → .is-sticky 토글 ===
    (() => {
      const tab = document.getElementById('StoreTab');
      if (!tab) return;
      const TOP = parseInt(getComputedStyle(tab).top, 10) || 80;
  
      const sentinel = document.createElement('div');
      sentinel.setAttribute('aria-hidden', 'true');
      tab.parentNode.insertBefore(sentinel, tab);
  
      new IntersectionObserver(([entry]) => {
        tab.classList.toggle('is-sticky', entry.intersectionRatio === 0);
      }, { root: null, threshold: [0, 1], rootMargin: `-${TOP}px 0px 0px 0px` }).observe(sentinel);
    })();
  });
  


  // === PC: 우측 박스 컨트롤러(옵션형 + 단일형 동시 지원) ===
(() => {
    const fmt = n => (n || 0).toLocaleString('ko-KR');
  
    // ----- (A) 옵션형: #productBox 내부 -----
    const optBox = document.getElementById('productBox');
    if (optBox) {
      const optList = optBox.querySelector('#optionList');
      const selList = optBox.querySelector('#selectedList');
      const totalPriceEl = optBox.querySelector('#totalPrice');
      const totalQtyEl   = optBox.querySelector('#totalQty');
      const baseLabel = optBox.dataset.baseLabel || '';
  
      const basket = new Map(); // key -> { label, unit, qty }
  
      const renderTotals = () => {
        let sumQty = 0, sumPrice = 0;
        basket.forEach(it => { sumQty += it.qty; sumPrice += it.unit * it.qty; });
        if (totalQtyEl)   totalQtyEl.textContent   = String(sumQty);
        if (totalPriceEl) totalPriceEl.textContent = fmt(sumPrice);
      };
  
      const drawSelected = () => {
        if (!selList) return;
        selList.innerHTML = '';
        basket.forEach((it, key) => {
          const row = document.createElement('div');
          row.className='selected-item';
          row.dataset.key = key;
          row.innerHTML = `
            <div class="head">${baseLabel}${baseLabel ? ' - ' : ''}${it.label}
              <button type="button" class="remove" data-action="remove" aria-label="삭제">&times;</button>
            </div>
            <div class="body">
              <div class="qty">
                <button type="button" class="dec" data-action="dec"><i class="ri-subtract-line"></i></button>
                <output data-role="qty">${it.qty}</output>
                <button type="button" class="inc" data-action="inc"><i class="ri-add-line"></i></button>
              </div>
              <div class="price"><strong data-role="price">${fmt(it.unit * it.qty)}</strong></div>
            </div>`;
          selList.appendChild(row);
        });
        renderTotals();
      };
  
      // 옵션 클릭 → 장바구니(선택목록)에 추가/증가
      optList?.addEventListener('click', (e) => {
        const btn = e.target.closest('.opt');
        if (!btn) return;
        const key   = btn.dataset.key   || btn.textContent.trim();
        const label = btn.dataset.label || btn.title || btn.textContent.trim();
        const unit  = parseInt(btn.dataset.price, 10) || 0;
        if (!key) return;
        const it = basket.get(key) || { label, unit, qty: 0 };
        it.qty += 1;
        basket.set(key, it);
        drawSelected();
      });
  
      // 선택목록에서 수량/삭제
      selList?.addEventListener('click', (e) => {
        const actBtn = e.target.closest('[data-action]');
        if (!actBtn) return;
        const row = e.target.closest('.selected-item');
        const key = row?.dataset.key;
        if (!key || !basket.has(key)) return;
  
        const it = basket.get(key);
        const act = actBtn.dataset.action;
        if (act === 'inc') it.qty += 1;
        if (act === 'dec') it.qty = Math.max(1, it.qty - 1);
        if (act === 'remove') { basket.delete(key); row.remove(); renderTotals(); return; }
  
        basket.set(key, it);
        row.querySelector('[data-role="qty"]').textContent   = it.qty;
        row.querySelector('[data-role="price"]').textContent = fmt(it.unit * it.qty);
        renderTotals();
      });
  
      // 초기(빈 장바구니)
      renderTotals();
    }
  
    // ----- (B) 단일형: #simpleBox 내부 -----
    const simple = document.getElementById('simpleBox') || document.querySelector('#productBox + .box');
    if (simple) {
      const qtyOut  = simple.querySelector('#qty');            // output
      const totalP  = simple.querySelector('#totalPrice');     // strong
      const totalQ  = simple.querySelector('#totalQty');       // span.number
  
      let qty  = parseInt(qtyOut?.textContent || '1', 10) || 1;
      // 단가: data-unit-price 우선, 없으면 현재 합계/수량으로 유추
      let unit = parseInt(simple.dataset.unitPrice || '0', 10);
      if (!unit) {
        const curTotal = parseInt((totalP?.textContent || '0').replace(/[^\d]/g, ''), 10) || 0;
        const curQty   = parseInt((totalQ?.textContent || '1').replace(/[^\d]/g, ''), 10) || 1;
        unit = curQty ? Math.round(curTotal / curQty) : 0;
      }
  
      const render = () => {
        if (qtyOut) qtyOut.textContent = String(qty);
        if (totalQ) totalQ.textContent = String(qty);
        if (totalP) totalP.textContent = fmt(unit * qty);
      };
  
      simple.addEventListener('click', (e) => {
        if (e.target.closest('.inc')) { qty += 1; render(); }
        if (e.target.closest('.dec')) { qty = Math.max(1, qty - 1); render(); }
      });
  
      render();
    }
  })();

  