/* /admin/assets/js/point.js — 픽포인트 발급 현황 */
(() => {
    const $  = (s, r=document)=>r.querySelector(s);
    const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
    const fmt=(n)=> (n||0).toLocaleString('ko-KR');
    const qs = new URLSearchParams(location.search);
  
    // -----------------------------
    // 상태 탭 정의
    // -----------------------------
    const STATUS_ORDER = ['ALL','PLUS','MINUS'];
    const LABEL = { ALL:'전체', PLUS:'지급', MINUS:'차감' };
    const BADGE = {
      ALL:'text-bg-secondary',
      PLUS:'text-bg-success',
      MINUS:'text-bg-danger'
    };
  
    // -----------------------------
    // 데모 데이터
    // -----------------------------
    const DEMO = [
      {
        id: 1, date: '2025.10.06 17:25', buyer: '물비늘',
        diff: +500, orderNo: '제주살이 퀴즈 - 문제를 풀어보는 제주살이 끝판!',
        reason: '상품구매 처리 [202509235759143]', handler: '시스템 자동발급'
      },
      {
        id: 2, date: '2025.10.06 17:25', buyer: '도토리',
        diff: -1000, orderNo: '', reason: '10월 2일 목요 나이트 러닝!', handler: '물비늘'
      },
      {
        id: 3, date: '2025.10.06 17:25', buyer: '밍',
        diff: -1000, orderNo: '', reason: '10월 2일 목요 나이트 러닝!', handler: '물비늘'
      },
      {
        id: 4, date: '2025.10.06 17:25', buyer: '니모',
        diff: +3000, orderNo: '', reason: '픽제주 퀴즈 정답!', handler: '물비늘'
      }
    ];
  
    // -----------------------------
    // 상태 객체
    // -----------------------------
    const state = {
      all: DEMO,
      filtered: [],
      keyword: '',
      status: qs.get('status') || 'ALL',
      page: 1,
      pageSize: 10
    };
  
    // -----------------------------
    // 엘리먼트 참조
    // -----------------------------
    const el = {
      tabs: $('#orderTabs'),
      tbody: $('#tbodyOrder'),
      keyword: $('#keyword'),
      btnSearch: $('#btnSearch'),
      emptyList: $('#emptyList'),
      allpoint: $('#allpoint'),
      plusPoint: $('#plusPoint'),
      minusPoint: $('#minusPoint'),
      pointCount: $('#pointCount'),
  
      pgPrev: $('#pgPrev'),
      pgNext: $('#pgNext'),
      pgNow: $('#pgNow'),
      pgTotal: $('#pgTotal')
    };
  
    const show  = (n,y)=>n&&n.classList.toggle('d-none',!y);
    const setTxt= (n,t)=>n&&(n.textContent=t);
  
    // -----------------------------
    // 총 포인트 계산
    // -----------------------------
    function renderTotal(){
      const total = state.all.reduce((sum,o)=> sum + (o.diff||0), 0);
      const plus = state.all.filter(o => o.diff > 0).reduce((sum,o)=> sum + (o.diff||0), 0);
      const minus = Math.abs(state.all.filter(o => o.diff < 0).reduce((sum,o)=> sum + (o.diff||0), 0));
      setTxt(el.allpoint, fmt(total));
      setTxt(el.plusPoint, fmt(plus));
      setTxt(el.minusPoint, fmt(minus));
      setTxt(el.pointCount, fmt(state.all.length));
    }
  
    // -----------------------------
    // 필터 적용
    // -----------------------------
    function apply(){
        const k = (state.keyword||'').trim().toLowerCase();
      
        let list = state.all.filter(o=>{
          if(state.status==='ALL') return true;
          if(state.status==='PLUS') return o.diff>0;
          if(state.status==='MINUS') return o.diff<0;
        });
      
        if(k){
          list = list.filter(o => (
            (o.buyer + o.orderNo + o.reason + o.handler + o.diff) // ✅ diff 추가
            .toLowerCase().includes(k)
          ));
        }
      
        state.filtered = list;
      }
      
  
    // -----------------------------
    // 탭 렌더링
    // -----------------------------
    function renderTabs(){
      const cnt = {ALL:0, PLUS:0, MINUS:0};
      state.all.forEach(o=>{
        cnt.ALL++;
        if(o.diff>0) cnt.PLUS++;
        if(o.diff<0) cnt.MINUS++;
      });
  
      el.tabs.innerHTML = STATUS_ORDER.map(s=>`
        <li class="nav-item flex-shrink-0">
          <button class="nav-link ${state.status===s?'active':''}" data-status="${s}">
            ${LABEL[s]} <span class="badge text-bg-primary ms-1">${cnt[s]||0}</span>
          </button>
        </li>
      `).join('');
  
      $$('#orderTabs [data-status]').forEach(btn=>{
        btn.addEventListener('click',()=>{
          state.status = btn.dataset.status;
          state.page = 1;
          apply();
          paint();
          const u = new URL(location.href);
          u.searchParams.set('status', state.status);
          history.replaceState(null,'',u);
        });
      });
    }
  
    // -----------------------------
    // 테이블 렌더링
    // -----------------------------
    function renderTable(){
      const start = (state.page-1)*state.pageSize;
      const rows = state.filtered.slice(start, start+state.pageSize);
  
      show(el.emptyList, !rows.length);
  
      el.tbody.innerHTML = rows.map(o=>`
        <tr>
          <td>${o.date}</td>
          <td>${o.buyer}</td>
          <td class="text-end ${o.diff>0?'text-success':'text-danger'}">
            ${(o.diff>0?'+':'')+fmt(o.diff)} P
          </td>
          <td>${o.orderNo || '-'}</td>
          <td>${o.reason || '-'}</td>
          <td>${o.handler || '-'}</td>
        </tr>
      `).join('');
    }
  
    // -----------------------------
    // 페이징
    // -----------------------------
    function renderPaging(){
      const total = Math.max(1, Math.ceil(state.filtered.length/state.pageSize));
      setTxt(el.pgNow, state.page);
      setTxt(el.pgTotal, total);
      el.pgPrev?.classList.toggle('disabled', state.page<=1);
      el.pgNext?.classList.toggle('disabled', state.page>=total);
    }
  
    // -----------------------------
    // 전체 렌더링 (cancel.js 패턴)
    // -----------------------------
    function paint(){
      renderTabs();
      renderTable();
      renderPaging();
    }
  
    // -----------------------------
    // 이벤트 바인딩
    // -----------------------------
    function bind(){
      // 검색
      el.btnSearch?.addEventListener('click', e=>{
        e.preventDefault();
        state.keyword = el.keyword.value;
        state.page = 1;
        apply();
        paint();
      });
      el.keyword?.addEventListener('keydown', e=>{
        if(e.key==='Enter'){ e.preventDefault(); el.btnSearch.click(); }
      });
  
      // 페이징
      el.pgPrev?.addEventListener('click', e=>{
        e.preventDefault();
        if(state.page>1){ state.page--; paint(); }
      });
      el.pgNext?.addEventListener('click', e=>{
        e.preventDefault();
        const total = Math.max(1, Math.ceil(state.filtered.length/state.pageSize));
        if(state.page<total){ state.page++; paint(); }
      });
    }
  
    // -----------------------------
    // 초기화
    // -----------------------------
    function init(){
      renderTotal();
      apply();
      bind();
      paint();
    }
  
    init();
  })();
  
