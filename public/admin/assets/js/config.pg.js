/* public/assets/js/config.pg.js */
/* 전자결제 공통 설정 동작 */
(function () {
    const $ = (sel, ctx) => (ctx || document).querySelector(sel);
    const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  
    const state = { selected: new Set() };
  
    function show(el, on) { if (el) el.style.display = on ? '' : 'none'; }
    function enable(el, on) { if (el) el.disabled = !on; }
    function toast(message, type = 'success') {
      if (window.AdminToast?.show) window.AdminToast.show(message, type);
      else alert(message);
    }
  
    function initPopovers() {
      if (!window.bootstrap) return;
      $$('[data-bs-toggle="popover"]').forEach(el => {
        try { new bootstrap.Popover(el); } catch(e){}
      });
    }
  
    function refreshDefaultSelect() {
      const wrap = $('#select_default_type_wrap');
      const sel  = $('#select_default_type');
      if (!sel) return;
  
      const selected = Array.from(state.selected);
      show(wrap, selected.length >= 1);
      wrap?.setAttribute('data-cnt', String(selected.length));
  
      Array.from(sel.options).forEach(op => {
        op.disabled = true;
        op.style.display = 'none';
      });
  
      selected.forEach(key => {
        const op = sel.querySelector(`option[value="${key}"]`);
        if (op) { op.disabled = false; op.style.display = ''; }
      });
  
      if (!selected.includes(sel.value)) sel.value = selected[0] || '';
    }
  
    function refreshCashBlocks() {
      const needCashReceipt = state.selected.has('cash') || state.selected.has('virtual');
      $$('.\\_cash_receipt_wrap').forEach(el => show(el, needCashReceipt));
      show($('#bank_info_from'), state.selected.has('cash'));
    }
  
    function updateSaveBtn() { enable($('#btnSave'), true); }
  
    function changePayType(key, on) {
      if (on) state.selected.add(key); else state.selected.delete(key);
      refreshDefaultSelect();
      refreshCashBlocks();
      updateSaveBtn();
    }
    function changeDefaultPayType(){ updateSaveBtn(); }
    function changeCashReceiptStatus(){ updateSaveBtn(); }
  
    function addCashForm() {
      const root = $('#bank_info_from');
      const row = root?.querySelector('._cash_from');
      if (!row) return;
      const clone = row.cloneNode(true);
      $$('input', clone).forEach(inp => inp.value = '');
      root.appendChild(clone);
      updateSaveBtn();
    }
  
    function bindInitialChecked() {
      $$('input[type="checkbox"][name="pay_types"]').forEach(chk => {
        if (chk.checked) state.selected.add(chk.value);
      });
      refreshDefaultSelect();
      refreshCashBlocks();
    }
  
    function onSubmit() {
      const form = $('#pgForm');
      if (!form) return;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const btn = $('#btnSave'); if (btn){ btn.disabled = true; btn.innerText='저장됨'; setTimeout(()=>{ btn.innerText='저장'; },1200); }
        toast('전자결제 설정이 저장되었습니다.');
        // 실제 저장 로직 연결
      });
    }
  
    window.SHOP_PG_CONFIG = {
      changePayType, changeDefaultPayType, changeCashReceiptStatus,
      addCashForm, enableSave: updateSaveBtn
    };
  
    document.addEventListener('DOMContentLoaded', () => {
      bindInitialChecked();
      onSubmit();
      initPopovers();
    });
    // 부트스트랩 지연 로딩 대비
    window.addEventListener('bootstrap:ready', initPopovers, { once: true });
  })();
  
