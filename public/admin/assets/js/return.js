/* /admin/assets/js/return.js
 * imweb admin - 반품 관리 전용 컨트롤러 (레이아웃 통일 버전)
 * 요구사항: 탭/카운트, 검색/고급검색, 선택/일괄처리, 페이지네이션,
 *          빈상태/로더, 주문서 출력, CSV 내보내기, 도움말
 */
(() => {
    // ===== 공통 유틸 =====
    const $  = (s, r=document) => r.querySelector(s);
    const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
    const fmt = (n) => (n || 0).toLocaleString('ko-KR');
    const money = (n) => fmt(n) + '원';
    const qs = new URLSearchParams(location.search);
  
    // Bootstrap helpers (optional)
    const initTooltips = () => {
      if (!window.bootstrap) return;
      $$('[data-bs-toggle="tooltip"]').forEach(el => {
        try { new bootstrap.Tooltip(el); } catch(e){}
      });
    };
    const showModal = (id) => {
      if (!window.bootstrap) return;
      const el = $(id);
      if (el) new bootstrap.Modal(el).show();
    };
  
    // ===== 상태/라벨 =====
    const STATUS_LABEL = {
        ALL: '전체',
      NEW: '신규반품',
      RETURN_REQUEST: '반품요청',
      RETURN_COLLECTING: '수거중',
      RETURN_COLLECT_DONE: '수거완료',
      RETURN_REFUNDING: '환불진행중',
      RETURN_REFUND_FAILED: '환불처리실패',
      RETURN: '반품완료'
    };
    // ===== 상태별 색상 클래스 =====
const BADGE_CLASS = { 
    NEW: 'text-bg-secondary',       // 신규반품
    RETURN_REQUEST: 'text-bg-primary', // 반품요청
    RETURN_COLLECTING: 'text-bg-info', // 수거중
    RETURN_COLLECT_DONE: 'text-bg-warning', // 수거완료
    RETURN_REFUNDING: 'text-bg-success', // 환불진행중
    RETURN_REFUND_FAILED: 'text-bg-danger', // 환불처리실패
    RETURN: 'text-bg-success'          // 반품완료 (Bootstrap 5.3 이상에 teal이 없으면 success나 custom class)
  };
  
    const STATUS_ORDER = [
       'ALL', 'NEW','RETURN_REQUEST','RETURN_COLLECTING','RETURN_COLLECT_DONE','RETURN_REFUNDING','RETURN_REFUND_FAILED','RETURN'
    ];
  
    // ===== DOM 핸들 =====
    const el = {
      tabs: $('#returnTabs'),
      btnPrintTop:  $('#btnOrderPrint'),
      btnExportTop: $('#btnExport'),
      btnPrintM:    $('#btnOrderPrint2'),
      btnExportM:   $('#btnExport2'),
      btnHelp:      $('#btnHelp'),
      keyword:      $('#keyword'),
      btnSearch:    $('#btnSearch'),
      btnAdvanced:  $('#btnAdvanced'),
      mdAdvanced:   $('#mdAdvanced'),
      advFrom:      $('#advFrom'),
      advTo:        $('#advTo'),
      advStatus:    $('#advStatus'),
      advCollect:   $('#advCollectMethod'),
      advMemo:      $('#advMemo'),
      advMin:       $('#advMinTotal'),
      advMax:       $('#advMaxTotal'),
      formAdvanced: $('#formAdvanced'),
  
      emptyNew:  $('#emptyNew'),
      emptyList: $('#emptyList'),
      loader:    $('#loader'),
      jumpDone:  $('#jumpDone'),
  
      tbl:       $('#tblReturn'),
      tbody:     $('#tbodyReturn'),
      checkAll:  $('#checkAll'),
      selCount:  $('#selCount'),
      pgPrev:    $('#pgPrev'),
      pgNext:    $('#pgNext'),
      pgNow:     $('#pgNow'),
      pgTotal:   $('#pgTotal'),
    };
  
    // ===== 데모 데이터 =====
const DEMO = (() => {
    const names = ['김이슬','오정민','박세연','김하준','이도윤','최서율','한지민','유서연','강나율','문서우'];
    const prods = [
      ['밤호박 2kg','/admin/assets/img/sample-thumb.svg'],
      ['무농약 감귤 3kg','/admin/assets/img/sample-thumb.svg'],
      ['천혜향 2kg','/admin/assets/img/sample-thumb.svg'],
      ['레드비트 1kg','/admin/assets/img/sample-thumb.svg'],
      ['당근 5kg','/admin/assets/img/sample-thumb.svg'],
    ];
    // ✅ "ALL" 제외한 상태 목록만 사용
    const sts = STATUS_ORDER.slice(1);
    const arr = [];
    let id = 21001;
    for (let i=0; i<57; i++){
      const [pn, img] = prods[i % prods.length];
      const price = 7900 + (i % 7) * 900;
      const qty = (i % 3) + 1;
      arr.push({
        id: id++,
        orderNo: 'R' + (2025091000 + i),
        orderedAt: `2025-09-${String((i % 28) + 1).padStart(2,'0')} ${String(10 + (i % 8)).padStart(2,'0')}:${String(i % 60).padStart(2,'0')}`,
        buyer: names[i % names.length],
        phone: '010-' + String(1000 + (i % 9000)) + '-' + String(1000 + ((i * 3) % 9000)),
        productName: pn,
        productImg: img,
        price,
        qty,
        status: sts[i % sts.length], // ✅ 전체(ALL)는 절대 데이터에 포함되지 않음
        collectMethod: (i % 2) ? '택배수거' : '직접발송',
        reason: (i % 3) ? '단순변심' : '상품하자',
        extraFee: (i % 4) ? 0 : 3000,
        collectInfo: '제주시 애월읍 123-4 3층',
        refundInfo: (i % 5) ? '카드전체취소' : '부분환불',
        shippingInfo: (i % 2) ? '대한통운 1234-5678-9012' : '우체국 9988-7766-5522',
        payTotal: price * qty,
        memo: (i % 4) ? '' : '박스 파손'
      });
    }
    return arr;
  })();
  
  
    // ===== 전역 상태 =====
    const state = {
      all: DEMO,
      status: qs.get('status') || 'ALL',
      page: 1,
      pageSize: 10,
      selected: new Set(),
      keyword: '',
      adv: {
        from: '', to: '', statuses: new Set(), collectMethod: '', memo: '',
        minTotal: '', maxTotal: ''
      },
      filtered: []
    };
  
    // ===== 뷰 스위칭 =====
    const show = (el, yes) => { if (el) el.classList.toggle('d-none', !yes); };
    const setText = (el, txt) => { if (el) el.textContent = txt; };
  
    // ===== 탭 렌더링 & 카운트 =====
    function countByStatus(){
        const map = Object.fromEntries(STATUS_ORDER.map(s => [s, 0]));
        state.all.forEach(o => {
          if (map[o.status] != null) map[o.status]++; // 개별 상태 카운트
          map.ALL++; // ✅ 전체 카운트 추가
        });
        return map;
      }
      
      function renderTabs(){
        const cnt = countByStatus();
        el.tabs.innerHTML = STATUS_ORDER.map(s => `
          <li class="nav-item flex-shrink-0">
            <button class="nav-link ${state.status===s?'active':''}" data-status="${s}">
              ${STATUS_LABEL[s]} <span class="badge text-bg-primary ms-1">${cnt[s]||0}</span>
            </button>
          </li>
        `).join('');
      
        $$('button[data-status]', el.tabs).forEach(btn => {
          btn.addEventListener('click', () => {
            state.status = btn.dataset.status;
            state.page = 1;
            applyFilters();
            renderAll();
            const url = new URL(location.href);
            url.searchParams.set('status', state.status);
            history.replaceState(null, '', url);
          });
        });
      }
      
  
    // ===== 필터링 =====
    function applyFilters(){
        const k = (state.keyword||'').trim().toLowerCase();
        const A = state.adv;
        // ✅ 전체일 경우 모든 데이터 포함
        let list = state.status === 'ALL' ? state.all.slice() : state.all.filter(o => o.status === state.status);
      
        if (k){
          list = list.filter(o =>
            o.orderNo.toLowerCase().includes(k) ||
            o.buyer.toLowerCase().includes(k) ||
            o.phone.toLowerCase().includes(k) ||
            o.productName.toLowerCase().includes(k)
          );
        }
        if (A.from) list = list.filter(o => o.orderedAt >= A.from);
        if (A.to)   list = list.filter(o => o.orderedAt <= A.to + ' 23:59');
        if (A.statuses.size) list = list.filter(o => A.statuses.has(o.status));
        if (A.collectMethod) list = list.filter(o => o.collectMethod === A.collectMethod);
        if (A.memo){
          const m = A.memo.toLowerCase();
          list = list.filter(o => (o.memo||'').toLowerCase().includes(m) || (o.reason||'').toLowerCase().includes(m));
        }
        if (A.minTotal) list = list.filter(o => o.payTotal >= Number(A.minTotal));
        if (A.maxTotal) list = list.filter(o => o.payTotal <= Number(A.maxTotal));
      
        state.filtered = list;
        state.selected.clear();
        if (el.checkAll) el.checkAll.checked = false;
      }
      
  
    // ===== 테이블 렌더링 =====
    function renderTable(){
      const start = (state.page-1)*state.pageSize;
      const rows = state.filtered.slice(start, start + state.pageSize);
  
      // 빈/리스트 토글
      if (!rows.length){
        show(el.loader, false);
        // NEW 일 때는 emptyNew, 그 외에는 emptyList
        show(el.emptyNew, state.status==='NEW');
        show(el.emptyList, state.status!=='NEW');
      } else {
        show(el.emptyNew, false);
        show(el.emptyList, false);
      }
  
      el.tbody.innerHTML = rows.map(o => `
        <tr data-id="${o.id}">
          <td><input type="checkbox" class="rowchk form-check-input"></td>
          <td>
            <div class="fw-semibold text-dark " role="button">${o.orderNo}</div> 
            <div class="text-body-secondary small">${o.orderedAt}</div>
          </td>
          <td class="text-center" style="width:76px">
            <img src="${o.productImg}" alt="" style="width:72px;height:54px;object-fit:cover;border-radius:6px">
          </td>
          <td>
            <div class="fw-semibold text-dark" role="button">${o.productName}</div> 
            <div class="text-body-secondary small">${o.buyer} · ${o.phone}</div>
          </td>
          <td class="text-end">${money(o.price)}</td>
          <td class="text-center">${o.qty}</td>
         <td class="text-center">
  <span class="badge ${BADGE_CLASS[o.status] || 'text-bg-secondary'}">
    ${STATUS_LABEL[o.status]}
  </span>
</td>

          <td class="text-center">${o.collectMethod}</td>
          <td class="text-center">${o.reason}</td>
          <td class="text-center">${o.extraFee? money(o.extraFee): '-'}</td>
          <td class="text-center">${o.collectInfo}</td>
          <td class="text-center">${o.refundInfo}</td>
          <td class="text-center">${o.shippingInfo}</td>
          <td class="text-center fw-semibold">${money(o.payTotal)}</td>
          <td class="text-end"> 
              <button class="btn btn-sm btn-light" data-bs-toggle="dropdown"><i class="ri-more-2-line"></i></button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item" href="#">상세보기</a></li>
                <li><a class="dropdown-item text-danger" href="#" data-action="RETURN_DONE_ONE">반품완료 처리</a></li>
              </ul> 
          </td>
        </tr>
      `).join('');
  
      // 체크 바인딩
      $$('#tbodyReturn .rowchk').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const id = Number(e.target.closest('tr')?.dataset.id);
          if (!id) return;
          if (e.target.checked) state.selected.add(id);
          else state.selected.delete(id);
          setText(el.selCount, state.selected.size);
          if (el.checkAll) {
            const pageSizeChecked = $$('#tbodyReturn .rowchk').every(c => c.checked);
            el.checkAll.checked = pageSizeChecked && state.filtered.length>0;
          }
        });
      });
  
      // 관리 드롭다운 - 단건 액션 예시
      $$('#tbodyReturn [data-action="RETURN_DONE_ONE"]').forEach(a => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          const tr = a.closest('tr');
          const id = Number(tr?.dataset.id);
          if (!id) return;
          if (!confirm('이 주문을 반품완료 처리할까요?')) return;
          // 상태 변경
          const item = state.all.find(x => x.id===id);
          if (item) item.status = 'RETURN';
          refreshAfterAction('반품완료 처리 완료');
        });
      });
    }
  
    // ===== 페이지네이션 =====
    function renderPaging(){
      const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
      setText(el.pgNow, state.page);
      setText(el.pgTotal, totalPages);
      const canPrev = state.page>1;
      const canNext = state.page<totalPages;
  
      el.pgPrev?.classList.toggle('disabled', !canPrev);
      el.pgNext?.classList.toggle('disabled', !canNext);
    }
  
    // ===== 전체 렌더 =====
    function renderAll(){
      renderTabs();
      show(el.loader, true);
      setTimeout(() => {
        applyFilters();
        renderTable();
        renderPaging();
        setText(el.selCount, state.selected.size);
        show(el.loader, false);
        initTooltips();
      }, 120);
    }
  
    // ===== 액션 처리(일괄) =====
    const ACTION_LABEL = {
      RETURN_ACCEPT: '수거지시',
      RETURN_COLLECT_DONE: '반품수거 완료',
      RETURN_DONE: '반품완료 처리',
      RETURN_REJECT: '반품 거부',
      RESTORE_RETURN_REFUNDING: '환불처리중으로 되돌리기',
      RESTORE_RETURN_REQUEST: '반품요청으로 되돌리기',
      RESTORE_RETURN_COLLECTING: '수거중으로 되돌리기',
      RESTORE_RETURN_COLLECT_DONE: '수거완료로 되돌리기',
      RETURN_REFUND_RETRY: '자동환불 재시도',
      RETURN_FORCE_DONE: '강제 반품(환불)완료 처리'
    };
  
    function runBulkAction(action){
      const ids = [...state.selected];
      if (!ids.length) { alert('처리할 주문을 선택하세요.'); return; }
      const label = ACTION_LABEL[action] || action;
      if (!confirm(`선택한 ${ids.length}건에 대해 [${label}]을(를) 실행할까요?`)) return;
  
      // 데모: 상태 전환
      const setIds = new Set(ids);
      state.all = state.all.map(o => {
        if (!setIds.has(o.id)) return o;
        switch(action){
          case 'RETURN_ACCEPT': o.status = 'RETURN_COLLECTING'; break;
          case 'RETURN_COLLECT_DONE': o.status = 'RETURN_COLLECT_DONE'; break;
          case 'RETURN_DONE': o.status = 'RETURN'; break;
          case 'RETURN_REJECT': o.status = 'RETURN_REQUEST'; break;
          case 'RESTORE_RETURN_REFUNDING': o.status = 'RETURN_REFUNDING'; break;
          case 'RESTORE_RETURN_REQUEST': o.status = 'RETURN_REQUEST'; break;
          case 'RESTORE_RETURN_COLLECTING': o.status = 'RETURN_COLLECTING'; break;
          case 'RESTORE_RETURN_COLLECT_DONE': o.status = 'RETURN_COLLECT_DONE'; break;
          case 'RETURN_REFUND_RETRY': o.status = 'RETURN_REFUNDING'; break;
          case 'RETURN_FORCE_DONE': o.status = 'RETURN'; break;
        }
        return o;
      });
  
      refreshAfterAction(`[${label}] 완료`);
    }
  
    function refreshAfterAction(msg){
      applyFilters();
      renderAll();
      alert(msg);
    }
  
    // ===== 이벤트 바인딩 =====
    function bindEvents(){
      // 상단/모바일 툴 버튼
      el.btnPrintTop?.addEventListener('click', openPrintWindow);
      el.btnPrintM?.addEventListener('click', openPrintWindow);
      el.btnExportTop?.addEventListener('click', exportCSV);
      el.btnExportM?.addEventListener('click', exportCSV);
  
      // 도움말
      el.btnHelp?.addEventListener('click', toggleHelp);
  
      // 검색
      el.btnSearch?.addEventListener('click', (e) => {
        e.preventDefault();
        state.keyword = el.keyword?.value || '';
        state.page = 1;
        renderAll();
      });
      el.keyword?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          state.keyword = el.keyword?.value || '';
          state.page = 1;
          renderAll();
        }
      });
  
      // 고급검색
      el.btnAdvanced?.addEventListener('click', () => {
        ensureAdvancedStatusChips(); // 상태체크칩 채우기
        showModal('#mdAdvanced');
      });
      el.formAdvanced?.addEventListener('submit', (e) => {
        e.preventDefault();
        state.adv.from = el.advFrom?.value || '';
        state.adv.to   = el.advTo?.value   || '';
        // statuses
        const set = new Set();
        $$('input[name="advStatusChk"]:checked', el.advStatus).forEach(i => set.add(i.value));
        state.adv.statuses = set;
        state.adv.collectMethod = el.advCollect?.value || '';
        state.adv.memo = el.advMemo?.value || '';
        state.adv.minTotal = el.advMin?.value || '';
        state.adv.maxTotal = el.advMax?.value || '';
  
        if (window.bootstrap) bootstrap.Modal.getInstance(el.mdAdvanced)?.hide();
        state.page = 1;
        renderAll();
      });
  
      // jumpDone: 완료 탭으로 점프
      el.jumpDone?.addEventListener('click', (e) => {
        e.preventDefault();
        state.status = 'RETURN';
        state.page = 1;
        renderAll();
        const url = new URL(location.href);
        url.searchParams.set('status', state.status);
        history.replaceState(null, '', url);
      });
  
      // 전체선택
      el.checkAll?.addEventListener('change', () => {
        const checked = !!el.checkAll.checked;
        state.selected.clear();
        $$('#tbodyReturn .rowchk').forEach(c => {
          c.checked = checked;
          const id = Number(c.closest('tr')?.dataset.id);
          if (checked && id) state.selected.add(id);
        });
        setText(el.selCount, state.selected.size);
      });
  
      // 페이징
      el.pgPrev?.addEventListener('click', (e) => {
        e.preventDefault();
        if (state.page>1){ state.page--; renderAll(); }
      });
      el.pgNext?.addEventListener('click', (e) => {
        e.preventDefault();
        const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
        if (state.page<totalPages){ state.page++; renderAll(); }
      });
  
      // 일괄 액션 버튼(툴바) - data-action
      $$('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const action = btn.dataset.action;
          if (!action) return;
          runBulkAction(action);
        });
      });
    }
  
    // ===== 고급검색: 상태 체크칩 구성 =====
    function ensureAdvancedStatusChips(){
      if (!el.advStatus) return;
      if (el.advStatus.children.length) return; // 1회만 구성
      el.advStatus.innerHTML = STATUS_ORDER.map(s => `
        <label class="form-check form-check-inline">
          <input class="form-check-input" type="checkbox" name="advStatusChk" value="${s}">
          <span class="form-check-label">${STATUS_LABEL[s]}</span>
        </label>
      `).join('');
    }
  
    // ===== 주문서 출력 =====
    function openPrintWindow(){
      const ids = [...state.selected];
      if (!ids.length){ alert('출력할 주문을 선택하세요.'); return; }
      const w = window.open('', 'order_print_popup', 'width=900,height=700');
      w.document.write(`<html><head><title>주문서 출력</title></head><body style="font-family:system-ui,Segoe UI,Apple SD Gothic Neo,sans-serif">
        <h3>선택 주문 (${ids.length}건)</h3>
        <pre>${ids.join(', ')}</pre>
        <hr>
        <p>실서비스에선 서버 템플릿을 렌더링하세요.</p>
      </body></html>`);
      w.document.close();
    }
  
    // ===== CSV 내보내기 (필터 결과 전체) =====
    function exportCSV(){
      if (!state.filtered.length){ alert('내보낼 데이터가 없습니다.'); return; }
      const headers = [
        '주문번호','주문시각','주문자','연락처','상품명','상품금액',
        '수량','상태','수거방법','반품사유','기타비용','수거지','환불정보','배송정보','결제금액','메모'
      ];
      const rows = state.filtered.map(o => ([
        o.orderNo, o.orderedAt, o.buyer, o.phone, o.productName, o.price, o.qty,
        STATUS_LABEL[o.status], o.collectMethod, o.reason, o.extraFee,
        o.collectInfo, o.refundInfo, o.shippingInfo, o.payTotal, o.memo||''
      ]));
      const esc = (v) => {
        const s = String(v ?? '');
        return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
      };
      const csv = '\uFEFF' + [headers.map(esc).join(','), ...rows.map(r=>r.map(esc).join(','))].join('\r\n');
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `returns_${Date.now()}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    }
  
    // ===== 도움말 토글 =====
    function toggleHelp(){
      // 간단 안내창
      alert([
        '• 수거지시: 택배사에 수거 요청 전송',
        '• 반품수거 완료: 수거 확인',
        '• 반품완료 처리: 환불까지 완료',
        '• 되돌리기: 단계가 잘못 진행된 경우 이전 단계로 복구'
      ].join('\n'));
    }
  
    // ===== 초기화 =====
    function init(){
      // URL 쿼리 반영
      const statusQ = qs.get('status');
      if (statusQ && STATUS_LABEL[statusQ]) state.status = statusQ;
  
      applyFilters();
      renderAll();
      bindEvents();
    }
  
    // kick
    init();

  
    /* -----------------------------
 * 상세보기 모달
 * ----------------------------- */
const el2 = {
    returnDetailBody: $('#returnDetailBody'),
    returnDetailFoot: $('#returnDetailFoot'),
    btnCollect: $('#btnReturnCollect'),
    btnRefund: $('#btnReturnRefund'),
    btnReject: $('#btnReturnReject'),
    btnDone: $('#btnReturnDone')
  };
  
  // 상태별 배지 색상
  const DETAIL_BADGE_CLASS = {
    NEW: 'text-bg-warning-subtle text-warning-emphasis',
    RETURN_REQUEST: 'text-bg-info-subtle text-info-emphasis',
    RETURN_COLLECTING: 'text-bg-primary-subtle text-primary-emphasis',
    RETURN_COLLECT_DONE: 'text-bg-secondary-subtle text-secondary-emphasis',
    RETURN_REFUNDING: 'text-bg-success-subtle text-success-emphasis',
    RETURN_REFUND_FAILED: 'text-bg-danger-subtle text-danger-emphasis',
    RETURN: 'text-bg-dark-subtle text-dark-emphasis'
  };
  
  // 현재 모달에 표시 중인 주문 ID 저장
  let currentDetailId = null;
  
  // 상세보기 열기
  function openReturnDetail(id) {
    const item = state.all.find(x => x.id === id);
    if (!item) return;
    currentDetailId = id;
  
    el2.returnDetailBody.innerHTML = `
      <div class="row g-3">
        <div class="col-md-7">
          <div class="d-flex gap-3 align-items-start">
            <img src="${item.productImg}" alt="" style="width:120px;height:90px;object-fit:cover;border-radius:8px">
            <div>
              <div class="fw-semibold">${item.productName}</div>
              <div class="text-body-secondary small">${item.orderNo} · ${item.orderedAt}</div>
              <div class="mt-1">상태: 
                <span class="badge ${DETAIL_BADGE_CLASS[item.status] || 'text-bg-secondary'}">${STATUS_LABEL[item.status]}</span>
              </div>
            </div>
          </div>
          <hr>
          <dl class="row mb-0">
            <dt class="col-4 col-md-3">고객명</dt><dd class="col-8 col-md-9">${item.buyer} (${item.phone})</dd>
            <dt class="col-4 col-md-3">수거방법</dt><dd class="col-8 col-md-9">${item.collectMethod}</dd>
            <dt class="col-4 col-md-3">수거지 정보</dt><dd class="col-8 col-md-9">${item.collectInfo}</dd>
            <dt class="col-4 col-md-3">반품사유</dt><dd class="col-8 col-md-9">${item.reason || '-'}</dd>
            <dt class="col-4 col-md-3">메모</dt><dd class="col-8 col-md-9">${item.memo || '-'}</dd>
            <dt class="col-4 col-md-3">환불정보</dt><dd class="col-8 col-md-9">${item.refundInfo || '-'}</dd>
            <dt class="col-4 col-md-3">배송정보</dt><dd class="col-8 col-md-9">${item.shippingInfo || '-'}</dd>
          </dl>
        </div>
        <div class="col-md-5">
          <div class="card">
            <div class="card-header"><h6 class="mb-0">금액 요약</h6></div>
            <div class="card-body">
              <div class="d-flex justify-content-between"><span>상품금액</span><strong>${money(item.price)}</strong></div>
              <div class="d-flex justify-content-between"><span>수량</span><strong>${item.qty}</strong></div>
              ${item.extraFee ? `<div class="d-flex justify-content-between"><span>기타비용</span><strong>${money(item.extraFee)}</strong></div>` : ''}
              <hr>
              <div class="d-flex justify-content-between"><span>결제금액</span><strong class="fs-5">${money(item.payTotal)}</strong></div>
            </div>
          </div>
        </div>
      </div>
    `;
    setText(el2.returnDetailFoot, `ID #${item.id} · 최근 요청일 ${item.orderedAt}`);
    showModal('#mdReturnDetail');
  }
  
  /* -----------------------------
   * 상세 모달 내 버튼 동작
   * ----------------------------- */
  function handleModalAction(action) {
    const item = state.all.find(x => x.id === currentDetailId);
    if (!item) return;
    const actionName = {
      collect: '수거지시',
      refund: '환불진행중',
      reject: '반품거부',
      done: '반품완료'
    }[action];
  
    if (!confirm(`[${actionName}] 상태로 변경하시겠습니까?`)) return;
  
    switch (action) {
      case 'collect': item.status = 'RETURN_COLLECTING'; break;
      case 'refund': item.status = 'RETURN_REFUNDING'; break;
      case 'reject': item.status = 'RETURN_REQUEST'; break;
      case 'done': item.status = 'RETURN'; break;
    }
  
    applyFilters();
    renderAll();
    showModal('#mdReturnDetail'); // 다시 새로고침 후 표시 유지
    openReturnDetail(item.id);
    alert(`[${actionName}] 처리 완료`);
  }
  
  // 버튼 이벤트 바인딩
  el2.btnCollect?.addEventListener('click', () => handleModalAction('collect'));
  el2.btnRefund?.addEventListener('click', () => handleModalAction('refund'));
  el2.btnReject?.addEventListener('click', () => handleModalAction('reject'));
  el2.btnDone?.addEventListener('click', () => handleModalAction('done'));
  
  /* -----------------------------
   * 상세보기 트리거
   * ----------------------------- */
  // 1) 드롭다운 '상세보기'
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-action="DETAIL_VIEW"]');
    if (!a) return;
    e.preventDefault();
    const id = Number(a.closest('tr')?.dataset.id);
    if (id) openReturnDetail(id);
  });
  
  // 2) 주문번호 / 상품명 클릭 시
  document.addEventListener('click', (e) => {
    const cell = e.target.closest('.fw-semibold');
    if (!cell) return;
    const tr = cell.closest('tr');
    const id = Number(tr?.dataset.id);
    if (id) openReturnDetail(id);
  });
  
  
  })();