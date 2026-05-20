/* /admin/assets/js/coupon.js */
(() => {
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    const setTxt = (el, t) => el && (el.textContent = t);
    const qs = new URLSearchParams(location.search);

    const STATUS = ['ALL', 'SCHEDULED', 'ACTIVE', 'INACTIVE', 'EXPIRED'];
    const LABEL = {
        ALL: '전체',
        SCHEDULED: '시작대기',
        ACTIVE: '활성',
        INACTIVE: '비활성',
        EXPIRED: '기간만료'
    };

    const el = {
        tabs: $('#couponTabs'),
        tbody: $('#tbodyCoupon'),
        checkAll: $('#checkAll'),
        selCount: $('#selCount'),
        pgPrev: $('#pgPrev'),
        pgNext: $('#pgNext'),
        pgNow: $('#pgNow'),
        pgTotal: $('#pgTotal'),
        keyword: $('#keyword'),
        btnSearch: $('#btnSearch'),
        btnAdvanced: $('#btnAdvanced'),
        mdAdvanced: $('#mdAdvanced'),
        advRange: $('#advRange'),
        advMemo: $('#advMemo'),
        advStatus: $('#advStatus'),
        formAdvanced: $('#formAdvanced'),
        mdDetail: $('#mdCouponDetail'),
        detailBody: $('#couponDetailBody'),
    };

    /* ===============================
     * 더미 데이터
     * =============================== */
    const DATA = [];
    for (let i = 1; i <= 25; i++) {
        DATA.push({
            id: i,
            name: `가을 쿠폰 ${i}`,
            code: `FA25-${1000 + i}`,
            discount: i % 2 ? '₩2,000' : '10%',
            from: '2025-10-01',
            to: '2025-12-31',
            memo: i % 3 ? '신규회원 전용' : '전회원',
            status: STATUS[i % 4]
        });
    }

    const state = {
        status: 'ALL', // ✅ 기본 탭을 전체로
        page: 1,
        pageSize: 10,
        selected: new Set(),
        filtered: [...DATA]
    };
    

    /* ===============================
     * 렌더링
     * =============================== */
    function renderTabs() {
        if (!el.tabs) return;
        const cnt = { ALL: DATA.length, SCHEDULED: 0, ACTIVE: 0, INACTIVE: 0, EXPIRED: 0 };
DATA.forEach(o => {
  if (cnt[o.status] !== undefined) cnt[o.status]++;
});

        el.tabs.innerHTML = STATUS.map(s => `
        <li class="nav-item">
          <button class="nav-link ${state.status === s ? 'active' : ''}" data-status="${s}">
            ${LABEL[s]} <span class="badge text-bg-primary ms-1">${cnt[s]}</span>
          </button>
        </li>`).join('');
        $$('button[data-status]', el.tabs).forEach(b => b.onclick = () => {
            state.status = b.dataset.status;
            state.page = 1;
            applyFilter();
        });
    }

    function renderTable() {
        const start = (state.page - 1) * state.pageSize;
        const rows = state.filtered.slice(start, start + state.pageSize);
        if (!el.tbody) return;
        el.tbody.innerHTML = rows.map(o => `
        <tr data-id="${o.id}">
          <td><input type="checkbox" class="rowchk form-check-input"></td>
          <td>
            <div class="fw-semibold">
    <a href="#" class="link-dark text-decoration-none" data-row-action="edit">
      ${esc(o.name)}
    </a>
  </div>
  <div class="text-body-secondary small">${esc(o.code)}</div>
          </td>
          <td class="text-center">${o.discount}</td>
          <td>${o.from} ~ ${o.to}</td>
          <td>${o.memo}</td>
          <td class="text-center"><span class="badge ${o.status === 'ACTIVE' ? 'text-bg-success' : o.status === 'INACTIVE' ? 'text-bg-secondary' : o.status === 'EXPIRED' ? 'text-bg-dark' : 'text-bg-warning'}">${LABEL[o.status]}</span></td>
          <td class="text-end">
            <div class="dropdown">
              <button class="btn btn-sm btn-light" data-bs-toggle="dropdown"><i class="ri-more-2-line"></i></button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item" href="#" data-act="detail">상세보기</a></li>
                <li><a class="dropdown-item" href="#" data-act="duplicate">복제</a></li>
                <li><a class="dropdown-item text-danger" href="#" data-act="delete">삭제</a></li>
              </ul>
            </div>
          </td>
        </tr>
      `).join('');

        // 체크박스 이벤트
        $$('#tbodyCoupon .rowchk').forEach(chk => {
            chk.onchange = e => {
                const id = Number(e.target.closest('tr').dataset.id);
                if (e.target.checked) state.selected.add(id);
                else state.selected.delete(id);
                setTxt(el.selCount, state.selected.size);
            };
        });

        // 행의 드롭다운 동작
        // 행의 드롭다운 동작 (기존 부분 교체)
        $$('#tbodyCoupon a[data-act]').forEach(a => {
            a.onclick = e => {
                e.preventDefault();
                const tr = a.closest('tr');
                const id = Number(tr.dataset.id);
                const row = DATA.find(d => d.id === id);

                switch (a.dataset.act) {
                    case 'detail':
                        el.detailBody.innerHTML = `
            <table class="table table-bordered mb-0">
              <tbody>
                <tr><th style="width:130px">쿠폰명</th><td>${esc(row.name)}</td></tr>
                <tr><th>쿠폰코드</th><td>${esc(row.code)}</td></tr>
                <tr><th>할인 혜택</th><td>${row.discount}</td></tr>
                <tr><th>사용기간</th><td>${row.from} ~ ${row.to}</td></tr>
                <tr><th>발행대상</th><td>${esc(row.memo)}</td></tr>
                <tr><th>상태</th><td><span class="badge ${row.status === 'ACTIVE' ? 'text-bg-success' :
                                row.status === 'INACTIVE' ? 'text-bg-secondary' :
                                    row.status === 'EXPIRED' ? 'text-bg-dark' : 'text-bg-warning'
                            }">${LABEL[row.status]}</span></td></tr>
                <tr><th>발행유형</th><td>${row.status === 'SCHEDULED' ? '예약 발행' :
                                row.status === 'ACTIVE' ? '자동발행' :
                                    row.status === 'INACTIVE' ? '지정발행' : '만료됨'
                            }</td></tr>
              </tbody>
            </table>`;
                        new bootstrap.Modal(el.mdDetail).show();
                        break;

                    case 'delete':
                        if (confirm('삭제하시겠습니까?')) {
                            const idx = DATA.findIndex(d => d.id === id);
                            if (idx > -1) DATA.splice(idx, 1);
                            applyFilter();
                        }
                        break;

                    case 'duplicate':
                        const copy = { ...row, id: Math.floor(Math.random() * 1e6), name: row.name + ' (복제)', status: 'SCHEDULED' };
                        DATA.unshift(copy);
                        applyFilter();
                        alert('복제되었습니다.');
                        break;
                }
            };
        });

        // 쿠폰명 클릭 시 edit 페이지로 이동
        $$('#tbodyCoupon [data-row-action="edit"]').forEach(a => {
            a.addEventListener('click', e => {
                e.preventDefault();
                const tr = a.closest('tr');
                const id = tr?.dataset?.id || '';
                // 실제 edit 폴더로 페이지 이동
                window.location.href = `edit/?id=${id}`;
            });
        }); 


    }

    function enterEditMode(row) {
        // 화면 상태 변경
        const list = document.querySelector('.admin-coupon');
        const form = document.querySelector('.admin-coupon-add');
        if (list && form) {
            list.classList.add('d-none');
            form.classList.remove('d-none');
        }

        // 헤더 타이틀 수정
        const title = document.querySelector('header .h5');
        if (title) title.textContent = '쿠폰 수정';

        // 폼 값 채우기 (간단 버전)
        const name = document.querySelector('[name="name"]');
        const benefit = document.querySelector('[name="benefit_type"]');
        const saleVal = document.querySelector('[name="apply_sale_price"]');
        const date = document.querySelector('#date');

        if (name) name.value = row.name;
        if (benefit) benefit.value = row.discount.includes('%') ? 'discount' : 'fix_price';
        if (saleVal) saleVal.value = row.discount.replace(/[₩,%]/g, '').trim();

        // flatpickr 날짜 세팅
        if (window.flatpickr && date && row.from && row.to) {
            const fp = date._flatpickr || flatpickr(date, {});
            fp.setDate([row.from, row.to]);
        }

        // 저장 버튼 문구 바꾸기
        const btn = document.querySelector('#btnAddSubmit');
        if (btn) btn.innerHTML = '<i class="ri-save-3-line me-1"></i> 수정 저장';
    }


    function bindRowActions() {
        
        // 드롭다운 메뉴 처리
        $$('#tbodyCoupon a[data-act]').forEach(a => {
            a.onclick = e => {
                e.preventDefault();
                const tr = a.closest('tr');
                const id = Number(tr.dataset.id);
                const row = DATA.find(d => d.id === id);
                if (!row) return;

                switch (a.dataset.act) {
                    case 'detail':
                        el.detailBody.innerHTML = `
                  <table class="table table-bordered mb-0">
                    <tbody>
                      <tr><th style="width:130px">쿠폰명</th><td>${esc(row.name)}</td></tr>
                      <tr><th>쿠폰코드</th><td>${esc(row.code)}</td></tr>
                      <tr><th>할인 혜택</th><td>${row.discount}</td></tr>
                      <tr><th>사용기간</th><td>${row.from} ~ ${row.to}</td></tr>
                      <tr><th>발행대상</th><td>${esc(row.memo)}</td></tr>
                      <tr><th>상태</th><td><span class="badge ${row.status === 'ACTIVE' ? 'text-bg-success' :
                                row.status === 'INACTIVE' ? 'text-bg-secondary' :
                                    row.status === 'EXPIRED' ? 'text-bg-dark' : 'text-bg-warning'
                            }">${LABEL[row.status]}</span></td></tr>
                      <tr><th>발행유형</th><td>${row.status === 'SCHEDULED' ? '예약 발행' :
                                row.status === 'ACTIVE' ? '자동발행' :
                                    row.status === 'INACTIVE' ? '지정발행' : '만료됨'
                            }</td></tr>
                    </tbody>
                  </table>`;
                        new bootstrap.Modal(el.mdDetail).show();
                        break;

                    case 'delete':
                        if (confirm('삭제하시겠습니까?')) {
                            const idx = DATA.findIndex(d => d.id === id);
                            if (idx > -1) DATA.splice(idx, 1);
                            applyFilter();
                        }
                        break;

                    case 'duplicate':
                        const copy = { ...row, id: Math.floor(Math.random() * 1e6), name: row.name + ' (복제)', status: 'SCHEDULED' };
                        DATA.unshift(copy);
                        applyFilter();
                        alert('복제되었습니다.');
                        break;
                }
            };
        });
    }



    function renderPaging() {
        const total = Math.ceil(state.filtered.length / state.pageSize) || 1;
        setTxt(el.pgNow, state.page);
        setTxt(el.pgTotal, total);
        el.pgPrev.classList.toggle('disabled', state.page <= 1);
        el.pgNext.classList.toggle('disabled', state.page >= total);
    }

    function renderAll() {
        renderTabs();
        renderTable();
        bindRowActions();
        renderPaging();
        setTxt(el.selCount, state.selected.size);
    }

    /* ===============================
     * 필터/검색
     * =============================== */
    function applyFilter() {
        const key = (el.keyword?.value || '').trim();
    
        state.filtered = DATA.filter(o =>
            (state.status === 'ALL' || o.status === state.status) &&
            (!key || o.name.includes(key) || o.memo.includes(key) || o.code.includes(key))
        );
    
        renderAll();
    }
    

    el.btnSearch?.addEventListener('click', applyFilter);
    el.btnAdvanced?.addEventListener('click', () => new bootstrap.Modal(el.mdAdvanced).show());
    el.formAdvanced?.addEventListener('submit', e => {
        e.preventDefault();
        hideModal(el.mdAdvanced);
        applyFilter();
    });

    /* ===============================
     * 페이지 이동
     * =============================== */
    el.pgPrev?.addEventListener('click', e => {
        e.preventDefault();
        if (state.page > 1) { state.page--; renderAll(); }
    });
    el.pgNext?.addEventListener('click', e => {
        e.preventDefault();
        const total = Math.ceil(state.filtered.length / state.pageSize) || 1;
        if (state.page < total) { state.page++; renderAll(); }
    });

    /* ===============================
     * 다중선택 처리
     * =============================== */
    el.checkAll?.addEventListener('change', e => {
        const c = e.target.checked;
        $$('#tbodyCoupon .rowchk').forEach(chk => {
            chk.checked = c;
            const id = Number(chk.closest('tr').dataset.id);
            if (c) state.selected.add(id); else state.selected.delete(id);
        });
        setTxt(el.selCount, state.selected.size);
    });

    $$('button[data-action]').forEach(btn => {
        btn.onclick = () => {
            const act = btn.dataset.action;
            const selected = DATA.filter(d => state.selected.has(d.id));
            if (!selected.length) return alert('선택된 쿠폰이 없습니다.');
            switch (act) {
                case 'COUPON_ACTIVATE': selected.forEach(r => r.status = 'ACTIVE'); break;
                case 'COUPON_DEACTIVATE': selected.forEach(r => r.status = 'INACTIVE'); break;
                case 'COUPON_MARK_SCHEDULED': selected.forEach(r => r.status = 'SCHEDULED'); break;
                case 'COUPON_DUPLICATE': selected.forEach(r => {
                    DATA.unshift({ ...r, id: Math.floor(Math.random() * 1e6), name: r.name + ' (복제)', status: 'SCHEDULED' });
                }); break;
                case 'COUPON_DELETE':
                    if (!confirm('삭제하시겠습니까?')) return;
                    for (const r of selected) {
                        const idx = DATA.findIndex(d => d.id === r.id);
                        if (idx > -1) DATA.splice(idx, 1);
                    }
                    state.selected.clear();
                    break;
            }
            applyFilter();
        };
    });

    /* ===============================
     * 폼 관련 (add/edit)
     * =============================== */
    const chkUnlimited = $('#chkUnlimited');
    const dateInput = $('#date');
    chkUnlimited?.addEventListener('change', () => {
        dateInput.disabled = chkUnlimited.checked;
        if (chkUnlimited.checked) dateInput.value = '';
    });

    const chkAutoUnlimited = $('#chkAutoUnlimited');
    const autoDayLimit = $('#autoDayLimit');
    chkAutoUnlimited?.addEventListener('change', () => {
        autoDayLimit.disabled = chkAutoUnlimited.checked;
        if (chkAutoUnlimited.checked) autoDayLimit.value = '';
    });

    const chkNoMemberLimit = $('#chkNoMemberLimit');
    const memberLimit = $('#memberLimitCount');
    chkNoMemberLimit?.addEventListener('change', () => {
        memberLimit.disabled = chkNoMemberLimit.checked;
        if (chkNoMemberLimit.checked) memberLimit.value = '';
    });

    /* ===============================
 * 쿠폰형식에 따른 섹션 표시
 * =============================== */
const typeRadios = $$('input[name="type"]');
const typeSections = $$('.coupon-type-section');
const autoExtra = $('.coupon-auto-only');

function showCouponType(type) {
  typeSections.forEach(sec => sec.hidden = sec.dataset.type !== type);
  if (autoExtra) autoExtra.hidden = type !== 'auto'; // ✅ 자동발행일 때만 표시
}

typeRadios.forEach(r => {
  r.addEventListener('change', e => showCouponType(e.target.value));
});

const checked = $('input[name="type"]:checked');
if (checked) showCouponType(checked.value);




    /* ===============================
 * 초기 실행
 * =============================== */
    if ($('#tbodyCoupon')) renderAll();


    /* ===============================
   * 수정 완료 후 저장 시 목록 복귀
   * =============================== */
    $('#formCouponAdd')?.addEventListener('submit', e => {
        e.preventDefault();
        alert('쿠폰이 수정되었습니다. (데모)');
        document.querySelector('.admin-coupon')?.classList.remove('d-none');
        document.querySelector('.admin-coupon-add')?.classList.add('d-none');
        const title = document.querySelector('header .h5');
        if (title) title.textContent = '쿠폰 관리';
        renderAll();
    });


    /* ===============================
     * 도움말 버튼 클릭
     * =============================== */
    $('#btnHelp')?.addEventListener('click', () => {
        const html = `
      <div class="modal fade" id="mdHelp" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="ri-question-line me-2"></i>쿠폰 관리 도움말</h5>
              <button class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <ul class="list-group list-group-flush">
                <li class="list-group-item"><strong>새 쿠폰 만들기:</strong> 우측 상단 “새 쿠폰” 버튼을 눌러 신규 쿠폰을 등록할 수 있습니다.</li>
                <li class="list-group-item"><strong>복제:</strong> 기존 쿠폰을 선택 후 “복제” 버튼으로 동일한 설정을 가진 새 쿠폰을 빠르게 생성할 수 있습니다.</li>
                <li class="list-group-item"><strong>활성/비활성:</strong> 선택한 쿠폰의 사용 상태를 전환합니다.</li>
                <li class="list-group-item"><strong>고급 검색:</strong> 날짜/상태/메모 조건으로 쿠폰을 필터링할 수 있습니다.</li>
                <li class="list-group-item"><strong>목록 필터 탭:</strong> “시작대기, 활성, 비활성, 만료” 탭별로 관리 상태를 나눠 확인할 수 있습니다.</li>
                <li class="list-group-item"><strong>상세보기:</strong> 각 행의 우측 “⋯” 버튼에서 상세 내역을 확인할 수 있습니다.</li>
              </ul>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary" data-bs-dismiss="modal">확인</button>
            </div>
          </div>
        </div>
      </div>
    `;
        document.body.insertAdjacentHTML('beforeend', html);
        new bootstrap.Modal($('#mdHelp')).show();
    });

})();
