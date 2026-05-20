/* /admin/assets/js/report-block.js — 신고·차단 (좌측: 타입 탭, 우측: 상태 셀렉트, 고급검색) */
(() => {
    "use strict";
    const $  = (s,r=document)=>r.querySelector(s);
    const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
    const fmt=(n)=>(n||0).toLocaleString('ko-KR');
    const html=String.raw;
    const withBS=(cb)=>{ if(window.bootstrap) return cb(); window.addEventListener('load',()=>window.bootstrap&&cb(),{once:true}); };
  
    const STORAGE_KEY='admin.reports.v1';
  
    const TYPES = [
      {id:'REPORT', label:'신고'},
      {id:'BLOCK',  label:'차단'},
    ];
    const STATUS = [
      {id:'OPEN',   label:'처리중', badge:'text-bg-warning'},
      {id:'CLOSED', label:'종결',   badge:'text-bg-success'},
    ];
    const typeLabel = id => TYPES.find(t=>t.id===id)?.label || id;
    const stObj = id => STATUS.find(s=>s.id===id) || STATUS[0];
  
    const el = {
      tabs: $('#rbTabs'),
      // 상태 셀렉트
      statusSel: $('#rbStatusSel'),
  
      tbody: $('#rbTbody'),
      empty: $('#rbEmpty'),
      loader:$('#rbLoader'),
      checkAll: $('#rbCheckAll'),
      selCount: $('#rbSelCount'),
      pgPrev: $('#rbPgPrev'), pgNext: $('#rbPgNext'), pgNow: $('#rbPgNow'), pgTotal: $('#rbPgTotal'),
      sortLabel: $('#rbSortLabel'),
      keyword: $('#rbKeyword'), btnSearch: $('#rbBtnSearch'),
      btnAdvanced: $('#rbBtnAdvanced'), mdAdvanced: $('#mdRBAdvanced'), formAdvanced: $('#formRBAdvanced'),
      advTypeWrap: $('#rbAdvType'), advStatusWrap: $('#rbAdvStatus'),
      minSev: $('#rbMinSev'), minCount: $('#rbMinCount'), advMemo: $('#rbAdvMemo'),
      btnPrint: $('#rbBtnPrint'), btnExport: $('#rbBtnExport'),
      btnPrintM: $('#rbBtnPrintM'), btnExportM: $('#rbBtnExportM'),
      mdDetail: $('#mdRBDetail'), detailBody: $('#rbDetailBody'),
      detailReopen: $('#rbDetailReopen'), detailResolve: $('#rbDetailResolve'),
    };
  
    const state = {
      tab:{ type:'ALL' },        // 좌측: 타입 탭
      topStatus:'ALL',           // 우측: 상태 셀렉트 ALL|OPEN|CLOSED
      sort:'recent',             // recent | severity | count
      page:1, perPage:12,
      keyword:'',
      adv:{ types:new Set(), statuses:new Set(), minSev:0, minCount:0, memo:'' },
      sel:new Set(),
      focusedId:null,
    };
  
    // ==== data io
    function seedIfEmpty(){
      if (localStorage.getItem(STORAGE_KEY)) return;
      const rows=[];
      let id=4000; const now=Date.now();
      const reasons=['스팸/광고','욕설/비방','음란물','개인정보노출','도배','기타'];
      for (let i=0;i<80;i++){
        const type = i%3===0 ? 'BLOCK' : 'REPORT';
        const status = i%5===0 ? 'CLOSED' : 'OPEN';
        rows.push({
          id:String(id++),
          type,
          status,
          targetType: i%2===0?'댓글':'게시글',
          targetTitle: (i%2===0? '댓글':'게시글') + ' 제목 #' + ((i%37)+1),
          boardName: ['공지사항','문의게시판','자유게시판','리뷰게시판','픽포인트 거래소'][i%5],
          reason: reasons[i%reasons.length],
          severity: Math.floor(Math.random()*6), // 0~5
          count: Math.floor(Math.random()*12),   // 중복 신고 수
          reporter: (i%4===0?'운영팀':'user'+((i%50)+1)),
          createdAt: new Date(now - (i*3600_000*8 + Math.random()*864000)).toISOString(),
          detail: '신고/차단 사유 상세 내용입니다. 운영자가 검토할 수 있도록 샘플 문구를 제공합니다.'
        });
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    }
    const load=()=>{ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch{return[]} };
    const save=(rows)=>localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  
    // ==== tabs (좌측: 타입)
    function buildTabs(){
      const rows = load();
      const left = [{id:'ALL', label:'전체'}, ...TYPES];
      const counts = left.reduce((a,t)=>{
        a[t.id] = t.id==='ALL'? rows.length : rows.filter(r=>r.type===t.id).length; return a;
      },{});
      el.tabs.innerHTML = left.map(t=>`
        <li class="nav-item" role="presentation">
          <button type="button" class="nav-link ${state.tab.type===t.id?'active':''}" data-tab="type" data-value="${t.id}">
            ${t.label}<span class="badge text-bg-primary ms-1">${fmt(counts[t.id])}</span>
          </button>
        </li>
      `).join('');
    }
    function bindTabs(){
      el.tabs?.addEventListener('click',(e)=>{
        const btn=e.target.closest('.nav-link'); if(!btn) return;
        state.tab.type=btn.dataset.value;
        state.page=1; state.sel.clear(); render();
      });
    }
  
    // ==== 상태 셀렉트
    function buildStatusSelect(){
      if(!el.statusSel) return;
      const rows=load();
      const RIGHT=[{id:'ALL',label:'전체'},{id:'OPEN',label:'처리중'},{id:'CLOSED',label:'종결'}];
      const counts = RIGHT.reduce((a,s)=>{
        a[s.id] = s.id==='ALL'? rows.length : rows.filter(r=>r.status===s.id).length; return a;
      },{});
      el.statusSel.innerHTML = RIGHT.map(s =>
        `<option value="${s.id}" ${state.topStatus===s.id?'selected':''}>${s.label} (${counts[s.id]||0})</option>`
      ).join('');
    }
    function bindStatusSelect(){
      el.statusSel?.addEventListener('change', ()=>{
        state.topStatus = el.statusSel.value || 'ALL';
        state.page=1; render();
      });
    }
  
    // ==== filter/sort/page
    function sortRows(rows){
      const fn = state.sort==='severity' ? (a,b)=> (b.severity||0)-(a.severity||0)
          : state.sort==='count' ? (a,b)=> (b.count||0)-(a.count||0)
          : (a,b)=> new Date(b.createdAt)-new Date(a.createdAt);
      rows.sort(fn);
    }
    function matchKeyword(r, kw){
      if (!kw || !(kw=kw.trim())) return true;
      const hay = `${r.reason} ${r.targetTitle} ${r.reporter} ${r.boardName}`.toLowerCase();
      return hay.includes(kw.toLowerCase());
    }
    function matchAdvanced(r){
      const a=state.adv;
      if (a.types.size>0 && !a.types.has(r.type)) return false;
      if (a.statuses.size>0 && !a.statuses.has(r.status)) return false;
      if (a.minSev && (r.severity||0)<a.minSev) return false;
      if (a.minCount && (r.count||0)<a.minCount) return false;
      if (a.memo){
        const hay = `${r.reason} ${r.detail} ${r.targetTitle}`.toLowerCase();
        if (!hay.includes(a.memo.toLowerCase())) return false;
      }
      return true;
    }
    function applyLeftType(rows){
      if (state.tab.type==='ALL') return rows;
      return rows.filter(x=>x.type===state.tab.type);
    }
    function applyTopStatus(rows){
      if (state.topStatus==='ALL') return rows;
      return rows.filter(x=>x.status===state.topStatus);
    }
    function paginate(rows){
      const total=Math.max(1, Math.ceil(rows.length/state.perPage));
      state.page=Math.min(Math.max(1,state.page), total);
      const start=(state.page-1)*state.perPage;
      const pageRows=rows.slice(start,start+state.perPage);
      $('#rbPgNow').textContent=String(state.page);
      $('#rbPgTotal').textContent=String(total);
      $('#rbPgPrev').parentElement.classList.toggle('disabled', state.page<=1);
      $('#rbPgNext').parentElement.classList.toggle('disabled', state.page>=total);
      return pageRows;
    }
  
    // ==== render
    function render(){
      const all=load();
      buildTabs();
      buildStatusSelect();
      let rows=applyLeftType(all);
      rows=applyTopStatus(rows);
      if (state.keyword.trim()) rows=rows.filter(r=>matchKeyword(r, state.keyword));
      rows=rows.filter(matchAdvanced);
      sortRows(rows);
      const pageRows=paginate(rows);
  
      el.empty.classList.toggle('d-none', pageRows.length>0);
      el.tbody.innerHTML = pageRows.map(r=>{
        const st = stObj(r.status);
        const ch = state.sel.has(r.id)?'checked':'';
        return html`
          <tr data-id="${r.id}">
            <td><input type="checkbox" class="row-check form-check-input" ${ch}></td>
            <td>
              <button type="button" class="admin-title-action text-truncate report-detail-trigger">${r.targetTitle}</button>
              <button type="button" class="admin-title-action text-truncate small text-body-secondary report-detail-trigger">${r.reason}</button>
            </td>
            <td>${typeLabel(r.type)}</td>
            <td class="text-center"><span class="badge ${st.badge}">${st.label}</span></td>
            <td class="text-center">${r.severity}</td>
            <td class="text-center">${fmt(r.count)}</td>
            <td class="text-center">${r.reporter}</td>
            <td class="text-center">${r.createdAt.slice(0,10)}</td>
            <td class="text-end">
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-light" data-bs-toggle="dropdown"><i class="ri-more-2-line"></i></button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><a class="dropdown-item act-resolve" href="#">처리 완료</a></li>
                  <li><a class="dropdown-item act-reopen" href="#">재개</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item text-danger act-delete" href="#">삭제</a></li>
                </ul>
              </div>
            </td>
          </tr>
        `;
      }).join('');
      syncCheckAll();
      el.selCount.textContent=String(state.sel.size);
    }
    function syncCheckAll(){
      const checks=$$('.row-check', el.tbody);
      const checked=checks.filter(c=>c.checked).length;
      el.checkAll.checked=(checked===checks.length && checks.length>0);
      el.checkAll.indeterminate=(checked>0 && checked<checks.length);
    }
  
    // ==== actions
    function applyAction(ids, action){
      if (!ids.length) return 0;
      const rows=load(); let changed=0;
      if (action==='RB_DELETE'){
        for (const id of ids){ const i=rows.findIndex(r=>r.id===id); if(i>=0){ rows.splice(i,1); changed++; } }
      } else {
        const to = action==='RB_RESOLVE' ? 'CLOSED' : 'OPEN';
        for (const id of ids){ const r=rows.find(x=>x.id===id); if(r && r.status!==to){ r.status=to; changed++; } }
      }
      if (changed) save(rows);
      return changed;
    }
    function toast(msg){ if(window.bootstrap?.Toast){ let box=$('#__toast_rb'); if(!box){box=document.createElement('div'); box.id='__toast_rb'; box.className='toast-container position-fixed bottom-0 end-0 p-3'; document.body.appendChild(box);} const t=document.createElement('div'); t.className='toast text-bg-dark'; t.innerHTML=`<div class="d-flex"><div class="toast-body">${msg}</div><button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`; box.appendChild(t); new bootstrap.Toast(t,{delay:1800}).show(); setTimeout(()=>t.remove(),2200);} else alert(msg); }
  
    // ==== binds
    function bindSort(){
      document.body.addEventListener('click',(e)=>{
        const a=e.target.closest('[data-sort]'); if(!a) return; e.preventDefault();
        state.sort=a.getAttribute('data-sort');
        const menu=a.closest('.dropdown-menu'); $$('a.dropdown-item',menu).forEach(x=>x.classList.remove('active')); a.classList.add('active');
        el.sortLabel.textContent={recent:'최신순',severity:'심각도순',count:'중복신고순'}[state.sort]||'최신순';
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
        const ids = $$('#rbTbody tr').map(tr=>tr.dataset.id);
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
        if(action==='RB_DELETE' && !confirm('삭제하시겠습니까?')) return;
        const changed=applyAction(ids, action);
        if (changed){ state.sel.clear(); render(); }
        if (action==='RB_RESOLVE') toast('처리 완료로 변경했습니다.');
        if (action==='RB_REOPEN')  toast('재개로 변경했습니다.');
        if (action==='RB_DELETE')  toast('삭제했습니다.');
      });
  
      // 행별 메뉴 + 보기
el.tbody.addEventListener('click', (e) => {
    const tr = e.target.closest('tr');
    if (!tr) return;
    const id = tr.dataset.id;
    const row = load().find(r => r.id === id);
    if (!row) return;
  
    // ✅ 상세보기 트리거: '보기 버튼' 또는 '제목(text-truncate)' 클릭 시
    if (e.target.closest('.report-detail-trigger')) {
      state.focusedId = id;
      el.detailBody.innerHTML = `
        <div class="d-flex flex-column gap-2">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="h5 mb-1">${row.targetTitle}</div>
              <div class="text-body-secondary small">
                ${typeLabel(row.type)} · ${row.boardName} · ${row.createdAt.slice(0,16).replace('T',' ')}
              </div>
            </div>
            <div class="text-end small">심각도 ${row.severity} · 중복신고 ${fmt(row.count)}</div>
          </div>
          <hr>
          <div class="mb-2"><strong>사유</strong><div>${row.reason}</div></div>
          <div class="mb-2"><strong>상세</strong><div style="white-space:pre-wrap">${row.detail}</div></div>
          <div class="mb-2"><strong>신고자</strong><div>${row.reporter}</div></div>
        </div>`;
      withBS(() => bootstrap.Modal.getOrCreateInstance(el.mdDetail).show());
      return;
    }
  
    // === 기존 행별 액션 유지 ===
    if (e.target.closest('.act-resolve')) { applyAction([id],'RB_RESOLVE'); render(); toast('처리 완료로 변경했습니다.'); }
    if (e.target.closest('.act-reopen'))  { applyAction([id],'RB_REOPEN');  render(); toast('재개로 변경했습니다.'); }
    if (e.target.closest('.act-delete'))  { 
      if (confirm('삭제하시겠습니까?')) { 
        applyAction([id],'RB_DELETE'); render(); toast('삭제했습니다.'); 
      }
    }
  });
  
  
      // 상세 모달 내 액션
      el.detailResolve?.addEventListener('click',()=>{
        if (!state.focusedId) return;
        applyAction([state.focusedId],'RB_RESOLVE'); withBS(()=> bootstrap.Modal.getOrCreateInstance(el.mdDetail).hide()); render(); toast('처리 완료로 변경했습니다.');
      });
      el.detailReopen?.addEventListener('click',()=>{
        if (!state.focusedId) return;
        applyAction([state.focusedId],'RB_REOPEN'); withBS(()=> bootstrap.Modal.getOrCreateInstance(el.mdDetail).hide()); render(); toast('재개로 변경했습니다.');
      });
  
      // 출력/내보내기
      function exportCSV(){
        const rows=load();
        const header=['id','type','status','targetType','targetTitle','boardName','reason','severity','count','reporter','createdAt'];
        const lines=[header.join(',')];
        rows.forEach(r=>{
          const vals=[r.id,r.type,r.status,r.targetType,r.targetTitle,r.boardName,r.reason,r.severity||0,r.count||0,r.reporter,r.createdAt];
          lines.push(vals.map(v=>{const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;}).join(','));
        });
        const blob=new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8'});
        const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='reports.csv'; a.click(); URL.revokeObjectURL(a.href);
      }
      el.btnExport?.addEventListener('click', exportCSV);
      el.btnExportM?.addEventListener('click', exportCSV);
      el.btnPrint?.addEventListener('click',()=>window.print());
      el.btnPrintM?.addEventListener('click',()=>window.print());
    }
    function bindAdvanced(){
      el.btnAdvanced?.addEventListener('click', ()=>{
        el.advTypeWrap.innerHTML = TYPES.map(t=>`
          <label class="form-check form-check-inline">
            <input class="form-check-input rb-adv-type" type="checkbox" value="${t.id}">
            <span class="form-check-label">${t.label}</span>
          </label>`).join('');
        el.advStatusWrap.innerHTML = STATUS.map(s=>`
          <label class="form-check form-check-inline">
            <input class="form-check-input rb-adv-status" type="checkbox" value="${s.id}">
            <span class="form-check-label">${s.label}</span>
          </label>`).join('');
        withBS(()=> bootstrap.Modal.getOrCreateInstance(el.mdAdvanced).show());
      });
      el.formAdvanced?.addEventListener('submit',(e)=>{
        e.preventDefault();
        state.adv.types    = new Set($$('.rb-adv-type').filter(i=>i.checked).map(i=>i.value));
        state.adv.statuses = new Set($$('.rb-adv-status').filter(i=>i.checked).map(i=>i.value));
        state.adv.minSev   = Number(el.minSev.value||0);
        state.adv.minCount = Number(el.minCount.value||0);
        state.adv.memo     = el.advMemo.value||'';
        state.page=1; render();
        withBS(()=> bootstrap.Modal.getOrCreateInstance(el.mdAdvanced).hide());
      });
    }
  
    function init(){
      seedIfEmpty();
      buildTabs();
      buildStatusSelect();
      bindTabs();
      bindStatusSelect();
      bindSort(); bindSearch(); bindPage(); bindChecks(); bindToolbar(); bindAdvanced();
      render();
    }
    init();
  })();
