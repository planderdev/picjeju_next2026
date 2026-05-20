document.addEventListener('DOMContentLoaded', () => {
    const $  = (s, r=document)=>r.querySelector(s);
    const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  
    const list = $('#bnTable tbody');
    const total = $('#bnCount');
    const filtered = $('#bnCountFiltered');
    const checkAll = $('#bnCheckAll');
    const rail = $$('.rail-list a');
    const modalEl = $('#modalDeleteConfirm');
    const modal = modalEl ? new bootstrap.Modal(modalEl) : null;
    const confirmBtn = $('#btnDeleteConfirm');
    let deleteIndex = null;

    if (!list) return;
  
    let banners = JSON.parse(localStorage.getItem('ADMIN_BANNERS') || '[]');
  
    /* ------------------------------
     * 데모 데이터 (최초 1회)
     * ------------------------------ */
    if (!banners.length) {
      banners = [
        {
          title: '겨울 제주 여행 프로모션',
          position: 'main',
          order: 1,
          link: 'https://picjeju.com/event/winter',
          image: '/admin/assets/img/sample-thumb.svg',
          active: true,
          start_at: '2025-11-01 00:00',
          end_at: '2025-12-31 23:59'
        },
        {
          title: '카테고리: 감귤 특가전',
          position: 'category',
          order: 2,
          link: 'https://picjeju.com/shop/jeju-mandarin',
          image: '/admin/assets/img/sample-thumb.svg',
          active: true,
          start_at: '2025-11-05 09:00',
          end_at: '2025-12-10 18:00'
        },
        {
          title: '픽제주 스토어 오픈기념 🎉',
          position: 'main',
          order: 3,
          link: 'https://picjeju.com/shop',
          image: '/admin/assets/img/sample-thumb.svg',
          active: false,
          start_at: '2025-10-01 00:00',
          end_at: '2025-10-31 23:59'
        }
      ];
      localStorage.setItem('ADMIN_BANNERS', JSON.stringify(banners));
    }
  
    /* ------------------------------
     * 렌더 함수 (필터 적용)
     * ------------------------------ */
    let currentFilter = '__ALL__';
  
    function render() {
      let visible = banners;
      if (currentFilter !== '__ALL__') visible = banners.filter(b => b.position === currentFilter);
  
      // 순서 정렬
      visible.sort((a,b)=>a.order - b.order);
  
      list.innerHTML = visible.length ? visible.map((b, i) => `
        <tr>
          <td><input class="form-check-input row-check" type="checkbox" data-index="${i}" aria-label="${b.title} 선택"></td>
          <td><img src="${b.image}" class="rounded" style="width:120px;height:auto"></td>
          <td>
            <a href="edit" class="text-decoration-none fw-semibold text-dark hover-underline">
              ${b.title}
            </a>
            <div class="small text-body-secondary">${b.link || '-'}</div>
          </td>
          <td>${b.position === 'main' ? '쇼핑몰 메인' : '카테고리 화면'}</td>
          <td class="text-center align-middle">
            <div class="d-flex justify-content-center gap-1">
              <button class="btn btn-sm btn-light border move-up" data-move="up" data-index="${i}" title="위로"><i class="ri-arrow-up-line"></i></button>
              <span class="align-self-center small text-body-secondary">${b.order || i+1}</span>
              <button class="btn btn-sm btn-light border move-down" data-move="down" data-index="${i}" title="아래로"><i class="ri-arrow-down-line"></i></button>
            </div>
          </td>
          <td>
            <div class="form-check form-switch d-inline-flex justify-content-center">
              <input class="form-check-input bn-active" type="checkbox" data-index="${i}" ${b.active ? 'checked' : ''}>
            </div>
          </td>
          <td>
            <button class="btn btn-sm btn-outline-danger" data-del="${i}">
              <i class="ri-delete-bin-line"></i>
            </button>
          </td>
        </tr>
      `).join('') : `<tr><td colspan="7" class="text-center text-muted py-4">표시할 슬라이드가 없습니다.</td></tr>`;
  
      total.textContent = banners.length;
      filtered.textContent = visible.length;
      $('#bnCountAll').textContent = banners.length;
      $('#bnCountMain').textContent = banners.filter(b=>b.position==='main').length;
      $('#bnCountCategory').textContent = banners.filter(b=>b.position==='category').length;
    }
  
    render();
  
    /* ------------------------------
     * 필터 클릭
     * ------------------------------ */
    rail.forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        rail.forEach(r => r.classList.remove('active'));
        a.classList.add('active');
        currentFilter = a.dataset.filter;
        render();
      });
    });
  
    /* ------------------------------
     * 전체선택
     * ------------------------------ */
    checkAll?.addEventListener('change', e => {
      $$('.row-check', list).forEach(chk => chk.checked = e.target.checked);
    });
  
    /* ------------------------------
     * 삭제 버튼 → 모달
     * ------------------------------ */
    list.addEventListener('click', e => {
      const btn = e.target.closest('[data-del]');
      if (btn) {
        deleteIndex = parseInt(btn.dataset.del, 10);
        modal?.show();
        return;
      }
  
      // 위/아래 이동
      const moveBtn = e.target.closest('[data-move]');
      if (moveBtn) {
        const index = parseInt(moveBtn.dataset.index, 10);
        const dir = moveBtn.dataset.move;
        if (dir === 'up' && index > 0) {
          [banners[index - 1], banners[index]] = [banners[index], banners[index - 1]];
        }
        if (dir === 'down' && index < banners.length - 1) {
          [banners[index + 1], banners[index]] = [banners[index], banners[index + 1]];
        }
        // 순서 재정렬
        banners.forEach((b, i) => b.order = i + 1);
        localStorage.setItem('ADMIN_BANNERS', JSON.stringify(banners));
        render();
        return;
      }
    });
  
    /* ------------------------------
     * 모달 삭제 확정
     * ------------------------------ */
    confirmBtn?.addEventListener('click', () => {
      if (deleteIndex === null) return;
      banners.splice(deleteIndex, 1);
      localStorage.setItem('ADMIN_BANNERS', JSON.stringify(banners));
      deleteIndex = null;
      modal?.hide();
      render();
    });
  
    /* ------------------------------
     * 활성/비활성 토글
     * ------------------------------ */
    list.addEventListener('change', e => {
      const toggle = e.target.closest('.bn-active');
      if (!toggle) return;
      const idx = parseInt(toggle.dataset.index, 10);
      banners[idx].active = toggle.checked;
      localStorage.setItem('ADMIN_BANNERS', JSON.stringify(banners));
      render();
    });
  });
  
