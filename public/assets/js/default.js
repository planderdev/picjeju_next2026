(function(){
    const asset = window.picjejuAsset || ((path) => `/assets/${String(path || "").replace(/^\//, "")}`);
    const container = document.getElementById('grid-container');
    const sentinel  = document.getElementById('infinite-sentinel');
    const loadingUI = document.getElementById('infinite-loading');
  
    if (!container || !window.eg || !eg.Grid || !eg.Grid.MasonryGrid) return;
  
    // MasonryGrid 초기화
    const grid = new eg.Grid.MasonryGrid(container, {
      gap: 8,
      align: 'justify',
      useResizeObserver: true,
      observeChildren: true,
    });
  
    grid.renderItems();
  
    // 이미지 로딩 대기 함수
    function waitImages(elements){
      const imgs = Array.from(elements).flatMap(el => el.querySelectorAll('img'));
      if (imgs.length === 0) return Promise.resolve();
      return Promise.allSettled(imgs.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(res => {
          img.addEventListener('load', res, { once:true });
          img.addEventListener('error', res, { once:true });
        });
      }));
    }
  
    // 데이터 가져오기 (데모용)
    let page = 1;
    let loading = false;
    let done = false;
  
    async function fetchNextPage(){
      // 여기만 실제 API/서버에서 받아오는 코드로 교체하면 됨
      const samples = [
        asset("images/thumb3.jpg"),
        asset("images/thumb4.jpg"),
        asset("images/thumb5.jpg"),
        asset("images/thumb7.jpg"),
        asset("images/thumb8.jpg"),
      ];
      const make = (i) => `
        <li class="pj-card">
          <div class="thumb">
            <img src="${samples[i % samples.length]}" alt="행사 포스터">
          </div>
          <div class="body">
            <div class="pj-badge">카테고리</div>
            <h3 class="title">무한로딩 카드 #${(page-1)*6 + i + 1}</h3>
          </div>
        </li>`;
      return new Array(6).fill(0).map((_,i)=>make(i)).join("");
    }
  
    async function loadMore(){
      if (loading || done) return;
      loading = true;
      container.setAttribute('aria-busy', 'true');
      loadingUI.hidden = false;
  
      try {
        const html = await fetchNextPage();
        if (!html) {
          done = true;
          observer.unobserve(sentinel);
          loadingUI.textContent = "더 이상 항목이 없습니다.";
          return;
        }
  
        const frag = document.createRange().createContextualFragment(html);
        const newItems = Array.from(frag.children);
        container.append(...newItems);
  
        await waitImages(newItems);
        grid.renderItems();
        page += 1;
      } finally {
        loading = false;
        container.setAttribute('aria-busy', 'false');
        loadingUI.hidden = true;
      }
    }
  
    // IntersectionObserver로 sentinel 감시
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) loadMore();
      });
    }, {
      root: null,
      rootMargin: '600px 0px',
      threshold: 0
    });
  
    observer.observe(sentinel);
  })();
  
  
  
  
  

  
 
 
