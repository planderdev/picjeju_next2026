/* /admin/assets/js/product-option.js */
/* 옵션/재고/조합 테이블 데모 로직 */
(function () {
    'use strict';
  
    // ---------- 유틸 ----------
    const $ = (sel, el = document) => el.querySelector(sel);
    const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
    const ce = (tag, cls) => {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      return n;
    };
    const uid = (p='O') => p + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  
    // ---------- 전역 객체 (기존 onclick 호환) ----------
    window.SHOP_PROD_MANAGE = window.SHOP_PROD_MANAGE || {};
    window.SHOP_OPTION_MANAGE = window.SHOP_OPTION_MANAGE || {};
  
    // 컨테이너
    const wrap = $('#prod_option_wrap');
    const listWrap = $('#prod_option_list');
    const openBtn = $('#prod_option_open_button');
  
    // 필수/선택 테이블
    const reqTBody = $('#prod_option_detail_require_list');
    const optTBody = $('#prod_option_detail_optional_list');
  
    // 헤더(일괄수정) 컨트롤 (필수)
    const reqHeader = $('#prod_option_detail_require_wrap');
    const reqBulkPrice     = reqHeader ? $('input._option_price', reqHeader) : null;
    const reqBulkPriceSupp = reqHeader ? $('input._option_price_supply', reqHeader) : null;
    const reqBulkStockAdd  = reqHeader ? $('input._option_stock', reqHeader) : null;
    const reqBulkStatus    = reqHeader ? $('select._option_status_multi', reqHeader) : null;
    const reqBulkApplyBtn  = reqHeader ? $('._btn_change_all', reqHeader) : null;
    const reqCheckAll      = reqHeader ? $('._check_all_check', reqHeader) : null;
  
    // 선택옵션 헤더(일괄수정) 컨트롤
    const optHeader = $('#prod_option_detail_optional_wrap');
    const optBulkPrice     = optHeader ? $('input._option_price', optHeader) : null;
    const optBulkPriceSupp = optHeader ? $('input._option_price_supply', optHeader) : null;
    const optBulkStockAdd  = optHeader ? $('input._option_stock', optHeader) : null;
    const optBulkStatus    = optHeader ? $('select._option_status_multi', optHeader) : null;
    const optBulkApplyBtn  = optHeader ? $('._btn_change_all', optHeader) : null;
    const optCheckAll      = optHeader ? $('._check_all_check', optHeader) : null;
  
    // 옵션 데이터 구조(간단)
    // [{ id, type: 'default'|'input'|'color', name, required: true|false, values: [{code, name}] }]
    let options = [];
  
    // ---------- 토글(열기/닫기) ----------
    SHOP_PROD_MANAGE.toggleOptionWrap = function () {
      if (!wrap) return;
      const isOpen = openBtn?.getAttribute('data-isopen') === 'Y';
      wrap.style.display = isOpen ? 'none' : '';
      openBtn?.setAttribute('data-isopen', isOpen ? 'N' : 'Y');
      openBtn && (openBtn.textContent = isOpen ? '옵션 열기' : '옵션 닫기');
    };
  
    SHOP_PROD_MANAGE.openOtherProdOptionImportModal = function () {
      alert('다른 상품 옵션 불러오기(데모): 실제 구현 시 모달을 띄워 선택 후 주입하세요.');
    };
  
    SHOP_PROD_MANAGE.openManual = function (section) {
      window.open('https://imweb.me/manual/#'+(section||'option'), '_blank');
    };
  
    // ---------- 옵션 추가 ----------
    SHOP_OPTION_MANAGE.addOption = function (defType = 'default') {
      if (!listWrap) return;
      const id = uid('OPT');
      const row = ce('div', 'form-group row g-2 align-items-start border rounded p-2');
      row.dataset.optcode = id;
      row.dataset.type = defType;
  
      row.innerHTML = `
        <div class="col-md-2">
          <label class="form-label">옵션타입</label>
          <select class="form-select _option_type">
            <option value="default"${defType==='default'?' selected':''}>기본</option>
            <option value="input"${defType==='input'?' selected':''}>입력형</option>
            <option value="color"${defType==='color'?' selected':''}>색상</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label _option_name_title">옵션명</label>
          <input type="text" class="form-control _option_name" placeholder="예: 색상 / 사이즈">
        </div>
        <div class="col-md-5">
          <label class="form-label _option_value_title">옵션값</label>
          <div class="_option_value_wrap border rounded p-2">
            <label style="width:100%;">
              <ul class="_option_value_list list-unstyled d-flex flex-wrap gap-1 m-0" data-optcode="${id}">
                <li class="_input flex-grow-1" style="min-width:160px;">
                  <input type="text" class="form-control form-control-sm _option_value" placeholder="엔터 또는 Tab으로 추가">
                  <span class="_placeholder d-none"></span>
                </li>
              </ul>
            </label>
          </div>
        </div>
        <div class="col-md-2">
          <label class="form-label d-block">필수</label>
          <div class="form-check">
            <input class="form-check-input _btn_require" type="checkbox" checked>
            <label class="form-check-label">필수</label>
          </div>
        </div>
        <a href="javascript:;" class="btn btn-sm btn-light btn-delete"><i class="ri-close-line"></i></a>
      `;
  
      listWrap.appendChild(row);
      options.push({ id, type: defType, name: '', required: true, values: [] });
  
      bindOptionRow(row);
      rebuildTables();
    };
  
    // 옵션행 이벤트 바인딩
    function bindOptionRow(row) {
      const id = row.dataset.optcode;
  
      // 타입 변경
      $('._option_type', row)?.addEventListener('change', (e) => {
        const type = e.target.value;
        row.dataset.type = type;
        const o = options.find(x => x.id === id);
        if (o) o.type = type;
        rebuildTables();
      });
  
      // 이름 변경
      $('._option_name', row)?.addEventListener('input', (e) => {
        const o = options.find(x => x.id === id);
        if (o) o.name = e.target.value.trim();
        rebuildTables();
      });
  
      // 필수 여부
      $('._btn_require', row)?.addEventListener('change', (e) => {
        const o = options.find(x => x.id === id);
        if (o) o.required = !!e.target.checked;
        rebuildTables();
      });
  
      // 옵션값 입력(엔터/탭 → 칩 생성)
      $('._option_value', row)?.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== 'Tab') return;
        const v = e.target.value.trim();
        if (!v) return;
        e.preventDefault();
        addValueChip(row, v);
        e.target.value = '';
        rebuildTables();
      });
  
      // 삭제
      $('._btn_remove', row)?.addEventListener('click', () => {
        row.remove();
        options = options.filter(x => x.id !== id);
        rebuildTables();
      });
    }
  
    function addValueChip(row, text) {
      const list = $('._option_value_list', row);
      const id = row.dataset.optcode;
      const o = options.find(x => x.id === id);
      if (!list || !o) return;
  
      const code = uid('VAL');
      const li = ce('li', 'value-item badge bg-secondary-subtle border text-dark small position-relative');
      li.dataset.valuecode = code;
      li.style.paddingRight = '20px';
      li.innerHTML = `
        <span class="_value_name" contenteditable="true">${escapeHtml(text)}</span>
        <button class="_btn_remove_value btn btn-link btn-sm p-0 position-absolute end-0 top-50 translate-middle-y" title="삭제">
          <i class="ri-close-line"></i>
        </button>
      `;
  
      // 입력 li 바로 앞에 삽입
      const inputLi = list.querySelector('li._input');
      list.insertBefore(li, inputLi);
  
      // 데이터 반영
      o.values.push({ code, name: text });
  
      // 편집 반영
      li.querySelector('._value_name')?.addEventListener('input', (e) => {
        const nv = e.target.textContent.trim();
        const v = o.values.find(v => v.code === code);
        if (v) v.name = nv;
        rebuildTables();
      });
      li.querySelector('._btn_remove_value')?.addEventListener('click', () => {
        li.remove();
        o.values = o.values.filter(v => v.code !== code);
        rebuildTables();
      });
    }
  
    function escapeHtml(s) {
      return s.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
    }
  
    // ---------- 테이블 렌더 ----------
    function rebuildTables() {
      buildRequiredTable();
      buildOptionalTable();
    }
  
    // 필수 조합 테이블
    function buildRequiredTable() {
      if (!reqTBody) return;
      reqTBody.innerHTML = '';
  
      const reqOpts = options.filter(o => o.required && o.name && o.values.length > 0);
      if (reqOpts.length === 0) return;
  
      // 카테시안
      const combos = cartesian(reqOpts.map(o => o.values.map(v => ({ optId: o.id, optName: o.name, value: v.name }))));
  
      combos.forEach((comb, idx) => {
        const tr = ce('tr', 'align-middle');
        tr.innerHTML = `
          <td><input type="checkbox" class="form-check-input _row_check"></td>
          <td class="_editor"><input type="text" class="form-control form-control-sm _row_price" placeholder="가격(+/-)"></td>
          <td class="_stock_item _editor"><input type="number" class="form-control form-control-sm _row_stock_now" placeholder="재고" value="0"></td>
          <td class="_stock_item _editor"><input type="number" class="form-control form-control-sm _row_stock_add" placeholder="재고추가"></td>
          <td class="_editor"><input type="text" class="form-control form-control-sm _row_sku" placeholder="SKU"></td>
          <td class="_editor">
            <select class="form-select form-select-sm _row_status">
              <option value="SALE">판매중</option>
              <option value="SOLDOUT">품절</option>
              <option value="HIDDEN">숨김</option>
            </select>
          </td>
          <td class="option_break_word">
            ${comb.map(c => `<div class="child"><span class="badge text-bg-light">${escapeHtml(c.optName)}: ${escapeHtml(c.value)}</span></div>`).join('')}
            <div class="child-price mt-1"><input type="text" class="form-control form-control-sm _row_badges" placeholder="옵션 뱃지(쉼표구분)"></div>
          </td>
        `;
        reqTBody.appendChild(tr);
      });
    }
  
    // 선택옵션 테이블(필수 해제된 옵션들)
    function buildOptionalTable() {
      if (!optTBody) return;
      optTBody.innerHTML = '';
  
      const optOpts = options.filter(o => !o.required && o.name && o.values.length > 0);
      optOpts.forEach(o => {
        o.values.forEach(v => {
          const tr = ce('tr', 'align-middle');
          tr.innerHTML = `
            <td><input type="checkbox" class="form-check-input _row_check"></td>
            <td>${escapeHtml(o.name)}</td>
            <td>${escapeHtml(v.name)}</td>
            <td class="_editor"><input type="text" class="form-control form-control-sm _row_price" placeholder="가격(+/-)"></td>
            <td class="_stock_item _editor"><input type="number" class="form-control form-control-sm _row_stock_now" placeholder="재고" value="0"></td>
            <td class="_stock_item _editor"><input type="number" class="form-control form-control-sm _row_stock_add" placeholder="재고추가"></td>
            <td class="_editor"><input type="text" class="form-control form-control-sm _row_sku" placeholder="SKU"></td>
            <td class="_editor">
              <select class="form-select form-select-sm _row_status">
                <option value="SALE">판매중</option>
                <option value="SOLDOUT">품절</option>
                <option value="HIDDEN">숨김</option>
              </select>
            </td>
            <td><input type="text" class="form-control form-control-sm _row_badges" placeholder="옵션 뱃지(쉼표구분)"></td>
          `;
          optTBody.appendChild(tr);
        });
      });
    }
  
    function cartesian(arr) {
      return arr.reduce((a, b) => a.flatMap(d => b.map(e => [].concat(d, e))), [[]]);
    }
  
    // ---------- 일괄수정/체크박스 ----------
    reqBulkApplyBtn?.addEventListener('click', () => {
      const rows = $$('#prod_option_detail_require_list tr');
      bulkApply(rows, {
        price: reqBulkPrice?.value,
        priceSupp: reqBulkPriceSupp?.value,
        stockAdd: reqBulkStockAdd?.value,
        status: reqBulkStatus?.value
      });
      // 적용 후 재고추가 입력 비우기(선택)
      if (reqBulkStockAdd) reqBulkStockAdd.value = '';
    });
  
    optBulkApplyBtn?.addEventListener('click', () => {
      const rows = $$('#prod_option_detail_optional_list tr');
      bulkApply(rows, {
        price: optBulkPrice?.value,
        priceSupp: optBulkPriceSupp?.value,
        stockAdd: optBulkStockAdd?.value,
        status: optBulkStatus?.value
      });
      if (optBulkStockAdd) optBulkStockAdd.value = '';
    });
  
    function bulkApply(rows, vals) {
      rows.forEach(tr => {
        const chk = $('._row_check', tr);
        if (!chk || !chk.checked) return;
  
        if (vals.price != null && vals.price !== '') $('._row_price', tr)?.setAttribute('value', vals.price), $('._row_price', tr).value = vals.price;
        if (vals.stockAdd != null && vals.stockAdd !== '') {
          const now = $('._row_stock_now', tr);
          const add = parseInt(vals.stockAdd, 10);
          if (now && !isNaN(add)) {
            const cur = parseInt(now.value || '0', 10) || 0;
            now.value = String(cur + add);
          }
        }
        if (vals.status) $('._row_status', tr)?.setAttribute('value', vals.status), $('._row_status', tr).value = vals.status;
        // 공급가(priceSupp)는 데모에선 별도 필드 미사용. 필요시 확장.
      });
    }
  
    reqCheckAll?.addEventListener('change', (e) => {
      const rows = $$('#prod_option_detail_require_list tr');
      rows.forEach(tr => {
        const cb = $('._row_check', tr);
        if (cb) cb.checked = e.target.checked;
      });
    });
    optCheckAll?.addEventListener('change', (e) => {
      const rows = $$('#prod_option_detail_optional_list tr');
      rows.forEach(tr => {
        const cb = $('._row_check', tr);
        if (cb) cb.checked = e.target.checked;
      });
    });
  
    // ---------- 초기화 ----------
    // 기존에 서버가 넣어준 옵션행이 1개라도 있으면 이벤트만 바인딩
    $$('#prod_option_list .form-group[data-optcode]').forEach(bindOptionRow);
  
    // 없으면 기본 옵션 하나 추가(UX용)
    if ($$('#prod_option_list .form-group[data-optcode]').length === 0) {
      SHOP_OPTION_MANAGE.addOption('default');
    }
  
    // “옵션 닫기/열기” 버튼 텍스트 동기화
    if (openBtn && wrap) {
      const isOpen = openBtn.getAttribute('data-isopen') === 'Y';
      wrap.style.display = isOpen ? '' : 'none';
      openBtn.textContent = isOpen ? '옵션 닫기' : '옵션 열기';
    }
  
    // 링크로 만들어진 “옵션 추가” 앵커가 있다면 기본 onclick 없이도 동작하도록 보조
    // (기존 마크업에 onclick="SHOP_OPTION_MANAGE.addOption('default')" 이 있으면 둘 다 문제 없음)
    $$('.option-setting a[href="javascript:;"], .option-setting a').forEach(a => {
      if (a.textContent.trim() === '옵션 추가' && !a._bound_add_option) {
        a.addEventListener('click', (e) => {
          // 일부 테마는 다른 핸들러가 있을 수 있으니 방지
          e.preventDefault();
          SHOP_OPTION_MANAGE.addOption('default');
        });
        a._bound_add_option = true;
      }
    });
  
  })();
  