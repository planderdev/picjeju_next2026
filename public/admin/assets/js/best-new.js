// /admin/assets/js/best-new.js
document.addEventListener('DOMContentLoaded', () => {
  
    const $  = (s, r=document)=>r.querySelector(s);
    const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  
    const products = Array.isArray(window.DUMMY_PRODUCTS) ? window.DUMMY_PRODUCTS : [];
  
    const searchInput   = $('#bnProdSearch');
    const categorySelect= $('#bnProdCategory');
    const labelSelect   = $('#bnProdLabel');
    const resultList    = $('#bnProdResultList');
    const resultCount   = $('#bnProdResultCount');
  
    const sectionTabs   = $$('.card-header [data-section]');
    const sectionList   = $('#bnSectionList');
    const sectionCount  = $('#bnSectionCount');
    const resetBtn      = $('#bnSectionReset');
  
    const removeModalEl = $('#bnModalRemove');
    const removeModal   = removeModalEl ? new bootstrap.Modal(removeModalEl) : null;
    const removeConfirmBtn = $('#bnBtnRemoveConfirm');
  
    const STORAGE_KEY = 'ADMIN_BESTNEW_SECTIONS';
  
    // 상태: 섹션별 상품 ID 배열
    let state = {
      main_best: [],
      main_new: [],
      cat_best: [],
      cat_new: []
    };
  
    // 로컬스토리지에서 읽기
    function loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          state = { ...state, ...parsed };
        } else {
          // 처음엔 데모용으로 적당히 채워줌
          state.main_best = [1001, 1002, 1003];
          state.main_new  = [1003, 1005];
          state.cat_best  = [1001, 1004];
          state.cat_new   = [1003, 1002];
          saveState();
        }
      } catch (e) {
        console.warn('failed to load section state', e);
      }
    }
  
    function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  
    loadState();
  
    let currentSection = 'main_best';
    let pendingRemoveIndex = null; // 섹션 배열 내 index
  
    function findProduct(id) {
      return products.find(p => String(p.id) === String(id));
    }
  
    // ==================== 상품 검색 / 좌측 리스트 ====================
    function filterProducts() {
      const q = (searchInput.value || '').trim().toLowerCase();
      const cat = categorySelect.value;
      const label = labelSelect.value;
  
      return products.filter(p => {
        if (cat && p.category !== cat) return false;
        if (label && (!Array.isArray(p.labels) || !p.labels.includes(label))) return false;
        if (!q) return true;
        const hay = (p.name + ' ' + p.brand).toLowerCase();
        return hay.includes(q);
      });
    }
  
    function renderSearchList() {
      const rows = filterProducts();
      resultCount.textContent = rows.length;
  
      if (!rows.length) {
        resultList.innerHTML = `<div class="text-center text-body-secondary py-3">검색 결과가 없습니다.</div>`;
        return;
      }
  
      resultList.innerHTML = rows.map(p => {
        const labels = (p.labels || []).map(l => `
          <span class="badge rounded-pill ${l === 'BEST' ? 'text-bg-danger' : 'text-bg-success'} me-1">${l}</span>
        `).join('');
  
        return `
          <div class="list-group-item d-flex align-items-center justify-content-between gap-2">
            <div class="d-flex align-items-center gap-2">
              <img src="${p.thumbnail}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:8px;">
              <div>
                <div class="fw-semibold small mb-1">${p.name}</div>
                <div class="small text-body-secondary">
                  ${p.brand} · ${p.category || '-'}
                </div>
                <div class="small">
                  <strong>${p.price_sale.toLocaleString()}원</strong>
                  <span class="text-body-secondary text-decoration-line-through ms-1">${p.price_original.toLocaleString()}원</span>
                  <span class="text-danger ms-1">${p.discount_percent}%</span>
                </div>
                <div class="small mt-1">${labels}</div>
              </div>
            </div>
            <button type="button" class="btn btn-sm btn-outline-primary" data-add="${p.id}">
              추가
            </button>
          </div>
        `;
      }).join('');
    }
  
    renderSearchList();
  
    searchInput?.addEventListener('input', renderSearchList);
    categorySelect?.addEventListener('change', renderSearchList);
    labelSelect?.addEventListener('change', renderSearchList);
  
    resultList?.addEventListener('click', e => {
      const btn = e.target.closest('[data-add]');
      if (!btn) return;
      const id = parseInt(btn.dataset.add, 10);
      const arr = state[currentSection] || (state[currentSection] = []);
      if (!arr.includes(id)) {
        arr.push(id);
        saveState();
        renderSection();
      }
    });
  
    // ==================== 섹션 탭 / 우측 리스트 ====================
    sectionTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        sectionTabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSection = btn.dataset.section;
        renderSection();
      });
    });
  
    function renderSection() {
      const ids = state[currentSection] || [];
      sectionCount.textContent = ids.length;
  
      if (!ids.length) {
        sectionList.innerHTML = `
          <tr>
            <td colspan="6" class="text-center text-body-secondary py-4">
              이 섹션에 진열된 상품이 없습니다.<br>
              왼쪽에서 상품을 검색해 추가해주세요.
            </td>
          </tr>`;
        return;
      }
  
      sectionList.innerHTML = ids.map((id, index) => {
        const p = findProduct(id);
        if (!p) return '';
  
        const labels = (p.labels || []).map(l => `
          <span class="badge rounded-pill ${l === 'BEST' ? 'text-bg-danger' : 'text-bg-success'} me-1">${l}</span>
        `).join('');
  
        const price = `${p.price_sale.toLocaleString()}원`;
  
        return `
          <tr data-index="${index}">
            <td class="text-center">
              <div class="d-flex flex-column align-items-center gap-1">
                <button type="button" class="btn btn-sm btn-light border move-up" ${index === 0 ? 'disabled' : ''}>
                  <i class="ri-arrow-up-line"></i>
                </button>
                <span class="small text-body-secondary">${index + 1}</span>
                <button type="button" class="btn btn-sm btn-light border move-down" ${index === ids.length - 1 ? 'disabled' : ''}>
                  <i class="ri-arrow-down-line"></i>
                </button>
              </div>
            </td>
            <td>
              <img src="${p.thumbnail}" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:12px;">
            </td>
            <td>
              <div class="fw-semibold small">${p.name}</div>
              <div class="small text-body-secondary">${p.brand} · ${p.category || '-'}</div>
              <div class="small mt-1">${labels}</div>
            </td>
            <td>
              <div class="small fw-semibold">${price}</div>
            </td>
            <td>
              ${labels || '<span class="text-body-secondary small">-</span>'}
            </td>
            <td class="text-end">
              <button type="button" class="btn btn-sm btn-outline-danger bn-remove">
                <i class="ri-close-line"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  
    renderSection();
  
    // 순서 이동 & 제거
    sectionList?.addEventListener('click', e => {
      const row = e.target.closest('tr[data-index]');
      if (!row) return;
      const idx = parseInt(row.dataset.index, 10);
      const ids = state[currentSection];
  
      // 위/아래
      if (e.target.closest('.move-up') && idx > 0) {
        [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
        saveState();
        renderSection();
        return;
      }
      if (e.target.closest('.move-down') && idx < ids.length - 1) {
        [ids[idx + 1], ids[idx]] = [ids[idx], ids[idx + 1]];
        saveState();
        renderSection();
        return;
      }
  
      // 제거
      if (e.target.closest('.bn-remove')) {
        pendingRemoveIndex = idx;
        removeModal?.show();
      }
    });
  
    removeConfirmBtn?.addEventListener('click', () => {
      if (pendingRemoveIndex == null) return;
      const ids = state[currentSection];
      ids.splice(pendingRemoveIndex, 1);
      pendingRemoveIndex = null;
      saveState();
      removeModal?.hide();
      renderSection();
    });
  
    // 초기화(데모 데이터 복원)
    resetBtn?.addEventListener('click', () => {
      if (!confirm('데모 데이터로 초기화하시겠습니까?\n현재 설정한 섹션 진열 순서는 모두 사라집니다.')) return;
      localStorage.removeItem(STORAGE_KEY);
      loadState();
      renderSection();
    });
  });
  