/* /admin/assets/js/comment-manage.js — 댓글 관리 (좌측: 포스트/게시판 탭, 우측: 상태 셀렉트, 고급검색) */
(() => {
    "use strict";
    const $  = (s,r=document)=>r.querySelector(s);
    const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
    const html=String.raw;
    const fmt=(n)=>(n||0).toLocaleString('ko-KR');
    const withBS=(cb)=>{ if(window.bootstrap) return cb(); window.addEventListener('load',()=>window.bootstrap&&cb(),{once:true}); };
  
    const STORAGE_KEY='admin.comments.v1';
  
    // 데모 마스터
    const TARGET_TYPES = [
      {id:'POST', name:'포스트'},
      {id:'BOARD', name:'게시판'},
    ];
    const BOARDS = [
      {id:'jeju-news', name:'제주살이 뉴스'},
      {id:'picjeju-market', name:'픽제주 장터'},
      {id:'pickpoint-exchange', name:'픽포인트 거래소'},
    ];
    const LEGACY_BOARD_MAP = {
      notice: 'jeju-news',
      qna: 'picjeju-market',
      free: 'picjeju-market',
      review: 'jeju-news',
      '공지사항': 'jeju-news',
      '문의게시판': 'picjeju-market',
      '자유게시판': 'picjeju-market',
      '리뷰게시판': 'jeju-news',
    };
    const CMT_STATUS = [
      {id:'PUBLISHED', label:'공개', badge:'text-bg-success'},
      {id:'HIDDEN',    label:'숨김', badge:'text-bg-secondary'},
      {id:'PENDING',   label:'대기', badge:'text-bg-warning'},
    ];
    const stObj = id=>CMT_STATUS.find(s=>s.id===id)||CMT_STATUS[0];
    const targetObj = id=>TARGET_TYPES.find(t=>t.id===id)||TARGET_TYPES[1];
    const boardObj = (row, index=0) => {
      const id = String(row?.board || '').trim();
      const name = String(row?.boardName || '').trim();
      const byId = BOARDS.find(b=>b.id===id);
      if (byId) return byId;
      const byName = BOARDS.find(b=>b.name===name);
      if (byName) return byName;
      const mappedId = LEGACY_BOARD_MAP[id] || LEGACY_BOARD_MAP[name];
      const mapped = BOARDS.find(b=>b.id===mappedId);
      if (mapped) return mapped;
      if (!id && !name) return BOARDS[index % BOARDS.length];
      return { id: id || name, name: name || id };
    };
    const inferTargetType = (row, index=0) => {
      if (row?.targetType === 'POST' || row?.targetType === 'BOARD') return row.targetType;
      const hay = `${row?.board || ''} ${row?.boardName || ''}`.toLowerCase();
      if (hay.includes('post') || hay.includes('포스트')) return 'POST';
      return index % 5 === 0 ? 'POST' : 'BOARD';
    };
  
    const el = {
      tabs: $('#cmtTabs'),
      // 상태 셀렉트
      statusSel: $('#cmtStatusSel'),
  
      tbody: $('#cmtTbody'),
      empty: $('#cmtEmpty'),
      loader:$('#cmtLoader'),
      checkAll: $('#cmtCheckAll'),
      selCount: $('#cmtSelCount'),
      pgPrev: $('#cmtPgPrev'), pgNext: $('#cmtPgNext'), pgNow: $('#cmtPgNow'), pgTotal: $('#cmtPgTotal'),
      sortLabel: $('#cmtSortLabel'),
      keyword: $('#cmtKeyword'), btnSearch: $('#cmtBtnSearch'),
      btnAdvanced: $('#cmtBtnAdvanced'), mdAdvanced: $('#mdCmtAdvanced'), formAdvanced: $('#formCmtAdvanced'),
      advStatusWrap: $('#cmtAdvStatus'), advBoard: $('#cmtAdvBoard'), advMemo: $('#cmtAdvMemo'),
      minLikes: $('#cmtMinLikes'), minReports: $('#cmtMinReports'),
      btnPrint: $('#btnPrint'), btnExport: $('#btnExport'),
      btnPrintM: $('#cmtBtnPrintM'), btnExportM: $('#cmtBtnExportM'),
      mdDetail: $('#mdCmtDetail'), detailBody: $('#cmtDetailBody'),
    };
  
    const state = {
      tab: { targetType:'ALL' }, // 좌측=포스트/게시판, 우측 상태는 statusSel로 제어
      topStatus:'ALL', // 'ALL' | 'PUBLISHED' | 'HIDDEN' | 'PENDING'
      sort:'recent', // recent | likes | reports
      page:1, perPage:12,
      keyword:'',
      adv:{ statuses:new Set(), targetType:'', memo:'', minLikes:0, minReports:0 },
      sel:new Set(),
    };
  
    // ==== data io
    function seedIfEmpty(){
      if (localStorage.getItem(STORAGE_KEY)) return;
      const rows=[]; let id=10000; const now=Date.now();
      const texts=['좋아요!','도움이 되었습니다','문의 드립니다','동의합니다','비밀댓글입니다','품절인가요?','배송이 느려요','최고예요!'];
      for (let i=0;i<120;i++){
        const target = TARGET_TYPES[i%TARGET_TYPES.length];
        const b = target.id === 'POST' ? {id:'post', name:'포스트'} : BOARDS[i%BOARDS.length];
        const st = i%9===0?'PENDING':(i%4===0?'HIDDEN':'PUBLISHED');
        rows.push({
          id:String(id++),
          targetType: target.id,
          board:b.id,
          boardName:b.name,
          postTitle:`${target.name} 글 #${(i%37)+1}`,
          content:texts[i%texts.length] + ' - 운영자가 검토할 예시 댓글입니다.',
          author:(i%3===0?'운영팀':'사용자'+((i%20)+1)),
          likes:Math.floor(Math.random()*50),
          reports:Math.floor(Math.random()*8),
          status:st,
          createdAt:new Date(now - (i*3600_000*6 + Math.random()*864000)).toISOString()
        });
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    }
    const load=()=>{ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch{return[]} };
    const save=(rows)=>localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));

    function normalizeRows(){
      const rows = load();
      let changed = false;
      rows.forEach((row, index) => {
        const targetType = inferTargetType(row, index);
        if (row.targetType !== targetType) {
          row.targetType = targetType;
          changed = true;
        }
        if (targetType === 'POST' && (row.board !== 'post' || row.boardName !== '포스트')) {
          row.board = 'post';
          row.boardName = '포스트';
          changed = true;
        } else if (targetType === 'BOARD') {
          const board = boardObj(row, index);
          if (row.board !== board.id || row.boardName !== board.name) {
            row.board = board.id;
            row.boardName = board.name;
            changed = true;
          }
        }
      });
      if (changed) save(rows);
    }
  
    // ==== tabs (좌측: 포스트/게시판)
    function buildTabs(){
      const rows = load();
      const targets = [{id:'ALL', name:'전체'}, ...TARGET_TYPES];
      const counts = targets.reduce((a,t)=>{
        a[t.id] = t.id==='ALL' ? rows.length : rows.filter((r, index)=>inferTargetType(r, index)===t.id).length; return a;
      }, {});
      el.tabs.innerHTML = targets.map(t=>`
        <li class="nav-item" role="presentation">
          <button type="button" class="nav-link ${state.tab.targetType===t.id?'active':''}" data-tab="targetType" data-value="${t.id}">
            ${t.name}<span class="badge text-bg-primary ms-1">${fmt(counts[t.id])}</span>
          </button>
        </li>
      `).join('');
    }
    function bindTabs(){
      el.tabs?.addEventListener('click',(e)=>{
        const btn=e.target.closest('.nav-link'); if(!btn) return;
        const val=btn.dataset.value;
        state.tab.targetType=val;
        state.page=1; state.sel.clear(); render();
      });
    }
  
    // ==== 상태 셀렉트
    function buildStatusSelect(){
      if(!el.statusSel) return;
      const rows=load();
      const RIGHT=[
        {id:'ALL',label:'전체'},
        {id:'PUBLISHED',label:'공개'},
        {id:'HIDDEN',label:'숨김'},
        {id:'PENDING',label:'대기'},
      ];
      const counts = RIGHT.reduce((a,s)=>{
        a[s.id] = s.id==='ALL'? rows.length : rows.filter(r=>r.status===s.id).length; return a;
      },{});
      el.statusSel.innerHTML = RIGHT.map(s=>
        `<option value="${s.id}" ${state.topStatus===s.id?'selected':''}>${s.label} (${counts[s.id]||0})</option>`
      ).join('');
    }
    function bindStatusSelect(){
      el.statusSel?.addEventListener('change', ()=>{
        state.topStatus = el.statusSel.value || 'ALL';
        state.page=1; render();
      });
    }
  
    // ==== filter/sort/paginate
    function sortRows(rows){
      const fn = state.sort==='likes' ? (a,b)=> (b.likes||0)-(a.likes||0)
          : state.sort==='reports' ? (a,b)=> (b.reports||0)-(a.reports||0)
          : (a,b)=> new Date(b.createdAt)-new Date(a.createdAt);
      rows.sort(fn);
    }
    function matchKeyword(r, kw){
      if (!kw || !(kw=kw.trim())) return true;
      const hay = `${r.content} ${r.author} ${r.boardName} ${r.postTitle}`.toLowerCase();
      return hay.includes(kw.toLowerCase());
    }
    function matchAdvanced(r){
      const a = state.adv;
      if (a.statuses.size>0 && !a.statuses.has(r.status)) return false;
      if (a.targetType && inferTargetType(r)!==a.targetType) return false;
      if (a.memo){
        const hay = `${r.content} ${r.author} ${r.boardName} ${r.postTitle}`.toLowerCase();
        if (!hay.includes(a.memo.toLowerCase())) return false;
      }
      if (a.minLikes && (r.likes||0) < a.minLikes) return false;
      if (a.minReports && (r.reports||0) < a.minReports) return false;
      return true;
    }
    function applyTabFilter(rows){
      let r=rows.slice();
      if (state.tab.targetType!=='ALL') r = r.filter((x, index)=>inferTargetType(x, index)===state.tab.targetType);
      return r;
    }
    function applyTopStatus(rows){
      if (state.topStatus==='ALL') return rows;
      return rows.filter(x=>x.status===state.topStatus);
    }
    function paginate(rows){
      const total = Math.max(1, Math.ceil(rows.length/state.perPage));
      state.page = Math.min(Math.max(1,state.page), total);
      const start=(state.page-1)*state.perPage;
      const pageRows=rows.slice(start,start+state.perPage);
      $('#cmtPgNow').textContent=String(state.page);
      $('#cmtPgTotal').textContent=String(total);
      $('#cmtPgPrev').parentElement.classList.toggle('disabled', state.page<=1);
      $('#cmtPgNext').parentElement.classList.toggle('disabled', state.page>=total);
      return pageRows;
    }
  
    // ==== render
    function render(){
      const all=load();
      buildTabs();
      buildStatusSelect();
  
      let rows = applyTabFilter(all);
      rows = applyTopStatus(rows);
      if (state.keyword.trim()) rows = rows.filter(r=>matchKeyword(r, state.keyword));
      rows = rows.filter(matchAdvanced);
      sortRows(rows);
      const pageRows = paginate(rows);
  
      el.empty.classList.toggle('d-none', pageRows.length>0);
      el.tbody.innerHTML = pageRows.map(r=>{
        const st = stObj(r.status);
        const target = targetObj(inferTargetType(r));
        const visibilityIcon = r.status === 'HIDDEN' ? 'ri-eye-off-line' : 'ri-eye-line';
        const visibilityTitle = r.status === 'HIDDEN' ? '공개로 변경' : '숨김 처리';
        const ch = state.sel.has(r.id) ? 'checked':'';
        return html`
          <tr data-id="${r.id}">
            <td><input type="checkbox" class="row-check form-check-input" ${ch}></td>
            <td>
              <button type="button" class="admin-title-action text-truncate comment-detail-trigger">${r.content}</button>
              <button type="button" class="admin-title-action text-truncate small text-body-secondary comment-detail-trigger">${r.postTitle}</button>
            </td>
            <td>
              <span class="badge text-bg-light">${target.name}</span>
              <div class="small text-body-secondary mt-1">${r.boardName}</div>
            </td>
            <td class="text-center"><span class="badge ${st.badge}">${st.label}</span></td>
            <td class="text-center">${fmt(r.likes)}</td>
            <td class="text-center">${fmt(r.reports)}</td>
            <td class="text-center">${r.author}</td>
            <td class="text-center">${r.createdAt.slice(0,10)}</td>
            <td class="text-end">
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-sm btn-light btn-visibility" title="${visibilityTitle}" aria-label="${visibilityTitle}">
                  <i class="${visibilityIcon}"></i>
                </button>
                <button class="btn btn-sm btn-light" data-bs-toggle="dropdown"><i class="ri-more-2-line"></i></button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><a class="dropdown-item act-approve" href="#">공개</a></li>
                  <li><a class="dropdown-item act-hide" href="#">숨김</a></li>
                  <li><a class="dropdown-item act-pending" href="#">대기</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item text-danger act-delete" href="#">삭제</a></li>
                </ul>
              </div>
            </td>
          </tr>
        `;
      }).join('');
      syncCheckAll();
      el.selCount.textContent = String(state.sel.size);
    }
    function syncCheckAll(){
      const checks = $$('.row-check', el.tbody);
      const checked = checks.filter(c=>c.checked).length;
      el.checkAll.checked = (checked===checks.length && checks.length>0);
      el.checkAll.indeterminate = (checked>0 && checked<checks.length);
    }
  
    // ==== actions
    function applyAction(ids, action){
      if (!ids.length) return 0;
      const rows = load();
      let changed=0;
      if (action==='CMT_DELETE'){
        for (const id of ids){ const i=rows.findIndex(r=>r.id===id); if(i>=0){ rows.splice(i,1); changed++; } }
      } else {
        const to = action==='CMT_APPROVE'?'PUBLISHED':(action==='CMT_HIDE'?'HIDDEN':'PENDING');
        for (const id of ids){ const r=rows.find(x=>x.id===id); if(r&&r.status!==to){ r.status=to; changed++; } }
      }
      if (changed) save(rows);
      return changed;
    }
    function toast(msg){ if(window.bootstrap?.Toast){ let box=$('#__toast'); if(!box){box=document.createElement('div'); box.id='__toast'; box.className='toast-container position-fixed bottom-0 end-0 p-3'; document.body.appendChild(box);} const t=document.createElement('div'); t.className='toast text-bg-dark'; t.innerHTML=`<div class="d-flex"><div class="toast-body">${msg}</div><button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`; box.appendChild(t); new bootstrap.Toast(t,{delay:1800}).show(); setTimeout(()=>t.remove(),2200);} else alert(msg); }
  
    // ==== binds
    function bindSort(){
      document.body.addEventListener('click',(e)=>{
        const a=e.target.closest('[data-sort]'); if(!a) return; e.preventDefault();
        state.sort = a.getAttribute('data-sort');
        const menu=a.closest('.dropdown-menu'); $$('a.dropdown-item',menu).forEach(x=>x.classList.remove('active')); a.classList.add('active');
        el.sortLabel.textContent = {recent:'최신순',likes:'추천순',reports:'신고많은순'}[state.sort] || '최신순';
        render();
      });
    }
    function bindSearch(){
      el.btnSearch?.addEventListener('click',()=>{ state.keyword=el.keyword.value||''; state.page=1; render(); });
      el.keyword?.addEventListener('keydown',(e)=>{ if(e.key==='Enter'){ e.preventDefault(); el.btnSearch.click(); }});
    }
    function bindPage(){
      el.pgPrev.addEventListener('click',(e)=>{ e.preventDefault(); if(el.pgPrev.parentElement.classList.contains('disabled'))return; state.page--; render(); });
      el.pgNext.addEventListener('click',(e)=>{ e.preventDefault(); if(el.pgNext.parentElement.classList.contains('disabled'))return; state.page++; render(); });
    }
    function bindChecks(){
      el.checkAll.addEventListener('change',()=>{
        const ids = $$('#cmtTbody tr').map(tr=>tr.dataset.id);
        if (el.checkAll.checked) ids.forEach(id=>state.sel.add(id)); else ids.forEach(id=>state.sel.delete(id));
        render();
      });
      el.tbody.addEventListener('change',(e)=>{
        const ck=e.target.closest('.row-check'); if(!ck) return;
        const id=ck.closest('tr').dataset.id; if(ck.checked) state.sel.add(id); else state.sel.delete(id);
        syncCheckAll(); el.selCount.textContent=String(state.sel.size);
      });
    }
    function bindToolbar(){
      document.body.addEventListener('click',(e)=>{
        const btn=e.target.closest('[data-action]'); if(!btn) return;
        const action=btn.getAttribute('data-action');
        let ids=Array.from(state.sel); if(!ids.length) ids=$$('.row-check:checked', el.tbody).map(c=>c.closest('tr').dataset.id);
        if(!ids.length) return alert('선택된 항목이 없습니다.');
        if(action==='CMT_DELETE' && !confirm('삭제하시겠습니까?')) return;
        const changed=applyAction(ids, action);
        if (changed){ state.sel.clear(); render(); }
        if (action==='CMT_APPROVE') toast('공개로 변경했습니다.');
        if (action==='CMT_HIDE')    toast('숨김으로 변경했습니다.');
        if (action==='CMT_PENDING') toast('대기로 변경했습니다.');
        if (action==='CMT_DELETE')  toast('삭제했습니다.');
      });
  
      // 행별 메뉴 + 보기
el.tbody.addEventListener('click', (e) => {
    const tr = e.target.closest('tr');
    if (!tr) return;
    const id = tr.dataset.id;
    const row = load().find(r => r.id === id);
    if (!row) return;
  
    // ✅ 상세보기 트리거: '보기 버튼' + '댓글 본문(text-truncate)' 클릭 시
    if (e.target.closest('.btn-visibility')) {
      const action = row.status === 'HIDDEN' ? 'CMT_APPROVE' : 'CMT_HIDE';
      applyAction([id], action);
      render();
      toast(action === 'CMT_APPROVE' ? '공개로 변경했습니다.' : '숨김으로 변경했습니다.');
      return;
    }

    if (e.target.closest('.comment-detail-trigger')) {
      el.detailBody.innerHTML = `
        <div class="d-flex flex-column gap-2">
          <div class="h5 mb-1">${row.postTitle}</div>
          <div class="text-body-secondary small">
            ${targetObj(inferTargetType(row)).name} · ${row.boardName} · ${row.author} · ${row.createdAt.slice(0,16).replace('T',' ')}
          </div>
          <hr>
          <div style="white-space:pre-wrap">${row.content}</div>
        </div>`;
      withBS(() => bootstrap.Modal.getOrCreateInstance(el.mdDetail).show());
      return;
    }
  
    // === 나머지 액션 동일 ===
    if (e.target.closest('.act-approve')) { applyAction([id], 'CMT_APPROVE'); render(); toast('공개로 변경했습니다.'); }
    if (e.target.closest('.act-hide'))    { applyAction([id], 'CMT_HIDE'); render(); toast('숨김으로 변경했습니다.'); }
    if (e.target.closest('.act-pending')) { applyAction([id], 'CMT_PENDING'); render(); toast('대기로 변경했습니다.'); }
    if (e.target.closest('.act-delete'))  { 
      if (confirm('삭제하시겠습니까?')) { 
        applyAction([id], 'CMT_DELETE'); render(); toast('삭제했습니다.'); 
      }
    }
  });
  
  
      // 출력/내보내기
      function exportCSV(){
        const rows=load();
        const header=['id','targetType','board','boardName','postTitle','content','author','status','likes','reports','createdAt'];
        const lines=[header.join(',')];
        rows.forEach(r=>{
          const vals=[r.id,inferTargetType(r),r.board,r.boardName,r.postTitle,r.content,r.author,r.status,r.likes||0,r.reports||0,r.createdAt];
          lines.push(vals.map(v=>{const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;}).join(','));
        });
        const blob=new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8'});
        const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='comments.csv'; a.click(); URL.revokeObjectURL(a.href);
      }
      el.btnExport?.addEventListener('click', exportCSV);
      el.btnExportM?.addEventListener('click', exportCSV);
      el.btnPrint?.addEventListener('click',()=>window.print());
      el.btnPrintM?.addEventListener('click',()=>window.print());
    }
    function bindAdvanced(){
      el.btnAdvanced?.addEventListener('click', ()=>{
        // 상태 체크/구분 select 초기화
        el.advStatusWrap.innerHTML = CMT_STATUS.map(s=>`
          <label class="form-check form-check-inline">
            <input class="form-check-input cmt-adv-status" type="checkbox" value="${s.id}">
            <span class="form-check-label">${s.label}</span>
          </label>`).join('');
        el.advBoard.innerHTML = `<option value="">전체</option>` + TARGET_TYPES.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
        withBS(()=> bootstrap.Modal.getOrCreateInstance(el.mdAdvanced).show());
      });
      el.formAdvanced?.addEventListener('submit',(e)=>{
        e.preventDefault();
        state.adv.statuses = new Set($$('.cmt-adv-status').filter(i=>i.checked).map(i=>i.value));
        state.adv.targetType = el.advBoard.value || '';
        state.adv.memo  = el.advMemo.value || '';
        state.adv.minLikes   = Number(el.minLikes.value||0);
        state.adv.minReports = Number(el.minReports.value||0);
        state.page=1;
        render();
        withBS(()=> bootstrap.Modal.getOrCreateInstance(el.mdAdvanced).hide());
      });
    }
  
    function init(){
      seedIfEmpty();
      normalizeRows();
      buildTabs();
      buildStatusSelect();
      bindTabs();
      bindStatusSelect();
      bindSort(); bindSearch(); bindPage(); bindChecks(); bindToolbar(); bindAdvanced();
      render();
    }
    init();
  })();
