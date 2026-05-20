/* /admin/assets/js/settings.js
   Imweb Admin - Settings page controller
   - LocalStorage persistence (versioned)
   - Data binding via [data-setting]
   - Section toggles via [data-toggle-target]
   - Validation, export/import, test actions
   - No external deps except Bootstrap (optional for Modal)
*/
(() => {
    'use strict';
  
    // ====== Utilities ======
    const $  = (sel, r=document) => r.querySelector(sel);
    const $$ = (sel, r=document) => Array.from(r.querySelectorAll(sel));
    const on = (el, ev, fn) => el && el.addEventListener(ev, fn, { passive: false });
    const fmtJSON = (obj) => JSON.stringify(obj, null, 2);
    const deepGet = (obj, path) => path.split('.').reduce((o,k)=> (o&&k in o)? o[k] : undefined, obj);
    const deepSet = (obj, path, val) => {
      const keys = path.split('.');
      let cur = obj;
      keys.forEach((k,i) => {
        if (i === keys.length - 1) cur[k] = val;
        else cur = cur[k] = cur[k] ?? {};
      });
      return obj;
    };
    const copy = (v) => JSON.parse(JSON.stringify(v));
    const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
  
    // ====== Storage / Schema ======
    const STORAGE_KEY = 'imweb.admin.settings.v1';
    const SCHEMA_VERSION = 1;
  
    const DEFAULTS = {
      __meta: { version: SCHEMA_VERSION, savedAt: null },
      site: {
        name: 'PicJeju Admin',
        url: 'https://plandertest2.mycafe24.com/picjeju',
        timezone: 'Asia/Seoul',
        locale: 'ko-KR',
        maintenance: { enabled: false, message: '점검 중입니다. 잠시만 기다려주세요.' }
      },
      security: {
        sessionTimeoutMin: 60,
        twoFactor: false,
        ipWhitelistEnabled: false,
        ipWhitelist: ''
      },
      notifications: {
        inboxBadge: true,
        deskAlerts: true,
        email: {
          enabled: true,
          fromName: 'PicJeju',
          fromEmail: 'noreply@picjeju.co.kr',
          smtpHost: '',
          smtpPort: 587,
          secure: true
        },
        sms: {
          enabled: false,
          senderId: '',
          provider: 'twilio'
        }
      },
      orders: {
        cancelWindowHours: 24,
        returnsEnabled: true,
        exchangeOnHoldEnabled: true, // 교환보류 사용
        exchangeOnHoldAutoReleaseHours: 72 // 교환보류 자동 해제(시간)
      },
      points: {
        enabled: true,
        earnRate: 1,    // 1%
        useMin: 0,
        useMaxRate: 30  // 최대 30%
      },
      coupons: {
        enabled: true,
        stackable: false,
        autoApplyBest: true
      },
      shipping: {
        baseFee: 3000,
        freeOver: 50000,
        areaSurchargesEnabled: false,
        areaSurcharges: ''
      },
      files: {
        uploadMaxMB: 20,
        imageOnly: true,
        thumbAuto: true
      },
      advanced: {
        apiKey: '',
        cacheTTLMin: 15
      },
      ui: {
        autosave: false
      }
    };
  
    function loadSettings() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return copy(DEFAULTS);
        const parsed = JSON.parse(raw);
        // migration hook
        if (!parsed.__meta || parsed.__meta.version !== SCHEMA_VERSION) {
          parsed.__meta = { version: SCHEMA_VERSION, savedAt: null };
        }
        // merge shallow defaults (keep new keys)
        return mergeDefaults(parsed, DEFAULTS);
      } catch {
        return copy(DEFAULTS);
      }
    }
  
    function mergeDefaults(target, defaults) {
      const out = copy(target);
      (function walk(def, cur) {
        for (const k of Object.keys(def)) {
          if (typeof def[k] === 'object' && def[k] !== null && !Array.isArray(def[k])) {
            cur[k] = cur[k] ?? {};
            walk(def[k], cur[k]);
          } else if (!(k in cur)) {
            cur[k] = def[k];
          }
        }
      })(defaults, out);
      return out;
    }
  
    function saveSettings(data) {
      const toSave = copy(data);
      toSave.__meta = { version: SCHEMA_VERSION, savedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      toast('설정이 저장되었습니다.');
    }
  
    function resetSettings() {
      const fresh = copy(DEFAULTS);
      saveSettings(fresh);
      return fresh;
    }
  
    // ====== UI Bindings ======
    const form = $('#settingsForm');
    if (!form) return; // Guard: only run on settings page
  
    let state = loadSettings();
  
    // Map inputs by data-setting path
    const binds = $$('[data-setting]', form);
  
    function bindUIFromState() {
      binds.forEach(el => {
        const path = el.getAttribute('data-setting');
        const val = deepGet(state, path);
        if (el.type === 'checkbox') {
          el.checked = Boolean(val);
        } else if (el.type === 'number') {
          el.value = (val ?? '').toString();
        } else {
          el.value = (val ?? '').toString();
        }
        reflectToggleFor(el);
      });
      // autosave toggle (optional)
      const auto = $('#autoSaveToggle');
      if (auto) auto.checked = !!state.ui.autosave;
    }
  
    function collectStateFromUI() {
      binds.forEach(el => {
        const path = el.getAttribute('data-setting');
        let val;
        if (el.type === 'checkbox') {
          val = !!el.checked;
        } else if (el.type === 'number') {
          const n = Number(el.value);
          val = Number.isFinite(n) ? n : 0;
        } else {
          val = (el.value || '').trim();
        }
        // normalizations
        if (path === 'site.url') {
          val = normalizeUrl(val);
        }
        if (path === 'notifications.email.smtpPort') {
          val = clamp(Number(val) || 0, 1, 65535);
        }
        deepSet(state, path, val);
      });
    }
  
    function normalizeUrl(u) {
      if (!u) return '';
      try {
        // ensure protocol, strip trailing slash
        const hasProto = /^https?:\/\//i.test(u);
        const url = new URL(hasProto ? u : ('https://' + u));
        url.pathname = url.pathname.replace(/\/+$/, '');
        return url.toString().replace(/\/+$/, '');
      } catch {
        return u.replace(/\/+$/,'');
      }
    }
  
    // ====== Toggles (show/hide sections) ======
    function reflectToggleFor(el) {
      const targetSel = el.getAttribute('data-toggle-target');
      if (!targetSel) return;
      const target = $(targetSel, form) || $(targetSel);
      if (!target) return;
  
      // Logic:
      // - checkbox: show when checked
      // - select/text/number: show when value truthy & not "0"/"false"
      let show = false;
      if (el.type === 'checkbox') {
        show = el.checked;
      } else {
        const v = (el.value || '').trim().toLowerCase();
        show = !!v && v !== '0' && v !== 'false' && v !== 'off';
      }
      target.style.display = show ? '' : 'none';
    }
  
    function wireToggles() {
      $$('[data-toggle-target]', form).forEach(el => {
        on(el, 'change', () => reflectToggleFor(el));
        // initial reflect is done in bindUIFromState()
      });
    }
  
    // ====== Validation ======
    function validate() {
      const errors = [];
  
      // Site
      const siteName = $('[data-setting="site.name"]', form)?.value?.trim();
      if (!siteName) errors.push('사이트 이름을 입력하세요.');
  
      const siteUrl = $('[data-setting="site.url"]', form)?.value?.trim();
      if (!/^https?:\/\/.+/i.test(siteUrl)) errors.push('사이트 URL은 http(s):// 로 시작해야 합니다.');
  
      // Email (if enabled)
      const emailEnabled = $('[data-setting="notifications.email.enabled"]', form)?.checked;
      if (emailEnabled) {
        const fromEmail = $('[data-setting="notifications.email.fromEmail"]', form)?.value?.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail||'')) {
          errors.push('발신 이메일 주소 형식이 올바르지 않습니다.');
        }
        const smtpPort = Number($('[data-setting="notifications.email.smtpPort"]', form)?.value || 0);
        if (!Number.isFinite(smtpPort) || smtpPort <= 0 || smtpPort > 65535) {
          errors.push('SMTP 포트가 올바르지 않습니다 (1~65535).');
        }
      }
  
      // Points
      const earnRate = Number($('[data-setting="points.earnRate"]', form)?.value || 0);
      if (earnRate < 0 || earnRate > 100) errors.push('포인트 적립률은 0~100 사이여야 합니다.');
  
      // Shipping
      const baseFee = Number($('[data-setting="shipping.baseFee"]', form)?.value || 0);
      if (baseFee < 0) errors.push('기본 배송비는 0 이상이어야 합니다.');
  
      // Files
      const uploadMaxMB = Number($('[data-setting="files.uploadMaxMB"]', form)?.value || 0);
      if (uploadMaxMB <= 0) errors.push('업로드 최대 용량(MB)은 1 이상이어야 합니다.');
  
      return errors;
    }
  
    // ====== Actions ======
    function doSave() {
      collectStateFromUI();
      const errs = validate();
      if (errs.length) {
        alert('저장할 수 없습니다:\n- ' + errs.join('\n- '));
        return;
      }
      saveSettings(state);
    }
  
    function doReset() {
      if (!confirm('모든 설정을 기본값으로 초기화할까요?')) return;
      state = resetSettings();
      bindUIFromState();
    }
  
    function doExport() {
      collectStateFromUI();
      const blob = new Blob([fmtJSON(state)], { type: 'application/json;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = 'imweb-settings.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    }
  
    function doImport() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      on(input, 'change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          const json = JSON.parse(text);
          // minimal sanity checks
          if (!json || typeof json !== 'object') throw new Error('잘못된 파일입니다.');
          if (!json.__meta) json.__meta = { version: SCHEMA_VERSION, savedAt: null };
          // merge unknown keys conservatively
          state = mergeDefaults(json, DEFAULTS);
          saveSettings(state);
          bindUIFromState();
          toast('설정 파일을 가져왔습니다.');
        } catch (e) {
          alert('가져오기 실패: ' + (e.message || e));
        }
      });
      input.click();
    }
  
    function doTestEmail() {
      collectStateFromUI();
      if (!state.notifications?.email?.enabled) {
        alert('이메일 알림이 비활성화되어 있습니다.');
        return;
      }
      const to = prompt('테스트 메일을 보낼 주소를 입력하세요:', state.notifications.email.fromEmail || '');
      if (!to) return;
      // 실제 발송은 백엔드 필요—여기선 UI 피드백만
      toast(`테스트 메일 전송 요청: ${to}\n(데모: 실제 발송은 백엔드 연동 필요)`);
    }
  
    function doTestSMS() {
      collectStateFromUI();
      if (!state.notifications?.sms?.enabled) {
        alert('SMS 알림이 비활성화되어 있습니다.');
        return;
      }
      const to = prompt('테스트 SMS를 보낼 번호를 입력하세요 (예: 01012345678):', '');
      if (!to) return;
      toast(`테스트 SMS 전송 요청: ${to}\n(데모: 실제 발송은 백엔드 연동 필요)`);
    }
  
    function doRegenerateApiKey() {
      const ok = confirm('API 키를 재발급할까요? 기존 키는 더 이상 사용되지 않습니다.');
      if (!ok) return;
      const newKey = 'pk_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      deepSet(state, 'advanced.apiKey', newKey);
      saveSettings(state);
      // 반영
      const apiInput = $('[data-setting="advanced.apiKey"]', form);
      if (apiInput) apiInput.value = newKey;
      toast('새 API 키가 발급되었습니다.');
    }
  
    function doPurgeCache() {
      collectStateFromUI();
      const ttl = state.advanced?.cacheTTLMin ?? 15;
      toast(`캐시 비우기 요청 (TTL=${ttl}분)\n(데모: 실제 캐시 삭제는 백엔드 연동 필요)`);
    }
  
    // ====== Autosave ======
    function wireAutosave() {
      const auto = $('#autoSaveToggle');
      if (!auto) return;
      on(auto, 'change', () => {
        state.ui.autosave = !!auto.checked;
        saveSettings(state);
      });
      // input listeners
      const debounced = debounce(() => {
        if (!state.ui.autosave) return;
        collectStateFromUI();
        const errs = validate();
        if (errs.length) return; // 유효하지 않으면 저장 보류
        saveSettings(state);
      }, 400);
      binds.forEach(el => on(el, 'input', debounced));
      binds.forEach(el => on(el, 'change', debounced));
    }
  
    function debounce(fn, wait=300) {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(null, args), wait);
      };
    }
  
    // ====== Minor helpers ======
    function toast(msg) {
      // If Bootstrap Toast is available in your admin, use it—fallback to alert
      try {
        const id = 'settings-toast';
        let box = document.getElementById(id);
        if (!box) {
          box = document.createElement('div');
          box.id = id;
          box.className = 'toast align-items-center text-bg-dark position-fixed bottom-0 end-0 m-3';
          box.setAttribute('role', 'alert');
          box.setAttribute('aria-live', 'assertive');
          box.setAttribute('aria-atomic', 'true');
          box.innerHTML = `
            <div class="d-flex">
              <div class="toast-body"></div>
              <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>`;
          document.body.appendChild(box);
        }
        box.querySelector('.toast-body').textContent = msg;
        if (window.bootstrap?.Toast) {
          const t = bootstrap.Toast.getOrCreateInstance(box, { delay: 2200 });
          t.show();
        } else {
          alert(msg);
        }
      } catch {
        alert(msg);
      }
    }
  
    // ====== Wire buttons ======
    const wireAction = (action, handler) => {
      $$(`[data-settings-action="${action}"]`).forEach(button => {
        on(button, 'click', (e) => {
          e.preventDefault();
          handler();
        });
      });
    };
    wireAction('save', doSave);
    wireAction('reset', doReset);
    wireAction('export', doExport);
    wireAction('import', doImport);
    on($('#btnTestEmail'), 'click', (e) => { e.preventDefault(); doTestEmail(); });
    on($('#btnTestSMS'), 'click', (e) => { e.preventDefault(); doTestSMS(); });
    on($('#btnRegenerateApiKey'), 'click', (e) => { e.preventDefault(); doRegenerateApiKey(); });
    on($('#btnPurgeCache'), 'click', (e) => { e.preventDefault(); doPurgeCache(); });
  
    // ====== Init ======
    bindUIFromState();
    wireToggles();
    wireAutosave();
  
    // Expose (optional)
    window.IMAdmin = window.IMAdmin || {};
    window.IMAdmin.settings = {
      get: () => copy(state),
      set: (path, val) => { deepSet(state, path, val); saveSettings(state); bindUIFromState(); },
      save: doSave,
      reset: doReset,
      export: doExport
    };
  
  })();
  
