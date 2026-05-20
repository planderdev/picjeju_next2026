/* /admin/assets/js/sms_settings.js
 * SMS · 알림톡 설정 (데모)
 * - localStorage로 상태 저장/로드
 * - 발신번호/카카오 신청/쿼터/자동메시지 토글/미리보기/저장 버튼
 * - 페이지 마크업은 이미 존재한다고 가정 (id 기준 바인딩)
 */

(function () {
    const $  = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  
    /* =========================
     * Storage
     * ======================= */
    const LS_KEY = 'imw.sms.settings.v1';
    const DEFAULTS = {
      use: false,
      senderVerified: false,
      senderNumber: '',
      ownerPhones: '',
      sendType: 'sms',          // 'sms' | 'kakao'
      kakaoEnabled: false,
      quota: 0,
      automsg: {
        'join_complete.user': false, 'join_complete.owner': false,
        'join_confirm.user': false,  'join_confirm.owner': false,
        'order_paid.user': true,     'order_paid.owner': true,
        'shipping_start.user': true, 'shipping_start.owner': false,
        'booking_payment.user': false, 'booking_payment.owner': false
      }
    };
    const getState = () => {
      try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(LS_KEY) || '{}')); }
      catch(e) { return {...DEFAULTS}; }
    };
    const saveState = (s) => localStorage.setItem(LS_KEY, JSON.stringify(s));
    let S = getState();
  
    /* =========================
     * Elements
     * ======================= */
    const useToggle     = $('#useToggle');
    const sender_wrap   = $('#sender_wrap');
    const owner_wrap    = $('#owner_wrap');
    const sendtype_wrap = $('#sendtype_wrap');
    const kakao_wrap    = $('#kakao_wrap');
    const quota_wrap    = $('#quota_wrap');
    const auto_wrap     = $('#auto_wrap');
    const disabledGuide = $('#smsDisabledGuide');
  
    const senderStatus  = $('#senderStatus');
    const senderNumber  = $('#senderNumber');
    const btnSenderEdit = $('#btnSenderEdit');
  
    const ownerPhones   = $('#ownerPhones');
  
    const btnKakaoApply = $('#btnKakaoApply');
    const kakaoStatus   = $('#kakaoStatus');
  
    const quotaRemain   = $('#quotaRemain');
    const btnCharge     = $('#btnCharge');
  
    const btnSave       = $('#btnSave');
    const btnSaveMobile = $('#btnSaveMobile');
  
    const btnHowTo      = $('#btnHowTo');
    const btnViewLogs   = $('#btnViewLogs');
  
    // Preview modal
    const modalPreviewEl = $('#modalPreview');
    const pvTitle = $('#pvTitle');
    const pvBody  = $('#pvBody');
  
    // 라디오(발송수단)
    const typeSms   = $('#typeSms');
    const typeKakao = $('#typeKakao');
  
    /* =========================
     * URL helper (안전한 붙이기)
     * ======================= */
    function adminUrl(path) {
      const base = (window.ADMIN_BASE_URL || '').replace(/\/+$/, '');
      const p = String(path || '').replace(/^\/+/, '');
      return `${base}/${p}`;
    }
    function gotoBy(el, fallbackPath) {
      // 1) PHP가 data-href 내려줬으면 최우선
      if (el && el.dataset && el.dataset.href) {
        location.href = el.dataset.href;
        return;
      }
      // 2) 아니면 ADMIN_BASE_URL + path
      location.href = adminUrl(fallbackPath);
    }
  
    /* =========================
     * Templates (미리보기용 데모)
     * ======================= */
    const TPLS = {
      join_complete:  { title:'회원가입 완료',    body:'{{name}}님, 가입이 완료되었습니다.' },
      join_confirm:   { title:'회원가입 승인',    body:'{{name}}님의 가입이 승인되었습니다.' },
      order_paid:     { title:'결제 완료 안내',    body:'주문이 정상적으로 결제되었습니다.\n주문번호: {{order_no}}' },
      shipping_start: { title:'배송 시작',        body:'주문하신 상품이 발송되었습니다.\n송장번호: {{track_no}}' },
      booking_payment:{ title:'예약 입금 요청',    body:'예약금 입금 부탁드립니다.\n예약번호: {{book_no}}' }
    };
  
    /* =========================
     * Renderers
     * ======================= */
    function renderVisibility() {
      const v = !!S.use;
      document.body.classList.toggle('admin-sms-enabled', v);
      [sender_wrap, owner_wrap, sendtype_wrap, quota_wrap, auto_wrap].forEach(
        el => el && el.classList.toggle('d-none', !v)
      );
      if (disabledGuide) disabledGuide.classList.toggle('d-none', v);
      if (kakao_wrap) kakao_wrap.classList.toggle('d-none', !(v && S.sendType === 'kakao'));
    }
  
    function renderSender() {
      if (!senderStatus || !senderNumber) return;
      senderStatus.className = S.senderVerified ? 'text-success' : 'text-warning';
      senderStatus.innerHTML = S.senderVerified
        ? '<i class="ri-checkbox-circle-line"></i> 인증 완료'
        : '<i class="ri-error-warning-line"></i> 미인증';
      senderNumber.textContent = S.senderNumber || '-';
    }
  
    function renderKakao() {
      if (!kakaoStatus) return;
      kakaoStatus.className = S.kakaoEnabled ? 'text-success' : 'text-warning';
      kakaoStatus.innerHTML = S.kakaoEnabled
        ? '<i class="ri-checkbox-circle-line"></i> 사용 중'
        : '<i class="ri-close-circle-line"></i> 미사용';
    }
  
    function renderQuota() {
      if (quotaRemain) quotaRemain.textContent = String(S.quota);
    }
  
    function renderForm() {
      if (useToggle) useToggle.checked = !!S.use;
      if (ownerPhones) ownerPhones.value = S.ownerPhones || '';
      if (typeSms && typeKakao) {
        if (S.sendType === 'kakao') typeKakao.checked = true;
        else typeSms.checked = true;
      }
      // 자동 토글 체크
      $$('.auto-toggle').forEach(cb => {
        const key = cb.dataset.key;
        cb.checked = !!S.automsg[key];
      });
  
      renderVisibility();
      renderSender();
      renderKakao();
      renderQuota();
    }
  
    /* =========================
     * Event handlers
     * ======================= */
    on(useToggle, 'change', () => {
      S.use = !!useToggle.checked;
      saveState(S);
      renderVisibility();
    });
  
    on(btnSenderEdit, 'click', () => {
      const num = prompt('발신번호를 입력하세요 (예: 010-1234-5678)', S.senderNumber || '');
      if (num === null) return;
      S.senderNumber = (num || '').trim();
      S.senderVerified = !!S.senderNumber;
      // 데모: 인증되면 기본 쿼터 지급
      if (S.senderVerified && S.quota === 0) S.quota = 500;
      saveState(S);
      renderSender();
      renderQuota();
    });
  
    on(ownerPhones, 'input', () => {
      S.ownerPhones = (ownerPhones.value || '').trim();
      saveState(S);
    });
  
    [typeSms, typeKakao].forEach(r => on(r, 'change', () => {
      S.sendType = typeKakao && typeKakao.checked ? 'kakao' : 'sms';
      saveState(S);
      renderVisibility();
    }));
  
    on(btnKakaoApply, 'click', () => {
      if (!S.senderVerified) { alert('발신번호를 먼저 인증해 주세요.'); return; }
      S.kakaoEnabled = true;
      saveState(S);
      renderKakao();
      alert('카카오 알림톡이 신청(데모)되었습니다.');
    });
  
    on(btnCharge, 'click', () => {
      S.quota += 1000;
      saveState(S);
      renderQuota();
    });
  
    $$('.auto-toggle').forEach(cb => on(cb, 'change', () => {
      const key = cb.dataset.key;
      S.automsg[key] = !!cb.checked;
      saveState(S);
    }));
  
    // 미리보기
    $$('.preview-link').forEach(a => on(a, 'click', (e) => {
      e.preventDefault();
      const code = a.dataset.template;
      const t = TPLS[code] || { title:'미리보기', body:'내용이 없습니다.' };
      if (pvTitle) pvTitle.textContent = t.title;
      if (pvBody)  pvBody.textContent  = t.body;
      if (window.bootstrap && modalPreviewEl) {
        const m = bootstrap.Modal.getOrCreateInstance(modalPreviewEl);
        m.show();
      }
    }));
  
    // 저장
    function doSave() {
      // 실제에선 서버 전송. 데모는 localStorage 상태를 그대로 둠.
      saveState(S);
      toast('저장되었습니다.');
    }
    on(btnSave, 'click', doSave);
    on(btnSaveMobile, 'click', (e) => { e.preventDefault(); doSave(); });
  
    // 도움말/내역 (data-href 우선, 없으면 ADMIN_BASE_URL 사용)
    on(btnHowTo,   'click', () => gotoBy(btnHowTo,   '/member/sms/?mode=kakao'));
    on(btnViewLogs,'click', () => gotoBy(btnViewLogs,'/member/send/?mode=sms_list'));
  
    // Popover 활성화 (부트스트랩)
    $$('[data-bs-toggle="popover"]').forEach(el => {
      if (window.bootstrap) new bootstrap.Popover(el);
    });
  
    // Toast helper
    function toast(text) {
      const wrap = document.createElement('div');
      wrap.className = 'position-fixed bottom-0 end-0 p-3';
      wrap.style.zIndex = 1080;
      wrap.innerHTML = `
        <div class="toast align-items-center show border-0">
          <div class="d-flex">
            <div class="toast-body">${escapeHtml(text)}</div>
            <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button>
          </div>
        </div>`;
      document.body.appendChild(wrap);
      setTimeout(() => wrap.remove(), 2500);
    }
    function escapeHtml(s){ return (s??'').toString().replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[m])); }
  
    /* =========================
     * Init
     * ======================= */
    renderForm();
  })();
  
