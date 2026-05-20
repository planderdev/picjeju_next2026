// /admin/assets/js/write.js
(() => {
    "use strict";
    const $  = (s,r=document)=>r.querySelector(s);
    const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
    const qs = new URLSearchParams(location.search);
    const show=(el,on)=>el&&el.classList.toggle('d-none',!on);
    const setTxt=(el,t)=>el&&(el.textContent=t);
    const withBS=(cb)=>{ if(window.bootstrap) return cb(); window.addEventListener('load',()=>window.bootstrap&&cb(),{once:true}); };
    const toTime=(s)=>{ if(!s) return NaN; const iso = s.includes('T')? s : s.replace(' ','T'); return new Date(iso).getTime(); };
  
    // ===== 데이터 정의 =====
    const BOARDS = ['전체', '제주살이 뉴스', '픽제주 장터', '픽포인트 거래소'];
    const BOARD_CATS = {
      '제주살이 뉴스': ['제주뉴스', '청년지원', '제주일자리'],
      '픽제주 장터': ['재능나눔/클래스', '나눔', '판매'],
      '픽포인트 거래소': ['구해요', '팔아요', '거래완료']
    };
    const STAT = ['NOTICE','VISIBLE','HIDDEN'];
    const SLAB = { NOTICE:'공지', VISIBLE:'노출', HIDDEN:'숨김' };
    const SBAD = { NOTICE:'text-bg-primary', VISIBLE:'text-bg-info', HIDDEN:'text-bg-secondary' };
  
    // ===== 엘리먼트 =====
    const el={
      tabs:$('#boardTabs'),
      tbody:$('#tbodyBoard'), empty:$('#emptyList'), loader:$('#loader'),
      checkAll:$('#checkAll'), selCount:$('#selCount'),
      pgPrev:$('#pgPrev'), pgNext:$('#pgNext'), pgNow:$('#pgNow'), pgTotal:$('#pgTotal'),
      btnSearch:$('#btnSearch'), keyword:$('#keyword'),
      sortLabel:$('#sortLabel'),
      btnNew:$('#btnNewBoard'),
      mdWrite:$('#mdBoardWrite'), bwTitle:$('#bwTitle'), bwBoard:$('#bwBoard'), bwCat:$('#bwCat'),
      editorHost:$('#boardEditor'), editorFallback:$('#boardEditorFallback'), btnBoardSave:$('#btnBoardSave'),
      mdDetail:$('#mdBoardDetail'), detailBody:$('#boardDetailBody'),
      // === 고급 검색 ===
      btnAdvanced : $('#btnAdvanced'),
      mdAdvanced  : $('#mdAdvanced'),
      formAdvanced: $('#formAdvanced'),
      advFrom     : $('#advFrom'),
      advTo       : $('#advTo'),
      advStatus   : $('#advStatus'),
      advBoard    : $('#advBoard'),
      advCat      : $('#advCat'),
      advMemo     : $('#advMemo'),
    };
  
    // ===== 데모 데이터 =====
    const DEMO = (()=>{ const a=[]; let id=1000; for(let i=0;i<42;i++){
      a.push({
        id:id--,
        title:`게시글 제목 ${i+1}`,
        board:BOARDS[(i%(BOARDS.length-1))+1],
        category: (() => {
            const b = BOARDS[(i % (BOARDS.length - 1)) + 1];
            const cats = BOARD_CATS[b] || [];
            return cats[i % cats.length] || '';
          })(),
        author:(i%3?'회원A':'운영자'),
        status:STAT[i%STAT.length],
        views:1000-i, comments:(i*2)%30, likes:(i*3)%50,
        created:`2025-09-${String((i%9)+1).padStart(2,'0')} ${String(10+(i%9)).padStart(2,'0')}:0${i%10}`,
        content:`<p>게시글 본문 ${i+1}</p>`
      });
    } return a; })();
  
    const state={
      all:DEMO,
      board:qs.get('board')||'전체',
      sort:qs.get('sort')||'recent',
      page:1, pageSize:10,
      keyword:'',
      selected:new Set(),
      filtered:[],
      adv:{ from:'', to:'', statuses:new Set(), board:'', cat:'', memo:'' }
    };
  
    // ===== 탭 =====
    function renderTabs(){
      const cnt=Object.fromEntries(BOARDS.map(b=>[b,0]));
      state.all.forEach(o=>{ cnt[o.board]=(cnt[o.board]||0)+1; cnt['전체']++; });
      el.tabs.innerHTML = BOARDS.map(b=>`
        <li class="nav-item flex-shrink-0">
          <button class="nav-link ${state.board===b?'active':''}" data-board="${b}">
            ${b} <span class="badge text-bg-primary ms-1">${cnt[b]||0}</span>
          </button>
        </li>`).join('');
    }
    el.tabs.addEventListener('click', e=>{
      const b=e.target.closest('[data-board]'); if(!b) return;
      state.board=b.dataset.board; state.page=1; apply(); paint();
      const u=new URL(location.href); u.searchParams.set('board',state.board); history.replaceState(null,'',u);
      $$('#boardTabs .nav-link').forEach(x=>x.classList.toggle('active', x===b));
    });
  
    // ===== 필터/정렬 =====
    function apply(){
      let list = state.all.filter(o => state.board==='전체' || o.board===state.board);
      const k=(state.keyword||'').trim().toLowerCase();
      if(k) list = list.filter(o => (o.title+o.author+o.board+o.category).toLowerCase().includes(k));
      list = list.filter(matchAdvanced);
      switch(state.sort){
        case 'views': list.sort((a,b)=>b.views-a.views); break;
        case 'comments': list.sort((a,b)=>b.comments-a.comments); break;
        case 'likes': list.sort((a,b)=>b.likes-a.likes); break;
        default: list.sort((a,b)=>b.id-a.id);
      }
      state.filtered=list; state.selected.clear(); el.checkAll&&(el.checkAll.checked=false);
    }
  
    function matchAdvanced(o){ return true; } // 간소화
  
    // ===== 표 렌더링 =====
    function renderTable(){
      const start=(state.page-1)*state.pageSize;
      const rows=state.filtered.slice(start,start+state.pageSize);
      show(el.empty,!rows.length);
  
      el.tbody.innerHTML = rows.map(o=>`
        <tr data-id="${o.id}">
          <td><input type="checkbox" class="rowchk form-check-input"></td>
          <td><a href="edit" class="fw-semibold text-dark text-decoration-none">${o.title}</a></td>
          <td>${o.board}</td>
          <td>${o.category}</td>
          <td class="text-center"><span class="badge ${SBAD[o.status]||'text-bg-secondary'}">${SLAB[o.status]||o.status}</span></td>
          <td class="text-center">${o.views}</td>
          <td class="text-center">${o.comments}</td>
          <td class="text-center">${o.likes}</td>
          <td class="text-center">${o.created}</td>
          <td class="text-end"> 
              <button class="btn btn-sm btn-light" data-bs-toggle="dropdown"><i class="ri-more-2-line"></i></button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item row-act" href="#" data-act="preview">미리보기</a></li>
                <li><a class="dropdown-item text-primary row-act" href="#" data-act="edit">수정</a></li>
                <li><a class="dropdown-item row-act" href="#" data-act="hide">숨김</a></li>
                <li><a class="dropdown-item text-danger row-act" href="#" data-act="delete">삭제</a></li>
              </ul> 
          </td>
        </tr>`).join('');
  
      $$('#tbodyBoard .rowchk').forEach(chk=>{
        chk.addEventListener('change', e=>{
          const id=Number(e.target.closest('tr').dataset.id);
          if(e.target.checked) state.selected.add(id); else state.selected.delete(id);
          setTxt(el.selCount,state.selected.size);
          if(el.checkAll) el.checkAll.checked = $$('#tbodyBoard .rowchk').every(c=>c.checked);
        });
      });
    }
  
    // ===== 행 액션 =====
    // ===== 행 액션 =====
document.addEventListener('click', e => {
    const a = e.target.closest('.row-act');
    if (!a) return;
    e.preventDefault();
  
    if (a.dataset.act === 'edit') {
      // 👉 단순 페이지 이동 (id 파라미터 없이)
      location.href = 'edit/';
      return;
    }
  
    if (a.dataset.act === 'preview') {
      alert('미리보기 기능은 데모 상태입니다.');
      return;
    }
  
    if (a.dataset.act === 'hide') {
      alert('숨김 처리 (데모)');
      return;
    }
  
    if (a.dataset.act === 'delete') {
      if (confirm('삭제하시겠습니까?')) alert('삭제 완료 (데모)');
      return;
    }
  });
  
  
    function renderPaging(){
      const total=Math.max(1,Math.ceil(state.filtered.length/state.pageSize));
      setTxt(el.pgNow,state.page); setTxt(el.pgTotal,total);
      el.pgPrev?.classList.toggle('disabled',state.page<=1);
      el.pgNext?.classList.toggle('disabled',state.page>=total);
    }
    function paint(){ show(el.loader,true); setTimeout(()=>{ show(el.loader,false); renderTable(); renderPaging(); setTxt(el.selCount,state.selected.size); },180); }
  
    // ===== 공통 =====
    function refresh(msg){ renderTabs(); apply(); paint(); if(msg) alert(msg); }
    function init(){ renderTabs(); apply(); paint(); }
    init();
  })();
  
