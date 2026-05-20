/* /admin/assets/js/exchange.js */
(() => {
    // ------- helpers -------
    const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
    const qs=new URLSearchParams(location.search);
    const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    const initTooltips=()=>{ if(!window.bootstrap) return; $$('[data-bs-toggle="tooltip"]').forEach(el=>{try{new bootstrap.Tooltip(el);}catch(_){}}); };
    const showModal=id=>{ if(!window.bootstrap) return; const el=$(id); if(el) new bootstrap.Modal(el).show(); };
    const hideModal=el=>{ if(window.bootstrap && el) bootstrap.Modal.getInstance(el)?.hide(); };
    const setText=(el,txt)=>{ if(el) el.textContent=txt; };
    const show=(el,yes)=>{ if(el) el.classList.toggle('d-none',!yes); };
  
    // ------- constants -------
    const STATUS_LABEL = {
        ALL: '전체',
      REQUEST: '교환요청',
      COLLECTING: '수거중',
      COLLECT_DONE: '수거완료',
      REDELIVERING: '재배송중',
      DONE: '교환완료',
      WITHHOLD: '보류',
      REJECTED: '거절',
      HIDDEN: '숨김',
    };
    const STATUS_ORDER = ['ALL','REQUEST','COLLECTING','COLLECT_DONE','REDELIVERING','DONE','WITHHOLD','REJECTED','HIDDEN'];
  
    // 배지 색상(부트스트랩5 text-bg-* 유틸)
    const BADGE_CLASS = {
      REQUEST: 'text-bg-primary',
      COLLECTING: 'text-bg-info',
      COLLECT_DONE: 'text-bg-secondary',
      REDELIVERING: 'text-bg-warning',
      DONE: 'text-bg-success',
      WITHHOLD: 'text-bg-dark',
      REJECTED: 'text-bg-danger',
      HIDDEN: 'text-bg-light text-dark',
    };
  
    const el = {
      tabs: $('#excTabs'),
      btnPrintTop: $('#btnOrderPrint'), btnExportTop: $('#btnExport'),
      btnPrintM: $('#btnOrderPrint2'),  btnExportM: $('#btnExport2'),
      btnHelp: $('#btnHelp'),
  
      keyword: $('#keyword'), btnSearch: $('#btnSearch'), btnAdvanced: $('#btnAdvanced'),
  
      mdAdvanced: $('#mdAdvanced'), advFrom: $('#advFrom'), advTo: $('#advTo'),
      advStatus: $('#advStatus'), advMemo: $('#advMemo'), formAdvanced: $('#formAdvanced'),
  
      emptyNew: $('#emptyNew'), emptyList: $('#emptyList'), loader: $('#loader'), jumpDone: $('#jumpDone'),
  
      tbl: $('#tblExc'), tbody: $('#tbodyExc'),
      checkAll: $('#checkAll'), selCount: $('#selCount'),
  
      pgPrev: $('#pgPrev'), pgNext: $('#pgNext'), pgNow: $('#pgNow'), pgTotal: $('#pgTotal'),
  
      mdDetail: $('#mdExcDetail'), detailBody: $('#excDetailBody'), detailFoot: $('#detailFootNote'),
      btnDetailStart: $('#btnDetailStart'), btnDetailDone: $('#btnDetailDone'), btnDetailReject: $('#btnDetailReject'),
    };
  
    // ------- demo data -------
    function makeDemo() {
      const mem = localStorage.getItem('__exc_demo__');
      if (mem) try { return JSON.parse(mem); } catch(_) {}
      const names = ['김지호','박민수','최서윤','이다인','오유진','문성우'];
      const phones = ['010-1234-5678','010-2222-3333','010-4321-5678','010-7777-8888','010-9999-1111','010-5555-6666'];
      const prod = ['밤호박 2kg','감귤 3kg','천혜향 2kg','레드비트 1kg','당근 5kg','양파 10kg'];
      const reasons = ['사이즈/옵션 변경','색상 오배송','파손/불량 의심','단순 변심','선물용으로 교환','기타 문의'];
      const arr=[];
      const today = new Date();
      for (let i=0;i<48;i++){
        const d = new Date(today.getTime()- (i*3600*1000*6));
        const y = d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0');
        const hh=String(d.getHours()).padStart(2,'0'), mm=String(d.getMinutes()).padStart(2,'0');
        const st = STATUS_ORDER[i%STATUS_ORDER.length];
        arr.push({
          id: 830000 + i,
          createdAt: `${y}-${m}-${dd} ${hh}:${mm}`,
          orderNo: 'O' + String(202509010000 + i),
          productName: prod[i%prod.length],
          productImg: `/admin/assets/img/sample-thumb.svg`,
          qty: (i%3)+1,
          customer: names[i%names.length],
          phone: phones[i%phones.length],
          reason: reasons[i%reasons.length],
          memo: (i%4===0?'사진 확인 후 교환 진행':''),
          status: st,
        });
      }
      localStorage.setItem('__exc_demo__', JSON.stringify(arr));
      return arr;
    }
  
    const state = {
      all: makeDemo(),
      status: qs.get('status') && STATUS_LABEL[qs.get('status')] ? qs.get('status') : 'ALL',
      page: 1, pageSize: 10,
      selected: new Set(),
      keyword: '',
      adv: { from:'', to:'', statuses:new Set(), memo:'' },
      filtered: [],
      detailId: null,
    };
  
    // ------- core -------
    const countByStatus = () => {
        const map = Object.fromEntries(STATUS_ORDER.map(s=>[s,0]));
        state.all.forEach(o => {
          if (map[o.status]!=null) map[o.status]++; // 상태별 카운트
          map.ALL++; // ✅ 전체 카운트 증가
        });
        return map;
      };
  
    function renderTabs() {
      const cnt = countByStatus();
      el.tabs.innerHTML = STATUS_ORDER.map(s => {
        const active = state.status===s ? 'active' : '';
        return `<li class="nav-item flex-shrink-0">
          <button class="nav-link ${active}" data-status="${s}">
            ${STATUS_LABEL[s]} <span class="badge text-bg-primary ms-1">${cnt[s]||0}</span>
          </button>
        </li>`;
      }).join('');
      $$('button[data-status]', el.tabs).forEach(b=>{
        b.addEventListener('click',()=>{
          state.status = b.dataset.status;
          state.page = 1;
          // 탭 선택 시 고급 상태선택을 초기화(탭이 우선)
          state.adv.statuses.clear();
          applyFilters(); renderAll();
          const url=new URL(location.href); url.searchParams.set('status',state.status); history.replaceState(null,'',url);
        });
      });
    }
  
    // ------- applyFilters -------
function applyFilters() {
    const k = (state.keyword||'').trim().toLowerCase();
    const A = state.adv;
  
    // ✅ 전체 탭이면 모든 상태 포함
    let base = state.all;
    if (state.status !== 'ALL') {
      if (A.statuses.size) base = base.filter(o=>A.statuses.has(o.status));
      else base = base.filter(o=>o.status===state.status);
    } else {
      // 전체 탭일 땐 A.statuses만 적용 (선택된 상태 필터)
      if (A.statuses.size) base = base.filter(o=>A.statuses.has(o.status));
    }
  
    let list = base;
    if (k) {
      list = list.filter(o =>
        o.orderNo.toLowerCase().includes(k) ||
        (o.customer||'').toLowerCase().includes(k) ||
        (o.phone||'').toLowerCase().includes(k) ||
        (o.productName||'').toLowerCase().includes(k) ||
        (o.reason||'').toLowerCase().includes(k) ||
        (o.memo||'').toLowerCase().includes(k)
      );
    }
    if (A.from) list = list.filter(o => (o.createdAt||'') >= A.from);
    if (A.to)   list = list.filter(o => (o.createdAt||'') <= A.to + ' 23:59');
    if (A.memo) {
      const m = A.memo.toLowerCase();
      list = list.filter(o => (o.memo||'').toLowerCase().includes(m) || (o.reason||'').toLowerCase().includes(m));
    }
  
    state.filtered = list;
    state.selected.clear();
    if (el.checkAll) el.checkAll.checked = false;
  }
  
    function badge(status) {
      const cls = BADGE_CLASS[status] || 'text-bg-secondary';
      return `<span class="badge ${cls}">${esc(STATUS_LABEL[status]||status)}</span>`;
    }
  
    function renderTable() {
      const tbody = el.tbody || $('#tbodyExc') || $('#tblExc tbody');
      if (!tbody) return;
  
      const start = (state.page-1)*state.pageSize;
      const rows = state.filtered.slice(start, start + state.pageSize);
  
      if (!rows.length) {
        show(el.loader, false);
        show(el.emptyNew, state.status==='REQUEST' && !state.adv.statuses.size);
        show(el.emptyList, !(state.status==='REQUEST' && !state.adv.statuses.size));
      } else {
        show(el.emptyNew,false); show(el.emptyList,false);
      }
  
      tbody.innerHTML = rows.map(o=>`
        <tr data-id="${o.id}">
          <td><input type="checkbox" class="rowchk form-check-input"></td>
          <td><div class="fw-semibold">${esc(o.createdAt)}</div></td>
          <td><a href="#" class="link-dark fw-semibold" data-row-action="detail" title="상세보기">${esc(o.orderNo)}</a></td>
          <td class="text-center">
            <img src="${esc(o.productImg)}" alt="" style="width:72px;height:54px;object-fit:cover;border-radius:6px">
          </td>
          <td>
            <div class="fw-semibold">${esc(o.customer)}</div>
            <div class="text-body-secondary small">${esc(o.phone||'')}</div>
          </td>
          <td>
            <div class="fw-semibold">${esc(o.productName)} <span class="text-body-secondary">x${o.qty}</span></div>
            <div class="small">${esc(o.reason||'-')}</div>
          </td>
          <td class="text-center">${badge(o.status)}</td>
          <td class="text-end"> 
             <button class="btn btn-sm btn-light" data-bs-toggle="dropdown"><i class="ri-more-2-line"></i></button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item" href="#" data-row-action="detail">상세보기</a></li>
                <li><a class="dropdown-item" href="#" data-row-action="start">처리 시작</a></li>
                <li><a class="dropdown-item" href="#" data-row-action="done">교환 완료</a></li>
                <li><a class="dropdown-item text-danger" href="#" data-row-action="reject">거절</a></li>
              </ul> 
          </td>
        </tr>
      `).join('');
  
      // 체크박스 바인딩
      $$('#tbodyExc .rowchk').forEach(chk=>{
        chk.addEventListener('change', e=>{
          const id = Number(e.target.closest('tr')?.dataset.id);
          if (!id) return;
          if (e.target.checked) state.selected.add(id); else state.selected.delete(id);
          setText(el.selCount, state.selected.size);
          if (el.checkAll) {
            const all = $$('#tbodyExc .rowchk').every(c=>c.checked);
            el.checkAll.checked = all && state.filtered.length>0;
          }
        });
      });
    }
  
    function renderPaging() {
      const total = Math.max(1, Math.ceil(state.filtered.length/state.pageSize));
      setText(el.pgNow, state.page); setText(el.pgTotal, total);
      el.pgPrev?.classList.toggle('disabled', !(state.page>1));
      el.pgNext?.classList.toggle('disabled', !(state.page<total));
    }
  
    function renderAll() {
      renderTabs();
      show(el.loader,true);
      setTimeout(()=>{ applyFilters(); renderTable(); renderPaging(); setText(el.selCount, state.selected.size); show(el.loader,false); initTooltips(); }, 100);
    }
  
    // ------- actions -------
    const ACTION_LABEL = {
      EXCHANGE_ACCEPT: '수거지시',
      EXCHANGE_COLLECT_DONE: '교환수거 완료',
      EXCHANGE_REDELIVERING: '교환 재발송',
      EXCHANGE_DONE: '교환완료 처리',
      EXCHANGE_WITHHOLD: '교환 보류',
      EXCHANGE_RELEASEHOLD: '보류 해제',
      EXCHANGE_REJECT: '교환 거부',
      RESTORE_EXCHANGE_REQUEST: '교환요청으로 되돌리기',
      RESTORE_EXCHANGE_COLLECTING: '수거중으로 되돌리기',
      RESTORE_EXCHANGE_COLLECT_DONE: '수거완료로 되돌리기',
      RESTORE_REDELIVERING: '재배송중으로 되돌리기',
    };
  
    function mutateStatus(o, action) {
      switch(action){
        case 'EXCHANGE_ACCEPT': o.status='COLLECTING'; break;
        case 'EXCHANGE_COLLECT_DONE': o.status='COLLECT_DONE'; break;
        case 'EXCHANGE_REDELIVERING': o.status='REDELIVERING'; break;
        case 'EXCHANGE_DONE': o.status='DONE'; break;
        case 'EXCHANGE_WITHHOLD': o.status='WITHHOLD'; break;
        case 'EXCHANGE_RELEASEHOLD': o.status='COLLECT_DONE'; break;
        case 'EXCHANGE_REJECT': o.status='REJECTED'; break;
  
        case 'RESTORE_EXCHANGE_REQUEST': o.status='REQUEST'; break;
        case 'RESTORE_EXCHANGE_COLLECTING': o.status='COLLECTING'; break;
        case 'RESTORE_EXCHANGE_COLLECT_DONE': o.status='COLLECT_DONE'; break;
        case 'RESTORE_REDELIVERING': o.status='REDELIVERING'; break;
      }
      return o;
    }
  
    function runBulkAction(action){
      const ids=[...state.selected];
      if(!ids.length){ alert('처리할 교환 요청을 선택하세요.'); return; }
      const label = ACTION_LABEL[action] || action;
      if(!confirm(`선택 ${ids.length}건에 대해 [${label}]을(를) 실행할까요?`)) return;
  
      const set = new Set(ids);
      state.all = state.all.map(o => set.has(o.id) ? mutateStatus({...o}, action) : o);
      refresh(`[${label}] 완료`);
    }
  
    function refresh(msg){
      localStorage.setItem('__exc_demo__', JSON.stringify(state.all));
      applyFilters(); renderAll();
      if (msg) alert(msg);
    }
  
    // ------- detail modal -------
    function openDetail(id){
      const item = state.all.find(o=>o.id===id);
      if(!item) return;
      state.detailId = id;
  
      el.detailBody.innerHTML = `
        <div class="row g-3">
          <div class="col-md-4">
            <img src="${esc(item.productImg)}" alt="" class="img-fluid rounded border">
          </div>
          <div class="col-md-8">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="mb-1">${badge(item.status)}</div>
                <h5 class="mb-1">${esc(item.productName)} <small class="text-body-secondary">x${item.qty}</small></h5>
                <div class="text-body-secondary">주문번호 <strong>${esc(item.orderNo)}</strong></div>
              </div>
              <div class="text-end small text-body-secondary">
                요청시각<br><strong>${esc(item.createdAt)}</strong>
              </div>
            </div>
            <hr>
            <dl class="row mb-0">
              <dt class="col-3">신청자</dt><dd class="col-9">${esc(item.customer)} <span class="text-body-secondary">${esc(item.phone||'')}</span></dd>
              <dt class="col-3">사유</dt><dd class="col-9">${esc(item.reason||'-')}</dd>
              <dt class="col-3">메모</dt><dd class="col-9">${esc(item.memo||'-')}</dd>
            </dl>
          </div>
        </div>
      `;
      el.detailFoot.textContent = `ID ${item.id} · 상태: ${STATUS_LABEL[item.status]}`;
  
      // 버튼 활성/비활성(간단 로직)
      el.btnDetailStart.disabled = (item.status!=='REQUEST' && item.status!=='WITHHOLD');
      el.btnDetailDone.disabled  = (item.status!=='REDELIVERING' && item.status!=='COLLECT_DONE');
      el.btnDetailReject.disabled= (item.status==='DONE');
  
      showModal('#mdExcDetail');
    }
  
    function bindDetailButtons(){
        el.btnDetailStart?.addEventListener('click', ()=>{
          const it = state.all.find(o=>o.id===state.detailId);
          if(!it) return;
          mutateStatus(it, 'EXCHANGE_ACCEPT');
          refresh('처리 시작됨');
          hideModal(el.mdDetail); // ✅ 모달 닫기 추가
        });
      
        el.btnDetailDone?.addEventListener('click', ()=>{
          const it = state.all.find(o=>o.id===state.detailId);
          if(!it) return;
          mutateStatus(it, 'EXCHANGE_DONE');
          refresh('교환 완료 처리됨');
          hideModal(el.mdDetail); // ✅ 모달 닫기 추가
        });
      
        el.btnDetailReject?.addEventListener('click', ()=>{
          const it = state.all.find(o=>o.id===state.detailId);
          if(!it) return;
          mutateStatus(it, 'EXCHANGE_REJECT');
          refresh('거절 처리됨');
          hideModal(el.mdDetail); // ✅ 모달 닫기 추가
        });
      }
      
  
    // ------- bindings -------
    function ensureAdvancedStatusChips(){
      if (!el.advStatus || el.advStatus.children.length) return;
      el.advStatus.innerHTML = STATUS_ORDER.map(s=>`
        <label class="form-check form-check-inline">
          <input class="form-check-input" type="checkbox" name="advStatusChk" value="${s}">
          <span class="form-check-label">${STATUS_LABEL[s]}</span>
        </label>
      `).join('');
    }
  
    function bind(){
      // 인쇄/내보내기
      const openPrint=()=>{
        const ids=[...state.selected];
        if(!ids.length){ alert('출력할 교환 건을 선택하세요.'); return; }
        const w=window.open('','exc_print','width=900,height=700');
        w.document.write(`<html><head><title>인쇄</title></head><body style="font-family:system-ui,Segoe UI,Apple SD Gothic Neo,sans-serif">
          <h3>선택 교환 (${ids.length}건)</h3><pre>${ids.join(', ')}</pre><hr><p>※ 실제 서비스에선 서버 템플릿을 렌더링하세요.</p></body></html>`);
        w.document.close();
      };
      const exportCSV=()=>{
        if(!state.filtered.length){ alert('내보낼 데이터가 없습니다.'); return; }
        const headers=['요청시각','주문번호','상품','수량','신청자','연락처','사유','메모','상태'];
        const rows=state.filtered.map(o=>[o.createdAt,o.orderNo,o.productName,o.qty,o.customer,o.phone,o.reason||'',o.memo||'',STATUS_LABEL[o.status]||o.status]);
        const escCsv=v=>{const s=String(v??''); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; };
        const csv='\uFEFF'+[headers.map(escCsv).join(','),...rows.map(r=>r.map(escCsv).join(','))].join('\r\n');
        const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob);
        const a=document.createElement('a'); a.href=url; a.download=`exchange_${Date.now()}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      };
      el.btnPrintTop?.addEventListener('click',openPrint);
      el.btnPrintM?.addEventListener('click',openPrint);
      el.btnExportTop?.addEventListener('click',exportCSV);
      el.btnExportM?.addEventListener('click',exportCSV);
  
      // 도움말
      el.btnHelp?.addEventListener('click',()=>alert(
        '• 상단 탭: 교환요청/수거중/수거완료/재배송중/교환완료/보류/거절/숨김\n'
        + '• 툴바 일괄처리로 상태를 변경할 수 있습니다.\n'
        + '• 고급검색에서 상태를 선택하면 탭과 무관하게 선택 상태들로 검색합니다.'
      ));
  
      // 검색
      const doSearch=()=>{ state.keyword=el.keyword?.value||''; state.page=1; renderAll(); };
      el.btnSearch?.addEventListener('click',e=>{ e.preventDefault(); doSearch(); });
      el.keyword?.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); doSearch(); } });
  
      // 고급검색
      el.btnAdvanced?.addEventListener('click',()=>{ ensureAdvancedStatusChips(); showModal('#mdAdvanced'); });
      el.formAdvanced?.addEventListener('submit',e=>{
        e.preventDefault();
        state.adv.from = el.advFrom?.value||'';
        state.adv.to   = el.advTo?.value||'';
        const set = new Set(); $$('input[name="advStatusChk"]:checked', el.advStatus).forEach(i=>set.add(i.value));
        state.adv.statuses = set;
        state.adv.memo = el.advMemo?.value||'';
        hideModal(el.mdAdvanced);
        state.page=1; renderAll();
      });
  
      // 빠른 이동
      el.jumpDone?.addEventListener('click',e=>{
        e.preventDefault(); state.status='DONE'; state.adv.statuses.clear(); state.page=1; renderAll();
        const url=new URL(location.href); url.searchParams.set('status',state.status); history.replaceState(null,'',url);
      });
  
      // 전체선택
      el.checkAll?.addEventListener('change', ()=>{
        const checked = !!el.checkAll.checked;
        state.selected.clear();
        $$('#tbodyExc .rowchk').forEach(c=>{
          c.checked = checked;
          const id = Number(c.closest('tr')?.dataset.id);
          if (checked && id) state.selected.add(id);
        });
        setText(el.selCount, state.selected.size);
      });
  
      // 페이징
      el.pgPrev?.addEventListener('click',e=>{e.preventDefault(); if(state.page>1){ state.page--; renderAll(); }});
      el.pgNext?.addEventListener('click',e=>{e.preventDefault(); const total=Math.max(1,Math.ceil(state.filtered.length/state.pageSize)); if(state.page<total){ state.page++; renderAll(); }});
  
      // 툴바 일괄처리
      $$('[data-action]').forEach(btn=>btn.addEventListener('click', e=>{
        e.preventDefault();
        const a = btn.dataset.action;
        if (a) runBulkAction(a);
      }));
  
      // 행 액션(상세/개별 처리)
      el.tbody?.addEventListener('click', e=>{
        const a = e.target.closest('[data-row-action]'); if(!a) return;
        e.preventDefault();
        const id = Number(e.target.closest('tr')?.dataset.id);
        if(!id) return;
        if(a.dataset.rowAction==='detail') openDetail(id);
        if(a.dataset.rowAction==='start'){ state.selected = new Set([id]); runBulkAction('EXCHANGE_ACCEPT'); }
        if(a.dataset.rowAction==='done'){ state.selected = new Set([id]); runBulkAction('EXCHANGE_DONE'); }
        if(a.dataset.rowAction==='reject'){ state.selected = new Set([id]); runBulkAction('EXCHANGE_REJECT'); }
      });
  
      bindDetailButtons();
    }
  
    function init(){
      const s = qs.get('status'); if(s && STATUS_LABEL[s]) state.status = s;
      applyFilters(); renderAll(); bind();
    }
  
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
  })();
  