/* /assets/js/cancel.js — 상태 뱃지/상세보기 포함 */
(()=> {
    const $  = (s,r=document)=>r.querySelector(s);
    const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
    const fmt=(n)=> (n||0).toLocaleString('ko-KR');
    const money=(n)=> fmt(n)+'원';
    const qs = new URLSearchParams(location.search);
  
    // 상태
    const STATUS_ORDER=['ALL', 'NEW','CANCEL_REQUEST','CANCELING','CANCEL_FAILED','CANCEL_DONE'];
    const LABEL={ ALL:'전체', NEW:'신규취소', CANCEL_REQUEST:'취소요청', CANCELING:'취소진행중', CANCEL_FAILED:'환불실패', CANCEL_DONE:'취소완료' };
    // ✅ 상태별 뱃지 클래스
    const BADGE={ 
      NEW:'text-bg-secondary',
      CANCEL_REQUEST:'text-bg-primary',
      CANCELING:'text-bg-info',
      CANCEL_FAILED:'text-bg-danger',
      CANCEL_DONE:'text-bg-success'
    };
  
    // 엘리먼트
    const el={
      tabs:$('#cancelTabs'),
      btnPrintTop:$('#btnOrderPrint'), btnExportTop:$('#btnExport'),
      btnPrintM:$('#btnOrderPrint2'), btnExportM:$('#btnExport2'), btnHelp:$('#btnHelp'),
      keyword:$('#keyword'), btnSearch:$('#btnSearch'),
      btnAdvanced:$('#btnAdvanced'), mdAdvanced:$('#mdAdvanced'),
      advFrom:$('#advFrom'), advTo:$('#advTo'), advStatus:$('#advStatus'), advMemo:$('#advMemo'), formAdvanced:$('#formAdvanced'),
      emptyNew:$('#emptyNew'), emptyList:$('#emptyList'), loader:$('#loader'), jumpDone:$('#jumpDone'),
      tbl:$('#tblCancel'), tbody:$('#tbodyCancel'),
      checkAll:$('#checkAll'), selCount:$('#selCount'),
      pgPrev:$('#pgPrev'), pgNext:$('#pgNext'), pgNow:$('#pgNow'), pgTotal:$('#pgTotal'),
      // 상세 모달
      mdDetail:$('#mdCancelDetail'), detailBody:$('#cancelDetailBody'), detailFoot:$('#detailFootNote'),
      btnDetailApprove:$('#btnDetailApprove'), btnDetailRetry:$('#btnDetailRetry'),
      btnDetailReject:$('#btnDetailReject'), btnDetailForceDone:$('#btnDetailForceDone'),
    };
  
    const initTooltips=()=>{ if(!window.bootstrap) return; $$('[data-bs-toggle="tooltip"]').forEach(elm=>{ try{ new bootstrap.Tooltip(elm); }catch(_){}}); };
    const showModal=id=>{ if(window.bootstrap){ const m=$(id); if(m) new bootstrap.Modal(m).show(); } };
  
    // 데모 데이터
const DEMO = (() => {
    const names = ['김이슬','오정민','박세연','김하준','이도윤','최서율','한지민','유서연','강나율','문서우'];
    const arr = []; let id = 41001;
    for (let i = 0; i < 42; i++) {
      const price = 9000 + (i % 8) * 700;
      const qty = (i % 3) + 1;
      // ✅ 실제 주문 상태는 ALL 제외 (1번 인덱스부터 사용)
      const status = STATUS_ORDER[(i % (STATUS_ORDER.length - 1)) + 1];
      arr.push({
        id: id++,
        orderNo: 'C' + (2025091100 + i),
        orderedAt: `2025-09-${String((i % 28) + 1).padStart(2,'0')} ${String(10 + (i % 8)).padStart(2,'0')}:${String(i % 60).padStart(2,'0')}`,
        buyer: names[i % names.length],
        phone: '010-' + String(2000 + (i % 8000)) + '-' + String(1000 + ((i * 5) % 9000)),
        productName: '상품 ' + (i % 10 + 1),
        productImg: `/admin/assets/img/sample-thumb.svg`,
        price, qty, status,
        shipMethod: (i % 2) ? '택배' : '편의점택배',
        shipPay: (i % 3) ? '선불' : '착불',
        reqDate: '2025-09-' + String((i % 28) + 1).padStart(2,'0'),
        refundInfo: (i % 4) ? '카드전체취소' : '부분환불',
        shippingInfo: (i % 2) ? '대한통운 2222-3333-4444' : '로젠 9999-8888-7777',
        payTotal: price * qty,
        memo: (i % 5) ? '' : '취소 사유 메모',
        payMethod: (i % 5 === 0) ? '네이버페이' : (i % 5 === 1) ? '카드' : (i % 5 === 2) ? '가상계좌' : (i % 5 === 3) ? '계좌이체' : '카카오페이'
      });
    }
    return arr;
  })();
  
  
    // 상태
    const state={ all:DEMO, status:qs.get('status')||'ALL', page:1, pageSize:10,
      selected:new Set(), keyword:'', adv:{from:'',to:'',statuses:new Set(),memo:''}, filtered:[], detailId:null };
  
    const show=(n,y)=>n&&n.classList.toggle('d-none',!y);
    const setTxt=(n,t)=>n&&(n.textContent=t);
  
    // 탭
    function renderTabs(){
        const cnt = Object.fromEntries(STATUS_ORDER.map(s=>[s,0]));
        state.all.forEach(o=>{
          if(cnt[o.status]!=null) cnt[o.status]++;
          cnt.ALL++; // ✅ 전체 개수도 카운트
        });
        
        el.tabs.innerHTML = STATUS_ORDER.map(s=>`
          <li class="nav-item flex-shrink-0">
            <button class="nav-link ${state.status===s?'active':''}" data-status="${s}">
              ${LABEL[s]} <span class="badge text-bg-primary ms-1">${cnt[s]||0}</span>
            </button>
          </li>`).join('');
        
        $$('#cancelTabs [data-status]').forEach(btn=>{
          btn.addEventListener('click',()=>{
            state.status=btn.dataset.status; state.page=1; apply(); paint();
            const u=new URL(location.href);
            u.searchParams.set('status',state.status);
            history.replaceState(null,'',u);
          });
        });
      }
      
  
    // 필터
    function apply(){
      const k=(state.keyword||'').trim().toLowerCase();
      let list = state.all.filter(o => state.status === 'ALL' || o.status === state.status); 
      if(k){ list=list.filter(o=>(o.orderNo+o.buyer+o.phone+o.productName+(o.memo||'')).toLowerCase().includes(k)); }
      if(state.adv.from) list=list.filter(o=>o.orderedAt>=state.adv.from);
      if(state.adv.to)   list=list.filter(o=>o.orderedAt<=state.adv.to+' 23:59');
      if(state.adv.statuses.size) list=list.filter(o=>state.adv.statuses.has(o.status));
      if(state.adv.memo){ const m=state.adv.memo.toLowerCase(); list=list.filter(o=>(o.memo||'').toLowerCase().includes(m)); }
      state.filtered=list; state.selected.clear(); if(el.checkAll) el.checkAll.checked=false;
    }
  
    // 표
    function renderTable(){
      const start=(state.page-1)*state.pageSize;
      const rows=state.filtered.slice(start,start+state.pageSize);
      show(el.emptyNew, state.status==='NEW' && !rows.length);
      show(el.emptyList, state.status!=='NEW' && !rows.length);
  
      el.tbody.innerHTML=rows.map(o=>`
        <tr data-id="${o.id}">
          <td><input type="checkbox" class="rowchk form-check-input"></td>
          <td>
            <div class="fw-semibold">${o.orderNo}</div>
            <div class="text-body-secondary small">${o.orderedAt}</div>
          </td>
          <td class="text-center" style="width:76px">
            <img src="${o.productImg}" alt="" style="width:72px;height:54px;object-fit:cover;border-radius:6px">
          </td>
          <td>
            <div class="fw-semibold">${o.productName}</div>
            <div class="text-body-secondary small">${o.buyer} · ${o.phone}</div>
          </td>
          <td class="text-end">${money(o.price)}</td>
          <td class="text-center">${o.qty}</td>
          <td class="text-center"><span class="badge ${BADGE[o.status]||'text-bg-secondary'}">${LABEL[o.status]}</span></td>
          <td class="text-center">${o.shipMethod}</td>
          <td class="text-center">${o.shipPay}</td>
          <td class="text-center">${o.reqDate}</td>
          <td class="text-center">${o.refundInfo}</td>
          <td class="text-center">${o.shippingInfo}</td>
          <td class="text-center fw-semibold">${money(o.payTotal)}</td>
          <td class="text-end"> 
              <button class="btn btn-sm btn-light" data-bs-toggle="dropdown"><i class="ri-more-2-line"></i></button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item" href="#" data-row-act="DETAIL">상세보기</a></li>
                <li><a class="dropdown-item text-danger" href="#" data-row-act="FORCE_DONE">강제 취소완료</a></li>
              </ul> 
          </td>
        </tr>`).join('');
  
      // 선택
      $$('#tbodyCancel .rowchk').forEach(chk=>{
        chk.addEventListener('change',e=>{
          const id=Number(e.target.closest('tr').dataset.id);
          if(e.target.checked) state.selected.add(id); else state.selected.delete(id);
          setTxt(el.selCount,state.selected.size);
          if(el.checkAll){ el.checkAll.checked=$$('#tbodyCancel .rowchk').every(c=>c.checked)&&state.filtered.length>0; }
        });
      });
  
      // 상세/강제완료
      $$('#tbodyCancel [data-row-act="DETAIL"]').forEach(a=>{
        a.addEventListener('click',e=>{
          e.preventDefault();
          const id=Number(a.closest('tr').dataset.id); openDetail(id);
        });
      });
      $$('#tbodyCancel [data-row-act="FORCE_DONE"]').forEach(a=>{
        a.addEventListener('click',e=>{
          e.preventDefault();
          const id=Number(a.closest('tr').dataset.id);
          if(!confirm('수동 환불 후 강제 취소완료 처리할까요?')) return;
          const item=state.all.find(x=>x.id===id); if(item) item.status='CANCEL_DONE';
          refresh('강제 취소완료 처리 완료');
        });
      });
    }
  
    // 페이징
    function renderPaging(){
      const total=Math.max(1,Math.ceil(state.filtered.length/state.pageSize));
      setTxt(el.pgNow,state.page); setTxt(el.pgTotal,total);
      el.pgPrev?.classList.toggle('disabled',state.page<=1);
      el.pgNext?.classList.toggle('disabled',state.page>=total);
    }
  
    // paint: 탭까지 재렌더 → active 보장
    function paint(){
      renderTabs();
      show(el.loader,true);
      setTimeout(()=>{
        show(el.loader,false);
        renderTable();
        renderPaging();
        setTxt(el.selCount,state.selected.size);
        initTooltips();
      },250);
    }
  
    // 일괄 처리
    const ACTION_LABEL={
      CANCEL_ACCEPT:'취소승인', CANCEL_REJECT:'취소거절',
      RESTORE_CANCELING:'취소처리중으로 되돌리기', RESTORE_CANCEL_REQUEST:'취소요청으로 되돌리기',
      CANCEL_RETRY:'자동환불 재시도', CANCEL_FORCE_DONE:'강제 취소(환불)완료 처리'
    };
    function runBulk(action){
      const ids=[...state.selected];
      if(!ids.length) return alert('처리할 주문을 선택하세요.');
      const label=ACTION_LABEL[action]||action;
      if(!confirm(`선택한 ${ids.length}건에 대해 [${label}]을(를) 실행할까요?`)) return;
      const set=new Set(ids);
      state.all=state.all.map(o=>{
        if(!set.has(o.id)) return o;
        switch(action){
          case 'CANCEL_ACCEPT': o.status='CANCELING'; break;
          case 'CANCEL_REJECT': o.status='CANCEL_REQUEST'; break;
          case 'RESTORE_CANCELING': o.status='CANCELING'; break;
          case 'RESTORE_CANCEL_REQUEST': o.status='CANCEL_REQUEST'; break;
          case 'CANCEL_RETRY': o.status='CANCELING'; break;
          case 'CANCEL_FORCE_DONE': o.status='CANCEL_DONE'; break;
        } return o;
      });
      refresh(`[${label}] 완료`);
    }
    function refresh(msg){ apply(); paint(); if(msg) alert(msg); }
  
    // 상세 모달
    function openDetail(id){
      state.detailId=id;
      const o=state.all.find(x=>x.id===id); if(!o) return;
      el.detailBody.innerHTML=`
        <div class="row g-3">
          <div class="col-md-7">
            <div class="d-flex gap-3">
              <img src="${o.productImg}" style="width:120px;height:90px;object-fit:cover;border-radius:8px">
              <div>
                <div class="fw-semibold">${o.productName}</div>
                <div class="text-body-secondary small">주문번호 ${o.orderNo} · ${o.orderedAt}</div>
                <div class="mt-1">상태: <span class="badge ${BADGE[o.status]}">${LABEL[o.status]}</span></div>
              </div>
            </div>
            <hr>
            <dl class="row mb-0">
              <dt class="col-4 col-md-3">구매자</dt><dd class="col-8 col-md-9">${o.buyer} (${o.phone})</dd>
              <dt class="col-4 col-md-3">결제수단</dt><dd class="col-8 col-md-9">${o.payMethod||'-'}</dd>
              <dt class="col-4 col-md-3">환불정보</dt><dd class="col-8 col-md-9">${o.refundInfo||'-'}</dd>
              <dt class="col-4 col-md-3">배송정보</dt><dd class="col-8 col-md-9">${o.shippingInfo||'-'}</dd>
              <dt class="col-4 col-md-3">메모</dt><dd class="col-8 col-md-9">${o.memo||'-'}</dd>
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
      setTxt(el.detailFoot, `ID #${o.id} · 최근 요청일 ${o.reqDate}`);
      showModal('#mdCancelDetail');
    }
  
    // 바인딩
    function bind(){
      // 출력/내보내기
      const exportCSV=()=>{
        if(!state.filtered.length) return alert('내보낼 데이터가 없습니다.');
        const headers=['주문번호','주문시각','구매자','연락처','상품명','상품금액','수량','상태','배송방법','배송비결제','취소요청일','환불정보','배송정보','결제금액'];
        const rows=state.filtered.map(o=>[o.orderNo,o.orderedAt,o.buyer,o.phone,o.productName,o.price,o.qty,(LABEL[o.status]||o.status),o.shipMethod,o.shipPay,o.reqDate,o.refundInfo,o.shippingInfo,o.payTotal]);
        const needs=/["\n,]/, dbl=/"/g;
        const esc=s=>{s=String(s??''); return needs.test(s)?'"'+s.replace(dbl,'""')+'"':s;};
        const csv='\uFEFF'+[headers.map(esc).join(','), ...rows.map(r=>r.map(esc).join(','))].join('\r\n');
        const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob);
        const a=document.createElement('a'); a.href=url; a.download='cancel_'+Date.now()+'.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      };
      el.btnPrintTop?.addEventListener('click',()=>window.print());
      el.btnPrintM  ?.addEventListener('click',()=>window.print());
      el.btnExportTop?.addEventListener('click',exportCSV);
      el.btnExportM  ?.addEventListener('click',exportCSV);
  
      // 도움말
      el.btnHelp?.addEventListener('click',()=>alert('• 취소승인: 환불 진행 후 상태가 변경됩니다.\n• 자동환불 실패 시 강제 취소완료로 처리 후 별도 정산하세요.'));
  
      // 검색
      el.btnSearch?.addEventListener('click',e=>{ e.preventDefault(); state.keyword=el.keyword?.value||''; state.page=1; apply(); paint(); });
      el.keyword?.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); el.btnSearch.click(); }});
  
      // 고급 검색
      el.btnAdvanced?.addEventListener('click',()=>{ if(window.bootstrap&&el.mdAdvanced) new bootstrap.Modal(el.mdAdvanced).show(); });
      el.formAdvanced?.addEventListener('submit',e=>{
        e.preventDefault();
        state.adv.from=el.advFrom?.value||''; state.adv.to=el.advTo?.value||'';
        const set=new Set(); (el.advStatus?.querySelectorAll('input[name="advStatusChk"]:checked')||[]).forEach(i=>set.add(i.value));
        state.adv.statuses=set; state.adv.memo=el.advMemo?.value||'';
        if(window.bootstrap&&el.mdAdvanced) bootstrap.Modal.getInstance(el.mdAdvanced)?.hide();
        state.page=1; apply(); paint();
      });
  
      // 완료 탭으로 점프
      el.jumpDone?.addEventListener('click',e=>{
        e.preventDefault(); state.status='CANCEL_DONE'; state.page=1; apply(); paint();
        const u=new URL(location.href); u.searchParams.set('status',state.status); history.replaceState(null,'',u);
      });
  
      // 전체 선택
      el.checkAll?.addEventListener('change',()=>{
        const checked=!!el.checkAll.checked; state.selected.clear();
        $$('#tbodyCancel .rowchk').forEach(c=>{
          c.checked=checked; const id=Number(c.closest('tr')?.dataset.id);
          if(checked&&id) state.selected.add(id);
        });
        setTxt(el.selCount,state.selected.size);
      });
  
      // 페이징
      el.pgPrev?.addEventListener('click',e=>{ e.preventDefault(); if(state.page>1){ state.page--; paint(); }});
      el.pgNext?.addEventListener('click',e=>{ e.preventDefault(); const total=Math.max(1,Math.ceil(state.filtered.length/state.pageSize)); if(state.page<total){ state.page++; paint(); }});
  
      // 일괄 버튼
      $$('[data-action]').forEach(btn=>btn.addEventListener('click',e=>{ e.preventDefault(); runBulk(btn.dataset.action); }));
  
      // 고급 상태칩 1회 렌더
      if(el.advStatus && !el.advStatus.children.length){
        el.advStatus.innerHTML=STATUS_ORDER.map(s=>`
          <label class="form-check form-check-inline">
            <input class="form-check-input" type="checkbox" name="advStatusChk" value="${s}">
            <span class="form-check-label">${LABEL[s]}</span>
          </label>`).join('');
      }
  
      // 상세 모달 버튼 동작
      el.btnDetailApprove?.addEventListener('click',()=>{
        const o=state.all.find(x=>x.id===state.detailId); if(!o) return;
        o.status='CANCELING'; refresh('취소승인 처리되었습니다.');
      });
      el.btnDetailRetry?.addEventListener('click',()=>{
        const o=state.all.find(x=>x.id===state.detailId); if(!o) return;
        o.status='CANCELING'; refresh('자동환불을 재시도했습니다.');
      });
      el.btnDetailReject?.addEventListener('click',()=>{
        const o=state.all.find(x=>x.id===state.detailId); if(!o) return;
        o.status='CANCEL_REQUEST'; refresh('취소거절 처리되었습니다.');
      });
      el.btnDetailForceDone?.addEventListener('click',()=>{
        const o=state.all.find(x=>x.id===state.detailId); if(!o) return;
        if(!confirm('수동 환불 후 강제 취소완료 처리할까요?')) return;
        o.status='CANCEL_DONE'; refresh('강제 취소완료 처리 완료');
      });
    }
  
    // 초기화
    function init(){
      if(!LABEL[state.status]) state.status='ALL';
      apply(); bind(); paint();
    }
    init();
  })();
  