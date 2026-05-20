/* /assets/js/orders.js — list-only status badges + detail modal */
(() => {
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const fmt = (n) => (n || 0).toLocaleString('ko-KR');
    const money = (n) => fmt(n) + '원';
    const qs = new URLSearchParams(location.search);

    // ---- 상태 정의 (주문용) ----
    const STATUS = [
        ['ALL', '전체'],
        ['WAIT', '결제대기'],
        ['PAYMENT_CONFIRMED', '결제확인'],
        ['PREPARING', '상품준비중'],
        ['READY', '배송대기'],
        ['SHIPPING', '배송중'],
        ['DONE', '배송완료'],
        ['CANCEL_REQUEST', '취소접수'],
        ['RETURN_REQUEST', '반품접수'],
    ];
    const LABEL = Object.fromEntries(STATUS);

    // ✅ 리스트 전용 뱃지 클래스 매핑 (탭에는 적용 X)
    const BADGE = {
        WAIT: 'text-bg-secondary',
        PAYMENT_CONFIRMED: 'text-bg-primary',
        PREPARING: 'text-bg-info',
        READY: 'text-bg-warning',
        SHIPPING: 'text-bg-dark',
        DONE: 'text-bg-success',
        CANCEL_REQUEST: 'text-bg-danger',
        RETURN_REQUEST: 'text-bg-secondary'
    };

    // ---- 엘리먼트 ----
    const el = {
        tabs: $('#orderTabs'),
        btnPrintTop: $('#btnOrderPrint'), btnExportTop: $('#btnExport'),
        btnPrintM: $('#btnOrderPrint2'), btnExportM: $('#btnExport2'),
        bulkInvoice: $('#bulkInvoice'), btnHelp: $('#btnHelp'),

        keyword: $('#keyword'), btnSearch: $('#btnSearch'),
        btnAdvanced: $('#btnAdvanced'), mdAdvanced: $('#mdAdvanced'),
        advFrom: $('#advFrom'), advTo: $('#advTo'), advPay: $('#advPay'), advMemo: $('#advMemo'),
        formAdvanced: $('#formAdvanced'),

        emptyList: $('#emptyList'), loader: $('#loader'),

        tbl: $('#tblOrder'), tbody: $('#tbodyOrder'),

        checkAll: $('#checkAll'), selCount: $('#selCount'),
        pgPrev: $('#pgPrev'), pgNext: $('#pgNext'), pgNow: $('#pgNow'), pgTotal: $('#pgTotal'),

        // 상세 모달
        mdDetail: $('#mdOrderDetail'), detailBody: $('#orderDetailBody'), detailFoot: $('#detailFootNote'),
        btnDetailPreparing: $('#btnDetailPreparing'), btnDetailReady: $('#btnDetailReady'),
        btnDetailShipping: $('#btnDetailShipping'), btnDetailDone: $('#btnDetailDone')
    };

    const initTooltips = () => { if (!window.bootstrap) return; $$('[data-bs-toggle="tooltip"]').forEach(elm => { try { new bootstrap.Tooltip(elm); } catch (_) { } }); };
    const showModal = id => { if (window.bootstrap) { const m = $(id); if (m) new bootstrap.Modal(m).show(); } };

    // ---- 데모 데이터 ----
    const DEMO = (() => {
        const buyers = ['김이슬', '오정민', '박세연', '김하준', '이도윤', '최서율', '한지민', '유서연', '강나율', '문서우'];
        const paym = ['카드', '가상계좌', '계좌이체', '네이버페이', '카카오페이'];
        const arr = []; let id = 31001;
        for (let i = 0; i < 73; i++) {
            const price = 12000 + (i % 9) * 1100, qty = (i % 3) + 1;
            arr.push({
                id: id++,
                orderNo: 'O' + (2025091000 + i),
                orderedAt: `2025-09-${String((i % 28) + 1).padStart(2, '0')} ${String(9 + (i % 10)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
                buyer: buyers[i % buyers.length],
                phone: '010-' + String(1000 + (i % 9000)) + '-' + String(1000 + ((i * 7) % 9000)),
                productName: '상품 ' + (i % 12 + 1),
                productImg: `/admin/assets/img/sample-thumb.svg`,
                price, qty, payMethod: paym[i % paym.length],
                status: STATUS[(i % (STATUS.length - 1)) + 1][0], // skip ALL
                invoice: (i % 2) ? 'CJ 1234-5678-90' : '-',
                memo: (i % 5) ? '' : '고객 메모 있음',
                payTotal: price * qty
            });
        }
        return arr;
    })();

    // ---- 상태 ----
    const state = {
        all: DEMO,
        status: qs.get('status') || 'ALL',
        page: 1, pageSize: 10,
        selected: new Set(),
        keyword: '',
        adv: { from: '', to: '', pay: '', memo: '' },
        filtered: [],
        detailId: null
    };

    const show = (n, y) => n && n.classList.toggle('d-none', !y);
    const setTxt = (n, t) => n && (n.textContent = t);

    // ---- 탭 렌더 (탭의 배지는 항상 primary) ----
    function renderTabs() {
        const counts = Object.fromEntries(STATUS.map(([k]) => [k, 0]));
        state.all.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; counts.ALL = (counts.ALL || 0) + 1; });

        el.tabs.innerHTML = STATUS.map(([k, label]) => `
        <li class="nav-item flex-shrink-0">
          <button class="nav-link ${state.status === k ? 'active' : ''}" data-status="${k}">
            ${label} <span class="badge text-bg-primary ms-1">${counts[k] || 0}</span>
          </button>
        </li>`).join('');

        $$('#orderTabs [data-status]').forEach(btn => {
            btn.addEventListener('click', () => {
                state.status = btn.dataset.status; state.page = 1; applyFilters(); paint();
                const url = new URL(location.href); url.searchParams.set('status', state.status); history.replaceState(null, '', url);
            });
        });
    }

    // ---- 필터 ----
    function applyFilters() {
        const k = (state.keyword || '').trim().toLowerCase();
        let list = state.all.filter(o => state.status === 'ALL' || o.status === state.status);

        if (k) {
            list = list.filter(o => (
                o.orderNo + o.buyer + o.phone + o.productName + (o.invoice || '') + (o.memo || '')
            ).toLowerCase().includes(k));
        }
        if (state.adv.from) list = list.filter(o => o.orderedAt >= state.adv.from);
        if (state.adv.to) list = list.filter(o => o.orderedAt <= state.adv.to + ' 23:59');
        if (state.adv.pay) list = list.filter(o => o.payMethod === state.adv.pay);
        if (state.adv.memo) { const m = state.adv.memo.toLowerCase(); list = list.filter(o => (o.memo || '').toLowerCase().includes(m)); }

        state.filtered = list;
        state.selected.clear();
        if (el.checkAll) el.checkAll.checked = false;
    }

    // ---- 테이블 렌더 ----
    function renderTable() {
        const start = (state.page - 1) * state.pageSize;
        const rows = state.filtered.slice(start, start + state.pageSize);
        show(el.emptyList, !rows.length);

        el.tbody.innerHTML = rows.map(o => `
      <tr data-id="${o.id}">
        <td><input type="checkbox" class="rowchk form-check-input"></td>
        <td>
          <div class="fw-semibold"><a href="#" class="link-dark" data-id="${o.id}">${o.orderNo}</a></div>
          <div class="text-body-secondary small">${o.orderedAt}</div>
        </td>
        <td class="text-center" style="width:76px">
          <img src="${o.productImg}" alt="" style="width:72px;height:54px;object-fit:cover;border-radius:6px">
        </td>
        <td>
          <div class="fw-semibold"><a href="#" class="link-dark" data-id="${o.id}">${o.productName}</a></div>
          <div class="text-body-secondary small">${o.buyer} · ${o.phone}</div>
        </td>
        <td class="text-end">${money(o.payTotal)}</td>
        <td class="text-center">${o.payMethod}</td>
        <td class="text-center"><span class="badge ${BADGE[o.status] || 'text-bg-secondary'}">${LABEL[o.status] || o.status}</span></td>
        <td class="text-center">${o.invoice || '-'}</td>
        <td class="text-center">${o.memo || '-'}</td>
        <td class="text-end"> 
            <button class="btn btn-sm btn-light" data-bs-toggle="dropdown"><i class="ri-more-2-line"></i></button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><a class="dropdown-item" href="#" data-row-act="DETAIL">상세보기</a></li>
              <li><a class="dropdown-item" href="#" data-row-act="TO_DONE">배송완료 처리</a></li>
            </ul> 
        </td>
      </tr>`).join('');

        // 선택
        $$('#tbodyOrder .rowchk').forEach(chk => {
            chk.addEventListener('change', e => {
                const id = Number(e.target.closest('tr').dataset.id);
                if (e.target.checked) state.selected.add(id); else state.selected.delete(id);
                setTxt(el.selCount, state.selected.size);
                if (el.checkAll) { el.checkAll.checked = $$('#tbodyOrder .rowchk').every(c => c.checked) && state.filtered.length > 0; }
            });
        });

        // 행 액션
        $$('#tbodyOrder [data-row-act="DETAIL"]').forEach(a => {
            a.addEventListener('click', e => {
                e.preventDefault();
                openDetail(Number(a.closest('tr').dataset.id));
            });
        });
        $$('#tbodyOrder [data-row-act="TO_DONE"]').forEach(a => {
            a.addEventListener('click', e => {
                e.preventDefault();
                const id = Number(a.closest('tr').dataset.id);
                const item = state.all.find(x => x.id === id); if (!item) return;
                if (!confirm('이 주문을 배송완료 처리할까요?')) return;
                item.status = 'DONE';
                refresh('배송완료 처리 완료');
            });
        });

        // ✅ 주문번호·상품명 클릭 시 상세보기 모달 열기
        $$('#tbodyOrder .link-dark, #tbodyOrder .product-link').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const id = Number(link.dataset.id);
                openDetail(id);
            });
        });
    }


    // ---- 페이징 ----
    function renderPaging() {
        const total = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
        setTxt(el.pgNow, state.page); setTxt(el.pgTotal, total);
        el.pgPrev?.classList.toggle('disabled', state.page <= 1);
        el.pgNext?.classList.toggle('disabled', state.page >= total);
    }

    // ---- paint (탭도 함께 갱신해서 카운트/active 유지) ----
    function paint() {
        renderTabs();
        show(el.loader, true);
        setTimeout(() => {
            show(el.loader, false);
            renderTable();
            renderPaging();
            setTxt(el.selCount, state.selected.size);
            initTooltips();
        }, 250);
    }

    // ---- 일괄 처리 ----
    const ACTION_LABEL = {
        ORDER_PAYMENT_CONFIRMED: '결제확인', ORDER_PREPARING: '상품준비중', ORDER_READY: '배송대기',
        ORDER_SHIPPING: '배송중', ORDER_DONE: '배송완료',
        RESTORE_WAIT: '입금대기로 되돌리기', ORDER_CANCEL_REQUEST: '취소접수',
        ORDER_RETURN_REQUEST: '반품접수', ORDER_EXPORT_SELECTED: '선택 내보내기'
    };
    function runBulk(action) {
        const ids = [...state.selected];
        if (!ids.length) return alert('처리할 주문을 선택하세요.');
        const label = ACTION_LABEL[action] || action;
        if (!confirm(`선택한 ${ids.length}건에 대해 [${label}]을(를) 실행할까요?`)) return;

        const set = new Set(ids);
        state.all = state.all.map(o => {
            if (!set.has(o.id)) return o;
            switch (action) {
                case 'ORDER_PAYMENT_CONFIRMED': o.status = 'PAYMENT_CONFIRMED'; break;
                case 'ORDER_PREPARING': o.status = 'PREPARING'; break;
                case 'ORDER_READY': o.status = 'READY'; break;
                case 'ORDER_SHIPPING': o.status = 'SHIPPING'; break;
                case 'ORDER_DONE': o.status = 'DONE'; break;
                case 'RESTORE_WAIT': o.status = 'WAIT'; break;
                case 'ORDER_CANCEL_REQUEST': o.status = 'CANCEL_REQUEST'; break;
                case 'ORDER_RETURN_REQUEST': o.status = 'RETURN_REQUEST'; break;
                case 'ORDER_EXPORT_SELECTED':  /* 실제 내보내기는 우측 버튼 사용 */ break;
            } return o;
        });
        refresh(`[${label}] 완료`);
    }
    function refresh(msg) { applyFilters(); paint(); if (msg) alert(msg); }

    // ---- 상세 모달 (데모) ----
    function openDetail(id) {
        state.detailId = id;
        const o = state.all.find(x => x.id === id); if (!o) return;
        el.detailBody.innerHTML = `
        <div class="row g-3">
          <div class="col-md-7">
            <div class="d-flex gap-3">
              <img src="${o.productImg}" style="width:120px;height:90px;object-fit:cover;border-radius:8px">
              <div>
                <div class="fw-semibold">${o.productName}</div>
                <div class="text-body-secondary small">주문번호 ${o.orderNo} · ${o.orderedAt}</div>
                <div class="mt-1">상태: <span class="badge ${BADGE[o.status] || 'text-bg-secondary'}">${LABEL[o.status] || o.status}</span></div>
              </div>
            </div>
            <hr>
            <dl class="row mb-0">
              <dt class="col-4 col-md-3">구매자</dt><dd class="col-8 col-md-9">${o.buyer} (${o.phone})</dd>
              <dt class="col-4 col-md-3">결제수단</dt><dd class="col-8 col-md-9">${o.payMethod}</dd>
              <dt class="col-4 col-md-3">송장번호</dt><dd class="col-8 col-md-9">${o.invoice || '-'}</dd>
              <dt class="col-4 col-md-3">메모</dt><dd class="col-8 col-md-9">${o.memo || '-'}</dd>
            </dl>
          </div>
          <div class="col-md-5">
            <div class="card">
              <div class="card-header"><h6 class="mb-0">금액 정보</h6></div>
              <div class="card-body">
                <div class="d-flex justify-content-between"><span>상품금액</span><strong>${money(o.price)}</strong></div>
                <div class="d-flex justify-content-between"><span>수량</span><strong>${o.qty}</strong></div>
                <hr>
                <div class="d-flex justify-content-between"><span>결제금액</span><strong class="fs-5">${money(o.payTotal)}</strong></div>
              </div>
            </div>
          </div>
        </div>`;
        setTxt(el.detailFoot, `ID #${o.id}`);
        showModal('#mdOrderDetail');
    }

    // ---- 바인딩 ----
    function bind() {
        // 출력/내보내기
        const exportCSV = () => {
            if (!state.filtered.length) return alert('내보낼 데이터가 없습니다.');
            const headers = ['주문번호', '주문시각', '구매자', '연락처', '상품명', '결제금액', '결제수단', '상태', '송장', '메모'];
            const rows = state.filtered.map(o => [
                o.orderNo, o.orderedAt, o.buyer, o.phone, o.productName, o.payTotal, o.payMethod, (LABEL[o.status] || o.status), o.invoice || '', o.memo || ''
            ]);
            const needs = /["\n,]/, dbl = /"/g;
            const esc = s => { s = String(s ?? ''); return needs.test(s) ? '"' + s.replace(dbl, '""') + '"' : s; };
            const csv = '\uFEFF' + [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\r\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'orders_' + Date.now() + '.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        };
        el.btnPrintTop?.addEventListener('click', () => window.print());
        el.btnPrintM?.addEventListener('click', () => window.print());
        el.btnExportTop?.addEventListener('click', exportCSV);
        el.btnExportM?.addEventListener('click', exportCSV);

        // 송장 일괄 등록 (데모)
        el.bulkInvoice?.addEventListener('change', () => {
            if (!el.bulkInvoice.files?.length) return;
            alert('CSV 파싱은 실제 연동 시 구현하세요. (데모)');
            el.bulkInvoice.value = '';
        });

        // 도움말
        el.btnHelp?.addEventListener('click', () => alert('결제확인 → 상품준비중 → 배송대기 → 배송중 → 배송완료 순서로 처리합니다.\n취소/반품 접수는 해당 탭에서도 확인하세요.'));

        // 검색
        el.btnSearch?.addEventListener('click', e => {
            e.preventDefault(); state.keyword = el.keyword?.value || ''; state.page = 1; applyFilters(); paint();
        });
        el.keyword?.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); el.btnSearch.click(); }
        });

        // 고급 검색
        el.btnAdvanced?.addEventListener('click', () => { if (window.bootstrap && el.mdAdvanced) new bootstrap.Modal(el.mdAdvanced).show(); });
        el.formAdvanced?.addEventListener('submit', e => {
            e.preventDefault();
            state.adv.from = el.advFrom?.value || ''; state.adv.to = el.advTo?.value || '';
            state.adv.pay = el.advPay?.value || ''; state.adv.memo = el.advMemo?.value || '';
            if (window.bootstrap && el.mdAdvanced) bootstrap.Modal.getInstance(el.mdAdvanced)?.hide();
            state.page = 1; applyFilters(); paint();
        });

        // 전체선택
        el.checkAll?.addEventListener('change', () => {
            const checked = !!el.checkAll.checked; state.selected.clear();
            $$('#tbodyOrder .rowchk').forEach(c => {
                c.checked = checked; const id = Number(c.closest('tr')?.dataset.id);
                if (checked && id) state.selected.add(id);
            });
            setTxt(el.selCount, state.selected.size);
        });

        // 페이징
        el.pgPrev?.addEventListener('click', e => { e.preventDefault(); if (state.page > 1) { state.page--; paint(); } });
        el.pgNext?.addEventListener('click', e => { e.preventDefault(); const total = Math.max(1, Math.ceil(state.filtered.length / state.pageSize)); if (state.page < total) { state.page++; paint(); } });

        // 일괄 액션
        $$('[data-action]').forEach(btn => btn.addEventListener('click', e => { e.preventDefault(); runBulk(btn.dataset.action); }));

        // 상세 모달 버튼
        el.btnDetailPreparing?.addEventListener('click', () => { const o = state.all.find(x => x.id === state.detailId); if (!o) return; o.status = 'PREPARING'; refresh('상품준비중 처리'); });
        el.btnDetailReady?.addEventListener('click', () => { const o = state.all.find(x => x.id === state.detailId); if (!o) return; o.status = 'READY'; refresh('배송대기 처리'); });
        el.btnDetailShipping?.addEventListener('click', () => { const o = state.all.find(x => x.id === state.detailId); if (!o) return; o.status = 'SHIPPING'; refresh('배송중 처리'); });
        el.btnDetailDone?.addEventListener('click', () => { const o = state.all.find(x => x.id === state.detailId); if (!o) return; o.status = 'DONE'; refresh('배송완료 처리'); });
    }

    // ---- 초기화 ----
    function init() {
        if (!LABEL[state.status]) state.status = 'ALL';
        applyFilters(); bind(); paint();
    }
    init();
})();