(() => {
  // ===== 숫자 포맷터 (소수점 버림, .number 전용) =====
  function formatNumericString(str) {
    const plain = String(str).replace(/,/g, '').trim();
    if (!/^-?\d+(?:\.\d+)?$/.test(plain)) return str;
    return Number.parseInt(plain, 10).toLocaleString('en-US');
  }
  function formatNumbersInside(text) {
    return String(text).replace(/-?\d+(?:\.\d+)?/g, n => formatNumericString(n));
  }
  function formatElement(el) {
    if (el.hasAttribute('data-no-format')) return;
    if (el.matches('input[type="text"], textarea')) {
      const v = el.value; if (!v) return;
      const nv = formatNumbersInside(v); if (v !== nv) el.value = nv;
      return;
    }
    const t = el.textContent; if (!t) return;
    const nt = formatNumbersInside(t); if (t !== nt) el.textContent = nt;
  }
  function formatAll(root = document) {
    root.querySelectorAll('.number.autofmt').forEach(formatElement);
  }

  // ===== 안전 초기화 =====
  function initNumberFormatter() {
    // 1) 초기 포맷
    formatAll();

    // 2) 옵저버 타깃 확보 (body가 없으면 html로 대체)
    const target = document.body || document.documentElement;
    if (!target || typeof MutationObserver === 'undefined') {
      // 타깃이 아직 없으면 조금 뒤에 재시도
      setTimeout(initNumberFormatter, 50);
      return;
    }

    // 3) 옵저버 시작
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            if (node.nodeType !== 1) return;
            if (node.classList?.contains('autofmt') && node.classList.contains('number')) formatElement(node);
            node.querySelectorAll?.('.number.autofmt').forEach(formatElement);
          });
        }
        if (m.type === 'characterData') {
          const p = m.target.parentElement;
          if (p && p.classList.contains('number') && p.classList.contains('autofmt')) formatElement(p);
        }
        if (m.type === 'attributes' && m.attributeName === 'class') {
          const el = m.target;
          if (el.classList.contains('number') && el.classList.contains('autofmt')) formatElement(el);
        }
      }
    });

    observer.observe(target, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,           // 클래스가 동적으로 붙는 경우 대응
      attributeFilter: ['class']
    });
  }

  // DOM 준비 후 실행 (어느 위치에 스크립트를 넣어도 안전)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNumberFormatter);
  } else {
    initNumberFormatter();
  }
})(); 


// cart 버튼을 전부 찾아서 속성 주입
document.addEventListener("DOMContentLoaded", () => {
    const cartButtons = document.querySelectorAll(".cart button");
  
    cartButtons.forEach(btn => {
      btn.setAttribute("data-pj-toggle", "offcanvas");
      btn.setAttribute("data-pj-target", "#cart");
      btn.setAttribute("aria-controls", "cart");
    });
  });
  
  


  

  document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    if (!header) {
      console.warn('[sticky] header 요소를 찾지 못했습니다. 셀렉터를 확인하세요.');
      return;
    }
  
    // header 안의 아이콘과 로고 선택
    const logoImg = header.querySelector('.logo img');
  
    // 원래 로고 경로 저장
    const asset = window.picjejuAsset || ((path) => `/assets/${String(path || "").replace(/^\//, "")}`);
    const originalLogo = asset("images/logo-w.png");
    const stickyLogo   = asset("images/logo.png"); // 스크롤 내려갔을 때 보여줄 로고
  
    const stickyPoint = 0; // 1px만 내려가도 실행
  
    const onScroll = () => {
      if (window.scrollY > stickyPoint) {
        header.classList.add('sticky');
  
        // 아이콘 색상 변경
        // icons are styled through header.sticky CSS.
        /*
        icons.forEach(icon => {
          icon.style.color = '#ff6600'; // 원하는 색상
        });
        */
  
        // 로고 교체
        if (logoImg) logoImg.src = stickyLogo;
      } else {
        header.classList.remove('sticky');
  
        // 아이콘 색상 원래대로
        /*
        icons.forEach(icon => {
          icon.style.color = '';
        });
        */
  
        // 로고 원래 이미지로 복귀
        if (logoImg) logoImg.src = originalLogo;
      }
    };
  
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('load', onScroll);
  
    onScroll(); // 초기 실행
  });
  


  
  document.addEventListener("DOMContentLoaded", () => {
    const navRight = document.querySelector('.nav-right');
    const updatePadding = () => {
      navRight.querySelectorAll('.pj-button').forEach(btn => btn.classList.remove('last-visible'));
      const visible = [...navRight.querySelectorAll('.pj-button')]
        .filter(btn => btn.offsetParent !== null); // 실제 표시 중인 요소만
      if (visible.length > 0) visible.at(-1).classList.add('last-visible');
    };
    updatePadding();
  
    // 상태 변경 감지용 (로그인 상태 바뀔 때)
    const observer = new MutationObserver(updatePadding);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  });
  

  


  /*!
 * Comment Uploader (DesignSystem friendly)
 * - 파일 첨부 → 썸네일 미리보기 → 개별 삭제 → FormData 제출
 * - 여러 폼 인스턴스 지원
 * - HTML 훅:
 *   <form data-comment-uploader data-endpoint="/api/comments">
 *     <textarea name="content" ...></textarea>
 *     <input type="file" data-cu-input multiple class="pj-visually-hidden">
 *     <div data-cu-grid></div>
 *     <button type="submit">작성</button>
 *   </form>
 */
