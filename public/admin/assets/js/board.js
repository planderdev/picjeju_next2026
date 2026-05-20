/* /admin/assets/js/board-manage.js
 * 게시판(보드) 관리 — 데모용 로컬 스토리지 CRUD
 * - 좌측: 그룹 탭(전체/기본/고객지원/커뮤니티)
 * - 우측: 상태 셀렉트(전체/공지/노출/숨김) ← chips 대체
 * - 정렬/검색/고급검색, 페이징
 * - 선택/일괄작업(공개/숨김/삭제), 새 게시판/편집(카테고리 chip)
 * - CSV 내보내기, 인쇄
 */
(() => {
    // ===== 유틸 =====
    const $  = (s, r=document)=>r.querySelector(s);
    const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
    const fmt=(n)=>(n||0).toLocaleString('ko-KR');
    const html = String.raw;
    const STORAGE_KEY = 'admin.boards.v1';
  
    function slugify(s){
      return (s||'').toString().trim()
        .toLowerCase()
        .replace(/[^\w\- ]+/g,'')
        .replace(/\s+/g,'-')
        .replace(/\-{2,}/g,'-');
    }
  
    function toast(msg){
      if (window.bootstrap?.Toast) {
        let box = $('#__admin_toast_box');
        if (!box) {
          box = document.createElement('div');
          box.id = '__admin_toast_box';
          box.className = 'toast-container position-fixed bottom-0 end-0 p-3';
          document.body.appendChild(box);
        }
        const el = document.createElement('div');
        el.className = 'toast align-items-center text-bg-dark';
        el.role = 'alert';
        el.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div><button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
        box.appendChild(el);
        new bootstrap.Toast(el, {delay:2000}).show();
        setTimeout(()=>el.remove(), 2600);
      } else {
        alert(msg);
      }
    }
  
    // ===== 기본 도메인 =====
    const GROUPS = ['전체', '제주살이 뉴스', '픽제주 장터', '픽포인트 거래소'];
    // NOTICE(공지) 추가
    const STATUS = [
      { id:'NOTICE',    label:'공지', badge:'text-bg-primary'},
      { id:'PUBLISHED', label:'노출', badge:'text-bg-info'},
      { id:'HIDDEN',    label:'숨김', badge:'text-bg-secondary'}
    ];
    const statusObj = id => STATUS.find(s=>s.id===id) || STATUS[0];
  
    // ===== 요소 =====
    const el = {
      tabs: $('#boardTabs'),
      // 우측 상태 셀렉트
      statusSel: $('#boardStatusSel'),
  
      tbody: $('#tbodyBoard'),
      empty: $('#emptyList'),
      loader: $('#loader'),
      checkAll: $('#checkAll'),
      selCount: $('#selCount'),
      pgPrev: $('#pgPrev'),
      pgNext: $('#pgNext'),
      pgNow:  $('#pgNow'),
      pgTotal:$('#pgTotal'),
      sortLabel: $('#sortLabel'),
      keyword: $('#keyword'),
      btnSearch: $('#btnSearch'),
      btnAdvanced: $('#btnAdvanced'),
      mdAdvanced: $('#mdAdvanced'),
      formAdvanced: $('#formAdvanced'),
      advStatusWrap: $('#advStatus'),
      advGroup: $('#advGroup'),
      advMemo: $('#advMemo'),
      advOpts: ()=> $$('.adv-opt'),
      btnNew: $('#btnNewBoard'),
      btnPrint: $('#btnPrint'),
      btnExport: $('#btnExport'),
      btnPrintM: $('#btnPrintM'),
      btnExportM: $('#btnExportM'),
  
      // edit modal
      mdEdit:  $('#mdBoardEdit'),
      formEdit:$('#formBoardEdit'),
      mdEditTitle: $('#mdBoardEditTitle'),
      beName: $('#beName'),
      beKey:  $('#beKey'),
      beDesc: $('#beDesc'),
      beGroup:$('#beGroup'),
      beStatus:$('#beStatus'),
      beOrder: $('#beOrder'),
      beUseComments:  $('#beUseComments'),
      beUseRecommend: $('#beUseRecommend'),
      beUseAttachment:$('#beUseAttachment'),
      beUseSecret:    $('#beUseSecret'),
      beCatInput: $('#beCatInput'),
      beCatAdd:   $('#beCatAdd'),
      beCatList:  $('#beCatList'),
      btnSave:    $('#btnBoardSave'),
    };
  
    // ===== 상태 =====
    const state = {
      tab: { group: '전체', status: 'ALL' }, // status: ALL|NOTICE|PUBLISHED|HIDDEN
      sort: 'recent', // recent | name | posts | comments
      page: 1,
      perPage: 12,
      keyword: '',
      adv: {
        statuses: new Set(), // NOTICE | PUBLISHED | HIDDEN
        group: '',           // '', '기본', ...
        opts: new Set(),     // useComments, useRecommend, useAttachment, useSecret
        memo: ''
      },
      sel: new Set(), // selected board ids
      editingId: null
    };
  
    // ===== 데이터 IO =====
    function seedIfEmpty() {
        if (localStorage.getItem(STORAGE_KEY)) return;
        const now = Date.now();
        const rows = [
          {
            id: 'b300',
            name: '제주살이 뉴스',
            key: 'jeju-news',
            desc: '제주 관련 주요 소식, 청년지원, 일자리 정보 등을 전하는 게시판',
            group: '제주살이 뉴스',
            status: 'PUBLISHED',
            order: 0,
            cats: ['제주뉴스', '청년지원', '제주일자리'],
            posts: 182,
            comments: 43,
            createdAt: new Date(now - 86400000 * 10).toISOString(),
            useComments: true,
            useRecommend: true,
            useAttachment: true,
            useSecret: false,
          },
          {
            id: 'b301',
            name: '픽제주 장터',
            key: 'picjeju-market',
            desc: '재능나눔, 나눔, 판매 등 제주 지역 장터 커뮤니티',
            group: '픽제주 장터',
            status: 'PUBLISHED',
            order: 1,
            cats: ['재능나눔/클래스', '나눔', '판매'],
            posts: 95,
            comments: 27,
            createdAt: new Date(now - 86400000 * 3).toISOString(),
            useComments: true,
            useRecommend: true,
            useAttachment: true,
            useSecret: true,
          }
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
      }
      
    const loadRows = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } };
    const saveRows = (rows) => localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));

    function ensurePointExchangeBoard() {
      const rows = loadRows();
      const existing = rows.find(row => row.key === 'pickpoint-exchange' || row.name === '픽포인트 거래소');
      if (existing) {
        existing.desc = '픽포인트 구해요, 팔아요, 거래완료 게시글을 관리하는 거래 게시판';
        existing.cats = ['구해요', '팔아요', '거래완료'];
        saveRows(rows);
        return;
      }

      rows.push({
        id: 'b302',
        name: '픽포인트 거래소',
        key: 'pickpoint-exchange',
        desc: '픽포인트 구해요, 팔아요, 거래완료 게시글을 관리하는 거래 게시판',
        group: '픽포인트 거래소',
        status: 'PUBLISHED',
        order: 2,
        cats: ['구해요', '팔아요', '거래완료'],
        posts: 64,
        comments: 18,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        useComments: true,
        useRecommend: true,
        useAttachment: false,
        useSecret: true,
      });
      saveRows(rows);
    }
  
    // ===== 탭(좌측: 그룹) =====
    function buildTabs(){
      const rows = loadRows();
      const groupCounts = GROUPS.reduce((acc,g)=>{
        acc[g] = g==='전체' ? rows.length : rows.filter(r=>r.group===g).length;
        return acc;
      }, {});
      el.tabs.innerHTML = GROUPS.map(g=>{
        const active = state.tab.group===g ? 'active' : '';
        return `
          <li class="nav-item" role="presentation">
            <button type="button" class="nav-link ${active}" data-tab="group" data-value="${g}" role="tab">
              ${g}<span class="badge text-bg-primary align-middle ms-1">${fmt(groupCounts[g])}</span>
            </button>
          </li>
        `;
      }).join('');
    }
  
    // ===== 상태 셀렉트(우측) =====
    function buildStatusSelect(){
      if (!el.statusSel) return;
      const rows = loadRows();
      const RIGHT = [
        {id:'ALL',      label:'전체'},
        {id:'NOTICE',   label:'공지'},
        {id:'PUBLISHED',label:'노출'},
        {id:'HIDDEN',   label:'숨김'},
      ];
      const counts = RIGHT.reduce((a,s)=>{
        a[s.id] = s.id==='ALL' ? rows.length : rows.filter(r=>r.status===s.id).length;
        return a;
      }, {});
      el.statusSel.innerHTML = RIGHT.map(s =>
        `<option value="${s.id}" ${state.tab.status===s.id?'selected':''}>${s.label} (${fmt(counts[s.id]||0)})</option>`
      ).join('');
    }
    function bindStatusSelect(){
      el.statusSel?.addEventListener('change', ()=>{
        state.tab.status = el.statusSel.value || 'ALL';
        state.page = 1;
        state.sel.clear();
        render();
      });
    }
  
    // ===== 고급검색 셀렉터 =====
    function buildAdvancedSelectors(){
      // 상태 체크
      el.advStatusWrap.innerHTML = STATUS.map(s=>html`
        <label class="form-check form-check-inline">
          <input class="form-check-input adv-status" type="checkbox" value="${s.id}">
          <span class="form-check-label">${s.label}</span>
        </label>
      `).join('');
      // 그룹 select
      el.advGroup.innerHTML = `<option value="">전체</option>` + GROUPS.filter(g=>g!=='전체').map(g=>`<option value="${g}">${g}</option>`).join('');
    }
  
    // ===== 정렬/필터/페이지네이션 =====
    function sortRows(rows){
      const fn = state.sort==='name'
        ? (a,b)=> a.name.localeCompare(b.name, 'ko')
        : state.sort==='posts'
          ? (a,b)=> (b.posts||0)-(a.posts||0)
          : state.sort==='comments'
            ? (a,b)=> (b.comments||0)-(a.comments||0)
            : (a,b)=> new Date(b.createdAt||0) - new Date(a.createdAt||0);
      rows.sort(fn);
    }
  
    function matchKeyword(row, kw){
      if (!kw || !(kw=kw.trim())) return true;
      const hay = `${row.name} ${row.key} ${row.group} ${row.desc}`.toLowerCase();
      return hay.includes(kw.toLowerCase());
    }
  
    function matchAdvanced(row){
      const a = state.adv;
      if (a.statuses.size>0 && !a.statuses.has(row.status)) return false;
      if (a.group && row.group!==a.group) return false;
  
      if (a.opts.size>0) {
        for (const opt of a.opts) {
          if (opt==='useComments'   && !row.useComments) return false;
          if (opt==='useRecommend'  && !row.useRecommend) return false;
          if (opt==='useAttachment' && !row.useAttachment) return false;
          if (opt==='useSecret'     && !row.useSecret) return false;
        }
      }
      if (a.memo) {
        const hay = `${row.name} ${row.key} ${row.desc}`.toLowerCase();
        if (!hay.includes(a.memo.toLowerCase())) return false;
      }
      return true;
    }
  
    function applyTabFilter(rows){
      let r = rows.slice();
      if (state.tab.group!=='전체') r = r.filter(x=>x.group===state.tab.group);
      if (state.tab.status!=='ALL') r = r.filter(x=>x.status===state.tab.status);
      return r;
    }
  
    function paginate(rows){
      const total = Math.max(1, Math.ceil(rows.length / state.perPage));
      state.page = Math.min(Math.max(1, state.page), total);
      const start = (state.page-1)*state.perPage;
      const pageRows = rows.slice(start, start+state.perPage);
      el.pgNow.textContent   = String(state.page);
      el.pgTotal.textContent = String(total);
      el.pgPrev.parentElement.classList.toggle('disabled', state.page<=1);
      el.pgNext.parentElement.classList.toggle('disabled', state.page>=total);
      return pageRows;
    }
  
    // ===== 렌더 =====
    function render(){
      const all = loadRows();
  
      // 좌/우 컨트롤 숫자 동기화
      buildTabs();
      buildStatusSelect();
  
      // 필터 체인
      let filtered = applyTabFilter(all);
      if (state.keyword.trim()) filtered = filtered.filter(r=>matchKeyword(r, state.keyword));
      filtered = filtered.filter(matchAdvanced);
  
      sortRows(filtered);
      const pageRows = paginate(filtered);
  
      // 빈 상태 처리
      const empty = pageRows.length===0;
      el.empty.classList.toggle('d-none', !empty);
  
      el.tbody.innerHTML = pageRows.map(row=>{
        const st = statusObj(row.status);
        const checked = state.sel.has(row.id) ? 'checked' : '';
        return html`
          <tr data-id="${row.id}">
            <td><input type="checkbox" class="row-check form-check-input" ${checked}></td>
            <td>
              <div class="fw-semibold text-truncate">${row.name}</div>
              <div class="small text-body-secondary text-truncate">${row.desc||''}</div>
            </td>
            <td><code>${row.key}</code></td>
            <td class="text-center"><span class="badge ${st.badge}">${st.label}</span></td>
            <td class="text-center">${row.group}</td>
            <td class="text-center">${fmt(row.cats?.length||0)}</td>
            <td class="text-center">${fmt(row.posts||0)}</td>
            <td class="text-center">${fmt(row.comments||0)}</td>
            <td class="text-center">${row.order ?? 0}</td>
            <td class="text-center">${(row.createdAt||'').slice(0,10)}</td>
            <td class="text-end">  
                <button class="btn btn-sm btn-light btn-more" data-bs-toggle="dropdown">
                  <i class="ri-more-2-line"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><a class="dropdown-item btn-edit" href="#">편집</a></li>
                  <li><a class="dropdown-item act-dup" href="#">복제</a></li>
                  <li><a class="dropdown-item act-publish" href="#">공개로 변경</a></li>
                  <li><a class="dropdown-item act-hide" href="#">숨김으로 변경</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item text-danger act-delete" href="#">삭제</a></li>
                </ul> 
            </td>
          </tr>
        `;
      }).join('');
  
      syncCheckAll();
      el.selCount.textContent = String(state.sel.size);
    }
  
    function syncCheckAll(){
      const checks = $$('.row-check', el.tbody);
      if (checks.length===0) {
        el.checkAll.checked = false;
        el.checkAll.indeterminate = false;
        return;
      }
      const checkedCount = checks.filter(c=>c.checked).length;
      el.checkAll.checked = (checkedCount === checks.length);
      el.checkAll.indeterminate = (checkedCount>0 && checkedCount<checks.length);
    }
  
    // ===== 편집 모달 =====
    function openEditor(row){
      state.editingId = row?.id ?? null;
      $('#mdBoardEditTitle').textContent = row ? '게시판 편집' : '새 게시판';
  
      // 그룹 select
      el.beGroup.innerHTML = GROUPS.filter(g=>g!=='전체').map(g=>`<option value="${g}">${g}</option>`).join('');
  
      el.beName.value = row?.name || '';
      el.beKey.value  = row?.key  || '';
      el.beDesc.value = row?.desc || '';
      el.beGroup.value= row?.group || (GROUPS[1]||'기본');
      el.beStatus.value= row?.status || 'PUBLISHED';
      el.beOrder.value = row?.order ?? 0;
      el.beUseComments.checked   = !!row?.useComments;
      el.beUseRecommend.checked  = !!row?.useRecommend;
      el.beUseAttachment.checked = !!row?.useAttachment;
      el.beUseSecret.checked     = !!row?.useSecret;
  
      // 카테고리 chip
      renderCatChips(row?.cats||[]);
  
      new bootstrap.Modal(el.mdEdit).show();
    }
  
    function renderCatChips(cats){
      el.beCatList.innerHTML = cats.map((c,idx)=>html`
        <span class="badge text-bg-light border rounded-pill px-2 py-1 d-inline-flex align-items-center" data-idx="${idx}">
          <span class="me-1">${c}</span>
          <button type="button" class="btn btn-sm btn-link p-0 ms-1 be-cat-del" title="삭제">
            <i class="ri-close-line"></i>
          </button>
        </span>
      `).join('');
      el.beCatList.dataset.cats = JSON.stringify(cats);
    }
    const getCatArray = ()=>{ try { return JSON.parse(el.beCatList.dataset.cats||'[]'); } catch { return []; } };
  
    // ===== 액션 =====
    function applyAction(ids, action){
      if (ids.length===0) return 0;
      const rows = loadRows();
      let changed = 0;
  
      if (action==='BOARD_DELETE'){
        for (const id of ids){
          const idx = rows.findIndex(r=>r.id===id);
          if (idx>=0){ rows.splice(idx,1); changed++; }
        }
      } else if (action==='BOARD_PUBLISH' || action==='BOARD_HIDE'){
        const to = action==='BOARD_PUBLISH' ? 'PUBLISHED' : 'HIDDEN';
        for (const id of ids){
          const r = rows.find(x=>x.id===id);
          if (r && r.status!==to){ r.status = to; changed++; }
        }
      }
      if (changed>0) saveRows(rows);
      return changed;
    }
  
    // ===== 바인딩 =====
    function bindTabs(){
      el.tabs.addEventListener('click', (e)=>{
        const btn = e.target.closest('.nav-link');
        if (!btn) return;
        const type = btn.dataset.tab;   // 'group'
        const val  = btn.dataset.value; // 예: '기본'
        if (type==='group'){
          state.tab.group = val;
          state.page = 1;
        }
        state.sel.clear();
        render();
      });
    }
  
    function bindSorting(){
      document.body.addEventListener('click', (e)=>{
        const a = e.target.closest('[data-sort]'); if (!a) return;
        e.preventDefault();
        state.sort = a.getAttribute('data-sort');
        const menu = a.closest('.dropdown-menu');
        $$('a.dropdown-item', menu).forEach(x=>x.classList.remove('active'));
        a.classList.add('active');
        el.sortLabel.textContent = {recent:'최신순', name:'이름순', posts:'게시글수', comments:'댓글수'}[state.sort] || '최신순';
        render();
      });
    }
  
    function bindSearch(){
      el.btnSearch?.addEventListener('click', ()=>{
        state.keyword = el.keyword.value || '';
        state.page = 1;
        render();
      });
      el.keyword?.addEventListener('keydown', (e)=>{
        if (e.key==='Enter'){ e.preventDefault(); el.btnSearch.click(); }
      });
    }
  
    function bindPagination(){
      el.pgPrev.addEventListener('click', (e)=>{
        e.preventDefault();
        if (el.pgPrev.parentElement.classList.contains('disabled')) return;
        state.page = Math.max(1, state.page-1);
        render();
      });
      el.pgNext.addEventListener('click', (e)=>{
        e.preventDefault();
        if (el.pgNext.parentElement.classList.contains('disabled')) return;
        state.page = state.page+1;
        render();
      });
    }
  
    function bindCheck(){
      el.checkAll.addEventListener('change', ()=>{
        const ids = $$('#tbodyBoard tr').map(tr=>tr.dataset.id);
        if (el.checkAll.checked) ids.forEach(id=>state.sel.add(id));
        else ids.forEach(id=>state.sel.delete(id));
        render();
      });
  
      el.tbody.addEventListener('change', (e)=>{
        const ck = e.target.closest('.row-check');
        if (!ck) return;
        const id = ck.closest('tr').dataset.id;
        if (ck.checked) state.sel.add(id); else state.sel.delete(id);
        syncCheckAll();
        el.selCount.textContent = String(state.sel.size);
      });
    }
  
    function bindToolbar(){
      document.body.addEventListener('click', (e)=>{
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        let ids = Array.from(state.sel);
        if (ids.length===0){
          ids = $$('.row-check:checked', el.tbody).map(ck=>ck.closest('tr').dataset.id);
        }
        if (ids.length===0) return alert('선택된 항목이 없습니다.');
        if (action==='BOARD_DELETE' && !confirm('정말 삭제하시겠습니까?')) return;
        const changed = applyAction(ids, action);
        if (changed>0){
          state.sel.clear();
          render();
        }
        if (action==='BOARD_PUBLISH') toast('공개로 변경했습니다.');
        if (action==='BOARD_HIDE')    toast('숨김으로 변경했습니다.');
        if (action==='BOARD_DELETE')  toast('삭제했습니다.');
      });
  
      // 행개별 드롭다운
      el.tbody.addEventListener('click', (e)=>{
        const tr = e.target.closest('tr');
        if (!tr) return;
        const id = tr.dataset.id;
        if (e.target.closest('.act-dup')){
          const rows = loadRows();
          const src = rows.find(r=>r.id===id);
          if (!src) return;
          const copy = structuredClone(src);
          copy.id = 'b'+Math.floor(Math.random()*1e6);
          copy.name = src.name+' 복제';
          copy.key  = (src.key+'-copy').slice(0,60);
          copy.createdAt = new Date().toISOString();
          rows.unshift(copy);
          saveRows(rows);
          toast('복제했습니다.');
          render();
        }
        if (e.target.closest('.act-publish')){ applyAction([id],'BOARD_PUBLISH'); render(); toast('공개로 변경했습니다.'); }
        if (e.target.closest('.act-hide'))   { applyAction([id],'BOARD_HIDE');    render(); toast('숨김으로 변경했습니다.'); }
        if (e.target.closest('.act-delete')) {
          if (confirm('삭제하시겠습니까?')){ applyAction([id],'BOARD_DELETE'); render(); toast('삭제했습니다.'); }
        }
      });
  
      // 편집 버튼
      el.tbody.addEventListener('click', (e)=>{
        const btn = e.target.closest('.btn-edit');
        if (!btn) return;
        const id = btn.closest('tr').dataset.id;
        const row = loadRows().find(r=>r.id===id);
        openEditor(row);
      });
  
      // 새 게시판
      el.btnNew?.addEventListener('click', ()=> openEditor(null));
  
      // 내보내기/출력
      function exportCSV(){
        const rows = loadRows();
        const header = ['id','name','key','desc','group','status','order','cats','posts','comments','createdAt','useComments','useRecommend','useAttachment','useSecret'];
        const lines = [header.join(',')];
        rows.forEach(r=>{
          const line = [
            r.id, r.name, r.key, r.desc||'', r.group, r.status, r.order??0,
            (r.cats||[]).join('|'), r.posts||0, r.comments||0, r.createdAt||'',
            !!r.useComments, !!r.useRecommend, !!r.useAttachment, !!r.useSecret
          ].map(v=>{
            const s = String(v ?? '');
            return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
          }).join(',');
          lines.push(line);
        });
        const blob=new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8'});
        const a=document.createElement('a');
        a.href=URL.createObjectURL(blob);
        a.download='boards.csv';
        a.click();
        URL.revokeObjectURL(a.href);
      }
      el.btnExport?.addEventListener('click', exportCSV);
      el.btnExportM?.addEventListener('click', exportCSV);
      el.btnPrint?.addEventListener('click', ()=>window.print());
      el.btnPrintM?.addEventListener('click', ()=>window.print());
    }
  
    function bindAdvanced(){
      el.btnAdvanced?.addEventListener('click', ()=>{
        buildAdvancedSelectors();
        new bootstrap.Modal(el.mdAdvanced).show();
      });
  
      el.formAdvanced?.addEventListener('submit', (e)=>{
        e.preventDefault();
        state.adv.statuses = new Set($$('.adv-status').filter(i=>i.checked).map(i=>i.value));
        state.adv.group = el.advGroup.value || '';
        const opts = new Set();
        el.advOpts().forEach(i=>{ if (i.checked) opts.add(i.value); });
        state.adv.opts = opts;
        state.adv.memo = el.advMemo.value || '';
        state.page = 1;
        render();
        bootstrap.Modal.getInstance(el.mdAdvanced)?.hide();
      });
    }
  
    function bindEditor(){
      // 카테고리 추가/삭제
      el.beCatAdd?.addEventListener('click', (e)=>{
        e.preventDefault();
        const v = (el.beCatInput.value||'').trim();
        if (!v) return;
        const cats = getCatArray();
        cats.push(v);
        renderCatChips(cats);
        el.beCatInput.value = '';
      });
      el.beCatList?.addEventListener('click',(e)=>{
        const del = e.target.closest('.be-cat-del');
        if (!del) return;
        const holder = del.closest('[data-idx]');
        const idx = +holder.dataset.idx;
        const cats = getCatArray();
        cats.splice(idx,1);
        renderCatChips(cats);
      });
  
      // 키 자동 생성
      el.beName?.addEventListener('input', ()=>{
        if (!state.editingId && !el.beKey.value.trim()){
          el.beKey.value = slugify(el.beName.value);
        }
      });
  
      // 저장
      el.btnSave?.addEventListener('click', ()=>{
        const name = el.beName.value.trim();
        const key  = el.beKey.value.trim();
        if (!name) return alert('게시판명을 입력하세요.');
        if (!key)  return alert('키(Slug)를 입력하세요.');
  
        const rows = loadRows();
        const dup = rows.find(r=> r.key===key && r.id!==state.editingId);
        if (dup) return alert('이미 사용중인 키입니다.');
  
        const payload = {
          id: state.editingId || ('b'+Math.floor(Math.random()*1e6)),
          name, key,
          desc: el.beDesc.value.trim(),
          group: el.beGroup.value || (GROUPS[1]||'기본'),
          status: el.beStatus.value || 'PUBLISHED',
          order: Number(el.beOrder.value||0),
          cats: getCatArray(),
          useComments:   el.beUseComments.checked,
          useRecommend:  el.beUseRecommend.checked,
          useAttachment: el.beUseAttachment.checked,
          useSecret:     el.beUseSecret.checked,
        };
  
        if (state.editingId){
          const idx = rows.findIndex(r=>r.id===state.editingId);
          if (idx>=0){
            payload.createdAt = rows[idx].createdAt || new Date().toISOString();
            payload.posts     = rows[idx].posts||0;
            payload.comments  = rows[idx].comments||0;
            rows[idx] = payload;
          }
        } else {
          payload.createdAt = new Date().toISOString();
          payload.posts = 0;
          payload.comments = 0;
          rows.unshift(payload);
        }
        saveRows(rows);
        bootstrap.Modal.getInstance(el.mdEdit)?.hide();
        toast('저장했습니다.');
        render();
      });
    }
  
    // ===== init =====
    function init(){
      seedIfEmpty();
      ensurePointExchangeBoard();
      buildTabs();
      buildStatusSelect();
      buildAdvancedSelectors();
      bindTabs();
      bindStatusSelect();
      bindSorting();
      bindSearch();
      bindPagination();
      bindCheck();
      bindToolbar();
      bindAdvanced();
      bindEditor();
      render();
    }
  
    document.addEventListener('DOMContentLoaded', init);
  })();
  