(function (global) {
    function initCommentUploader(root = document) {
      const forms = Array.from(root.querySelectorAll('[data-comment-uploader]'));
      forms.forEach((form) => setup(form));
    }
  
    function setup(form) {
      const input = form.querySelector('[data-cu-input]');
      const grid  = form.querySelector('[data-cu-grid]');
      const ta    = form.querySelector('textarea[name="content"]');
  
      if (!input || !grid || !ta) return;
  
      const state = {
        items: [],                  // { id, key, file, url }
        maxFiles: +form.dataset.maxFiles || 10,
        maxSize:  +form.dataset.maxSize || 10 * 1024 * 1024, // 10MB
      };
  
      input.addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        addFiles(files, state, grid);
        input.value = ''; // 같은 파일 재선택 가능
      });
  
      form.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-cu-remove]');
        if (!btn) return;
        e.preventDefault();
        removeFile(btn.getAttribute('data-cu-remove'), state, grid);
      });
  
      form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const content = (ta.value || '').trim();
        if (!content && state.items.length === 0) {
          ta.focus(); return;
        }
        const fd = new FormData();
        fd.append('content', content);
        state.items.forEach(it => fd.append('files[]', it.file, it.file.name));
  
        try {
          const endpoint = form.dataset.endpoint || '/api/comments';
          const res = await fetch(endpoint, { method: 'POST', body: fd });
          if (!res.ok) throw new Error('등록 실패');
  
          // 성공 후 초기화
          ta.value = '';
          state.items.forEach(it => it.url && URL.revokeObjectURL(it.url));
          state.items = [];
          render(grid, state.items);
          toast('등록되었습니다.');
          form.dispatchEvent(new CustomEvent('comment:submitted', { bubbles: true }));
        } catch (err) {
          console.error(err);
          toast('등록에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        }
      });
    }
  
    /* -------- 내부 로직 -------- */
    function addFiles(files, state, grid) {
      for (const file of files) {
        if (state.items.length >= state.maxFiles) { toast(`최대 ${state.maxFiles}개까지 첨부할 수 있어요.`); break; }
        if (file.size > state.maxSize)            { toast('10MB 이하 파일만 첨부 가능합니다.'); continue; }
  
        const key = `${file.name}_${file.size}_${file.lastModified}`;
        if (state.items.some(x => x.key === key)) continue;
  
        const id  = 'f_' + Math.random().toString(36).slice(2);
        const url = (/^(image|video)\//.test(file.type)) ? URL.createObjectURL(file) : '';
        state.items.push({ id, key, file, url });
      }
      render(grid, state.items);
    }
  
    function removeFile(id, state, grid) {
      const idx = state.items.findIndex(x => x.id === id);
      if (idx < 0) return;
      const it = state.items[idx];
      if (it.url) URL.revokeObjectURL(it.url);
      state.items.splice(idx, 1);
      render(grid, state.items);
    }
  
    function render(grid, items) {
      grid.innerHTML = '';
      items.forEach(({ id, file, url }) => {
        const col = document.createElement('div');
        col.className='pj-col'; // DesignSystem grid를 쓰는 경우 .row .g-2와 함께 사용
  
        const box = document.createElement('div');
        box.className='thumb' + (url ? '' : ' file');
  
        if (url && file.type.startsWith('image/')) {
          const img = document.createElement('img');
          img.src = url; img.alt = file.name; box.appendChild(img);
        } else if (url && file.type.startsWith('video/')) {
          const video = document.createElement('video');
          video.src = url; video.muted = true; video.playsInline = true;
          box.appendChild(video);
        } else {
          box.textContent = file.name;
          const ext = document.createElement('span');
          ext.className='ext';
          ext.textContent = (file.name.split('.').pop() || '').toUpperCase();
          box.appendChild(ext);
        }
  
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.className='remove';
        rm.setAttribute('data-cu-remove', id);
        rm.innerHTML = '<i class="ri-close-line"></i>';
        box.appendChild(rm);
  
        col.appendChild(box);
        grid.appendChild(col);
      });
    }
  
    function toast(msg) {
      const el = document.createElement('div');
      el.textContent = msg;
      Object.assign(el.style, {
        position: 'fixed',
        left: '50%',
        bottom: '24px',
        transform: 'translateX(-50%)',
        background: 'var(--pj-legacy-dark)',
        color: 'var(--pj-legacy-white)',
        padding: '8px 12px',
        borderRadius: '12px',
        zIndex: 1055,
        opacity: '0.95'
      });
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1800);
    }
  
    // UMD 스타일로 노출
    global.initCommentUploader = initCommentUploader;
  })(window);

  
 



  document.addEventListener('DOMContentLoaded', function(){

    // ===== SVG 원본 삽입 (SVG Definitions) =====
    const svgClose = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="12" r="9" fill="#BDBDBD" stroke="#BDBDBD" stroke-width="2"/>
<path d="M14.2929 8.29289C14.6834 7.90237 15.3164 7.90237 15.707 8.29289C16.0975 8.68342 16.0975 9.31643 15.707 9.70696L13.414 11.9999L15.707 14.2929C16.0975 14.6834 16.0975 15.3164 15.707 15.707C15.3164 16.0975 14.6834 16.0975 14.2929 15.707L11.9999 13.414L9.70696 15.707C9.31643 16.0975 8.68342 16.0975 8.29289 15.707C7.90237 15.3164 7.90237 14.6834 8.29289 14.2929L10.5859 11.9999L8.29289 9.70696C7.90237 9.31643 7.90237 8.68342 8.29289 8.29289C8.68342 7.90237 9.31643 7.90237 9.70696 8.29289L11.9999 10.5859L14.2929 8.29289Z" fill="white"/>
</svg>
`;
    
    const svgEyeOn = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14C13.1046 14 14 13.1046 14 12ZM16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z" fill="#FF6633"/><path d="M11.9999 3C17.1992 3.00001 21.5199 6.72042 22.9608 11.7236C23.0128 11.9042 23.0128 12.0958 22.9608 12.2764C21.5199 17.2795 17.1992 21 11.9999 21C6.80056 21 2.4799 17.2796 1.03896 12.2764C0.987008 12.0958 0.987021 11.9042 1.03896 11.7236C2.47992 6.72046 6.80059 3 11.9999 3ZM11.9999 5C7.90543 5 4.34999 7.87744 3.04579 12C4.34999 16.1226 7.90544 19 11.9999 19C16.0943 19 19.6487 16.1224 20.953 12C19.6488 7.87759 16.0943 5.00001 11.9999 5Z" fill="#FF6633"/></svg>`;
    
    const svgEyeOff = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4.58193 5.94238C4.98891 5.56914 5.6217 5.59599 5.99501 6.00293C6.36798 6.40988 6.34024 7.04276 5.93349 7.41602C4.63071 8.61121 3.61801 10.1881 3.04482 11.998C4.34849 16.1217 7.90478 19 11.9999 19C13.6691 19 15.239 18.5261 16.6054 17.6885C17.0761 17.4 17.6917 17.547 17.9804 18.0176C18.2689 18.4884 18.121 19.1049 17.6503 19.3936C15.9852 20.4143 14.056 21 11.9999 21C6.80058 21 2.47991 17.2796 1.03896 12.2764C0.987008 12.0958 0.987021 11.9042 1.03896 11.7236C1.6933 9.45172 2.93548 7.45279 4.58193 5.94238ZM11.9999 3C17.1991 3.00011 21.5199 6.72049 22.9608 11.7236C23.0128 11.9042 23.0128 12.0958 22.9608 12.2764C22.4972 13.8862 21.7387 15.3588 20.7509 16.6172C20.4099 17.0516 19.781 17.127 19.3466 16.7861C18.9124 16.4451 18.8368 15.8171 19.1776 15.3828C19.9494 14.3997 20.5546 13.2529 20.952 11.9961C19.6468 7.87581 16.0929 5.0001 11.9999 5C11.0645 5 10.1617 5.14865 9.30947 5.42578C8.78428 5.5966 8.21957 5.30934 8.04872 4.78418C7.87815 4.25917 8.16542 3.69533 8.69033 3.52441C9.73873 3.18345 10.8504 3 11.9999 3Z" fill="#BDBDBD"/>
<path d="M10.0693 11.4834C10.0255 11.6478 10 11.8204 10 12C10.0002 13.1044 10.8955 14 12 14C12.1794 14 12.3515 13.9735 12.5156 13.9297L13.9971 15.4111C13.9173 15.4923 13.8236 15.5625 13.7148 15.6143C13.194 15.8616 12.6115 16 12 16C9.79098 16 8.00019 14.209 8 12C8.00005 11.3879 8.13791 10.8044 8.38574 10.2832C8.43719 10.1752 8.50634 10.0814 8.58691 10.002L10.0693 11.4834Z" fill="#BDBDBD"/>
<path d="M21.2074 19.7933C21.5976 20.1838 21.5978 20.8171 21.2074 21.2075C20.8169 21.598 20.1837 21.5978 19.7931 21.2075L2.79289 4.20726C2.40237 3.81673 2.40237 3.18357 2.79289 2.79304C3.18342 2.40252 3.81658 2.40252 4.20711 2.79304L21.2074 19.7933Z" fill="#BDBDBD"/>
</svg>
`; 
    
    // ===== MAIN SCRIPT (수정됨) =====
    document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]').forEach(input => {

        // 🚨 수정: input의 가장 가까운 조상 중 '.input-wrapper' 클래스를 가진 요소를 찾습니다.
        const wrapper = input.closest('.input-wrapper'); 

        // 래퍼가 없으면, 이 input은 건너뛰고 다음 input으로 넘어갑니다.
        if (!wrapper) {
            return; 
        }

        // 기존 코드는 parentElement를 사용했는데, closest로 찾은 wrapper를 사용하는 것이 명확합니다.
        if(getComputedStyle(wrapper).position === 'static'){
            wrapper.style.position = 'relative';
        }
    
        const btn = document.createElement('button');
        btn.type = "button";
        btn.className="input-action-btn";
        btn.style.display = "none";
    
        // invalid-feedback 앞에 삽입 (input 바로 뒤에)
        const afterTarget = input.nextElementSibling;
        if(afterTarget && afterTarget.classList.contains('invalid-feedback')){
            wrapper.insertBefore(btn, afterTarget);
        } else {
            input.insertAdjacentElement('afterend', btn);
        }
    
        const isPassword = input.type === "password";
        if(isPassword){
            let showing = false;
            btn.innerHTML = svgEyeOff;
    
            btn.addEventListener('click', () => {
                showing = !showing;
                input.type = showing ? "text" : "password";
                btn.innerHTML = showing ? svgEyeOn : svgEyeOff;
            });
    
        }else{
            btn.innerHTML = svgClose;
            btn.addEventListener('click', () => {
                input.value = "";
                btn.style.display = "none";
                input.dispatchEvent(new Event('input'));
            });
        }
    
        // 입력 변화 감지
        input.addEventListener('input', () => {
            btn.style.display = input.value.trim() ? "flex" : "none";
        });

        // 페이지 로드 시 값이 미리 채워져 있으면 버튼 보이기
        if(input.value.trim()){
            btn.style.display = "flex";
        }
    
    });
});


// label 바로 뒤에 오는 input(type=text/email/password) 에만
// label-has-form-control 클래스를 붙이는 공용 스크립트
function applyLabelClassForInputs() {
    document.querySelectorAll('label').forEach(label => {
      let next = label.nextElementSibling;
      if (!next) return;
  
      // 1) label 바로 뒤가 input 인 경우
      if (
        next.matches(
          'input[type="text"], input[type="email"], input[type="password"], input[type="tel"]'
        )
      ) {
        label.classList.add('label-has-form-control');
        return;
      }
  
      // 2) label 다음이 래퍼(div.password-wrap 등)인 경우
      const innerInput = next.querySelector(
        'input[type="text"], input[type="email"], input[type="password"], input[type="tel"]'
      );
      if (innerInput) {
        label.classList.add('label-has-form-control');
      }
    });
  }
  
  document.addEventListener('DOMContentLoaded', applyLabelClassForInputs);

(() => {
  const ready = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  };

  const getDetailUrl = () => {
    return window.picjejuPage ? window.picjejuPage("detail.html") : "detail.html";
  };

  const isCtaLinkButton = (element) => {
    return element?.classList?.contains("pj-button--link");
  };

  const isCtaDivider = (element) => {
    return element?.classList?.contains("cta-divider") || element?.classList?.contains("mypage-rv-action-divider");
  };

  const normalizeCtaDivider = (divider) => {
    divider.classList.add("cta-divider");
    divider.setAttribute("aria-hidden", "true");
    divider.textContent = "|";
  };

  const initCtaDividers = (root = document) => {
    const ctas = [];
    if (root instanceof Element && root.matches(".cta")) {
      ctas.push(root);
    }
    root.querySelectorAll?.(".cta").forEach((cta) => ctas.push(cta));

    ctas.forEach((cta) => {
      const groups = [cta, ...cta.querySelectorAll("*")];
      groups.forEach((group) => {
        Array.from(group.children).forEach((child) => {
          if (!isCtaLinkButton(child)) return;

          const next = child.nextElementSibling;
          if (!next) return;

          if (isCtaDivider(next)) {
            normalizeCtaDivider(next);
            return;
          }

          if (!isCtaLinkButton(next)) return;

          const divider = document.createElement("span");
          divider.className = "cta-divider";
          divider.setAttribute("aria-hidden", "true");
          divider.textContent = "|";
          group.insertBefore(divider, next);
        });
      });
    });
  };

  const initOrderItemThumbLinks = (root = document) => {
    const thumbs = [];
    if (root instanceof Element && root.matches(".pj-u-order-item-thumb")) {
      thumbs.push(root);
    }
    root.querySelectorAll?.(".pj-u-order-item-thumb").forEach((thumb) => thumbs.push(thumb));

    thumbs.forEach((thumb) => {
      if (thumb.dataset.pjOrderThumbLinked === "true") return;
      thumb.dataset.pjOrderThumbLinked = "true";

      if (thumb.closest("a") || thumb.querySelector("a")) return;

      const title = thumb.closest(".pj-u-order-item")?.querySelector(".pj-u-order-item-title")?.textContent.trim();
      thumb.setAttribute("role", "link");
      thumb.setAttribute("aria-label", title ? `${title} 상품 상세 보기` : "상품 상세 보기");
      thumb.tabIndex = 0;
    });
  };

  const moveToDetail = (thumb) => {
    const url = thumb.dataset.pjHref || getDetailUrl();
    window.location.href = url;
  };

  ready(() => {
    initCtaDividers();
    initOrderItemThumbLinks();

    document.addEventListener("click", (event) => {
      const thumb = event.target.closest(".pj-u-order-item-thumb");
      if (!thumb || event.target.closest("a, button")) return;

      event.preventDefault();
      moveToDetail(thumb);
    });

    document.addEventListener("keydown", (event) => {
      const thumb = event.target.closest(".pj-u-order-item-thumb");
      if (!thumb || (event.key !== "Enter" && event.key !== " ")) return;

      event.preventDefault();
      moveToDetail(thumb);
    });

    if (typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          initCtaDividers(node);
          initOrderItemThumbLinks(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
  
