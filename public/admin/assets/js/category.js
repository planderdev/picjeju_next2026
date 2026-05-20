/* /admin/js/category.js
 * 카테고리 관리 (데모: localStorage)
 * - DOMContentLoaded 이후 실행
 * - 필수 앵커(ID) 없으면 안전 종료
 * - 검색/필터, 추가·수정·삭제, 일괄 작업
 * - 동일 부모 내 드래그 정렬
 * - CSV/JSON 내보내기
 */

document.addEventListener('DOMContentLoaded', () => {
    const $  = (s, r=document)=>r.querySelector(s);
    const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
    const byId = (id)=>document.getElementById(id);
    const fmt = (n)=>(n||0).toLocaleString('ko-KR');
  
    // ===== 필수 앵커 존재 확인 (없으면 조용히 종료) =====
    const requiredAnchors = [
      'catTbody','catCountAll','catCountShown','catCheckAll',
      'catSearch','catFilterParent','catFilterVisible',
      'catBulkBar','catBulkCount','catSaveOrder','catDeleteModal'
    ];
    const missing = requiredAnchors.filter(id => !byId(id));
    if (missing.length) {
      console.warn('[category] missing anchors ->', missing.join(', '));
      return;
    }
  
    // ===== 상태 =====
    let cats = [];
    let filter = { q:'', parent:'', visible:'' };
    let selected = new Set();
  
    const STORAGE_KEY = '__IMWEB_ADMIN_CATEGORIES__';
  
    // 버튼 → 함수 연결
byId('catExpandAll')?.addEventListener('click', expandAll);
byId('catCollapseAll')?.addEventListener('click', collapseAll);

// 전체 펼치기: 필터에 걸리는 모든 행 보이기
function expandAll(){
  $$('tr', tbody).forEach(tr=>{
    const cat = cats.find(c=>c.id===tr.dataset.id);
    if (cat && visibleByFilter(cat)) tr.style.display = '';
  });
}

// 전체 접기: depth 0(최상위)만 보이고 나머지는 감추기
function collapseAll(){
  $$('tr', tbody).forEach(tr=>{
    const depth = parseInt(tr.dataset.depth || '0', 10);
    if (depth > 0) {
      tr.style.display = 'none';
    } else {
      const cat = cats.find(c=>c.id===tr.dataset.id);
      tr.style.display = visibleByFilter(cat) ? '' : 'none';
    }
  });
}


    // ===== Seed / Save =====
    function seedIfEmpty(){
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { cats = JSON.parse(saved); return; } catch {}
      }
      cats = [
        { id:'c1', name:'제주살이 꿀팁', slug:'tip', parentId:'',   desc:'제주살이 꿀팁',      visible:true,  order:1, boards:1, posts:7 },
        { id:'c2', name:'픽제주 친구들 ', slug:'friend', parentId:'',  desc:'픽제주 친구들',   visible:true,  order:2, boards:2, posts:12 },
        { id:'c3', name:'이벤트', slug:'event', parentId:'',   desc:'이벤트',     visible:true,  order:3, boards:1, posts:5 }, 
      ];
      save();
    }
    const save = ()=>localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
    const idMap = ()=>Object.fromEntries(cats.map(c=>[c.id,c]));
    const nextOrderForParent = (pid)=> {
      const sibs = cats.filter(c=>(c.parentId||'')===(pid||''));
      return (sibs.reduce((m,c)=>Math.max(m,c.order||0),0)||0)+1;
    };
  
    // ===== Helpers =====
    function slugify(t){
      return (t||'').toString().trim().toLowerCase()
        .replace(/\s+/g,'-').replace(/[^\w\-]+/g,'').replace(/\-\-+/g,'-')
        .replace(/^-+/, '').replace(/-+$/, '');
    }
  
    // ===== Elements =====
    const tbody      = byId('catTbody');
    const countAll   = byId('catCountAll');
    const countShown = byId('catCountShown');
  
    // ===== Build & Render =====
    function buildTree(){
      const map = idMap();
      cats.forEach(c=>c.children=[]);
      cats.forEach(c=>{
        if (c.parentId && map[c.parentId]) map[c.parentId].children.push(c);
      });
      cats.forEach(c=>c.children.sort((a,b)=>(a.order||0)-(b.order||0)));
      return cats.filter(c=>!c.parentId).sort((a,b)=>(a.order||0)-(b.order||0));
    }
  
    function visibleByFilter(cat){
      if (filter.q) {
        const q = filter.q.toLowerCase();
        const hit = (cat.name||'').toLowerCase().includes(q) || (cat.slug||'').toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (filter.parent !== '') {
        if ((cat.parentId||'') !== filter.parent) return false;
      }
      if (filter.visible !== '') {
        const want = filter.visible==='1';
        if (!!cat.visible !== want) return false;
      }
      return true;
    }
  
    function renderParentOptions(){
        const selF = byId('catFilterParent');    // 필터용
        const addP = byId('addParent');          // 추가 모달
        const editP= byId('editParent');         // 수정 모달
      
        const top = cats.filter(c=>!c.parentId).sort((a,b)=>(a.order||0)-(b.order||0));
        const all = cats.slice().sort((a,b)=>(a.order||0)-(b.order||0));
      
        if (selF)  selF.innerHTML  = `<option value="">상위: 전체</option>` + top.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
        if (addP)  addP.innerHTML  = `<option value="">(최상위)</option>` + all.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
        if (editP) editP.innerHTML = `<option value="">(최상위)</option>` + all.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
      }
      
  
    function renderTable(){
      const tree = buildTree();
      let rows = [];
      let shown = 0;
      const total = cats.length;
  
      function row(cat, depth=0){
        const show = visibleByFilter(cat);
        if (show) shown++;
        const padding = 8 + depth*18;
        const indent = `<span class="me-1" style="display:inline-block;width:${padding}px"></span>`;
        const caret = cat.children.length
          ? `<button class="btn btn-sm btn-link px-1 text-decoration-none cat-toggle" data-id="${cat.id}" title="하위 토글"><i class="ri-arrow-down-s-line"></i></button>`
          : `<span class="px-2"></span>`;
  
        const drag = `<span class="text-muted" style="cursor:grab;" title="드래그 정렬"><i class="ri-draggable"></i></span>`;
        const visBtn = cat.visible
          ? `<button class="btn btn-sm btn-outline-success cat-visibility" data-id="${cat.id}" title="숨기기"><i class="ri-eye-line"></i></button>`
          : `<button class="btn btn-sm btn-outline-secondary cat-visibility" data-id="${cat.id}" title="보이기"><i class="ri-eye-off-line"></i></button>`;
  
        const checked = selected.has(cat.id) ? 'checked' : '';
  
        rows.push(`
          <tr data-id="${cat.id}" data-parent="${cat.parentId||''}" data-depth="${depth}" draggable="true" ${show?'':'style="display:none"'} >
            <td><input class="form-check-input cat-check" type="checkbox" value="${cat.id}" ${checked}></td>
            <td class="text-muted">${drag}</td>
            <td>
              ${indent}${caret}
              <span class="fw-semibold">${cat.name}</span>
              ${cat.desc?`<div class="small text-body-secondary">${cat.desc}</div>`:''}
            </td>
            <td><code>${cat.slug||''}</code></td>
            <td class="text-center">${fmt(cat.children.length)}</td>
            <td class="text-center">${fmt(cat.boards||0)}</td>
            <td class="text-center">${fmt(cat.posts||0)}</td>
            <td class="text-center">${visBtn}</td>
            <td class="text-center"><span class="badge text-bg-light">${fmt(cat.order||0)}</span></td>
            <td class="text-end">
              <div class="btn-group">
                <button class="btn btn-sm btn-outline-secondary cat-edit" data-id="${cat.id}"><i class="ri-pencil-line"></i></button>
                <button class="btn btn-sm btn-outline-danger cat-del-one" data-id="${cat.id}"><i class="ri-delete-bin-6-line"></i></button>
              </div>
            </td>
          </tr>
        `);
        cat.children.forEach(ch=>row(ch, depth+1));
      }
  
      tree.forEach(root=>row(root,0));
      if (!tbody) return;
      tbody.innerHTML = rows.join('');
  
      countAll.textContent = fmt(total);
      countShown.textContent = fmt(shown);
  
      updateBulkBar();
      attachRowHandlers();
      initDrag();
    }
  
    // ===== Events =====
    function attachRowHandlers(){
      // 체크박스
      $$('.cat-check', tbody).forEach(chk=>{
        chk.addEventListener('change', ()=>{
          const id = chk.value;
          chk.checked ? selected.add(id) : selected.delete(id);
          updateBulkBar();
        });
      });
  
      // 행 클릭시 토글 선택 (버튼/링크 제외)
      $$('tr', tbody).forEach(tr=>{
        tr.addEventListener('click',(e)=>{
          if (e.target.closest('button, .form-check-input, a, code')) return;
          const box = tr.querySelector('.cat-check'); if (!box) return;
          box.checked = !box.checked;
          const id = tr.dataset.id;
          box.checked ? selected.add(id) : selected.delete(id);
          updateBulkBar();
        });
      });
  
      // 하위 토글
      $$('.cat-toggle', tbody).forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const id = btn.dataset.id;
          const rows = $$(`tr[data-parent="${id}"]`, tbody);
          const hidden = rows[0] && rows[0].style.display==='none';
          rows.forEach(r=>{
            const cat = cats.find(c=>c.id===r.dataset.id);
            if (cat && visibleByFilter(cat)) r.style.display = hidden ? '' : 'none';
          });
        });
      });
  
      // 노출 토글
      $$('.cat-visibility', tbody).forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const c = cats.find(x=>x.id===btn.dataset.id);
          if (!c) return;
          c.visible = !c.visible;
          save(); renderTable();
        });
      });
  
      // 단건 삭제 (시스템 confirm)
$$('.cat-del-one', tbody).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.id;
      const c  = cats.find(x=>x.id===id);
      if (!c) return;
      if (confirm(`"${c.name}" 카테고리를 삭제하시겠습니까?`)) {
        // 자식까지 함께 제거
        const all = collectWithChildren([id]);
        cats = cats.filter(cat=>!all.has(cat.id));
        selected.delete(id);
        save(); renderTable();
      }
    });
  });
  
  
      // ✏️ 수정 버튼 → 수정 모달
      $$('.cat-edit', tbody).forEach(btn=>{
        btn.addEventListener('click', ()=>{
          openEdit(btn.dataset.id);
        });
      });
    }
  
    function updateBulkBar(force=false){
      byId('catBulkCount').textContent = selected.size;
      const bar = byId('catBulkBar');
      bar.style.display = (force || selected.size>0) ? '' : 'none';
      byId('catCheckAll').checked = (selected.size>0 && selected.size===cats.length);
    }
  
    // 전체 선택
    byId('catCheckAll')?.addEventListener('change', (e)=>{
      selected = e.target.checked ? new Set(cats.map(c=>c.id)) : new Set();
      renderTable();
    });
  
    // 검색/필터
    byId('catSearch')?.addEventListener('input', e=>{ filter.q = e.target.value.trim(); renderTable(); });
    byId('catSearchClear')?.addEventListener('click', ()=>{ filter.q=''; byId('catSearch').value=''; renderTable(); });
    byId('catFilterParent')?.addEventListener('change', e=>{ filter.parent = e.target.value; renderTable(); });
    byId('catFilterVisible')?.addEventListener('change', e=>{ filter.visible = e.target.value; renderTable(); });
    byId('catResetFilters')?.addEventListener('click', ()=>{
        filter = { q:'', parent:'', visible:'' };
        if (byId('catSearch'))        byId('catSearch').value = '';
        if (byId('catFilterParent'))  byId('catFilterParent').value = '';
        if (byId('catFilterVisible')) byId('catFilterVisible').value = '';
        // 🔽 필요시 펼침상태 초기화 느낌으로 전체 펼치기 한번
        expandAll();
        renderTable();
      });
      
  
    // 일괄 작업
    byId('catBulkShow')?.addEventListener('click', ()=>{ cats.forEach(c=>{ if (selected.has(c.id)) c.visible=true; }); save(); renderTable(); });
    byId('catBulkHide')?.addEventListener('click', ()=>{ cats.forEach(c=>{ if (selected.has(c.id)) c.visible=false; }); save(); renderTable(); });
    byId('catBulkDelete')?.addEventListener('click', ()=>{
        if (!selected.size) return;
        if (confirm(`선택한 ${selected.size}개의 카테고리를 삭제하시겠습니까?`)) {
          const all = collectWithChildren(Array.from(selected));
          cats = cats.filter(c=>!all.has(c.id));
          selected.clear();
          save(); renderTable();
        }
      });

      byId('catBulkClear')?.addEventListener('click', ()=>{ selected.clear(); updateBulkBar(); renderTable(); });
  
    // 새 카테고리(데스크톱/모바일) → 추가 모달
    byId('catBtnNew')?.addEventListener('click', openAdd);
    byId('catBtnNewM')?.addEventListener('click', openAdd);
  
    // ----- 추가 모달 -----
    function openAdd(){
      renderParentOptions();
      byId('catAddForm')?.reset();
      byId('addVisible').checked = true;
      new bootstrap.Modal('#catAddModal').show();
    }
  
    byId('addName')?.addEventListener('input', ()=>{
      const name = byId('addName').value.trim();
      const el = byId('addSlug');
      if (!el.value.trim()) el.value = slugify(name);
    });
  
    byId('catAddSave')?.addEventListener('click', ()=>{
      const name = byId('addName').value.trim();
      let slug   = byId('addSlug').value.trim();
      const pid  = byId('addParent').value.trim();
      const desc = byId('addDesc').value.trim();
      const vis  = byId('addVisible').checked;
  
      if (!name){ alert('카테고리명을 입력하세요.'); byId('addName').focus(); return; }
      if (!slug) slug = slugify(name);
  
      const dup = cats.find(c=>c.slug===slug);
      if (dup){ alert('이미 사용 중인 슬러그입니다.'); byId('addSlug').focus(); return; }
  
      const newId = 'c'+Math.random().toString(36).slice(2,8);
      cats.push({
        id:newId, name, slug, parentId:pid||'', desc, visible:vis, boards:0, posts:0,
        order: nextOrderForParent(pid||'')
      });
      save(); renderParentOptions(); renderTable();
      bootstrap.Modal.getInstance('#catAddModal')?.hide();
    });
  
    // ----- 수정 모달 -----
    function openEdit(id){
      const c = cats.find(x=>x.id===id);
      if (!c) return;
  
      renderParentOptions();
  
      byId('editId').value    = c.id;
      byId('editName').value  = c.name || '';
      byId('editSlug').value  = c.slug || '';
      byId('editParent').value= c.parentId || '';
      byId('editDesc').value  = c.desc || '';
      byId('editVisible').checked = !!c.visible;
  
      new bootstrap.Modal('#catEditModal').show();
    }
  
    byId('editName')?.addEventListener('input', ()=>{
      const name = byId('editName').value.trim();
      const el = byId('editSlug');
      if (!el.value.trim()) el.value = slugify(name);
    });
  
    byId('catEditSave')?.addEventListener('click', ()=>{
      const id   = byId('editId').value.trim();
      const name = byId('editName').value.trim();
      let slug   = byId('editSlug').value.trim();
      const pid  = byId('editParent').value.trim();
      const desc = byId('editDesc').value.trim();
      const vis  = byId('editVisible').checked;
  
      if (!name){ alert('카테고리명을 입력하세요.'); byId('editName').focus(); return; }
      if (!slug) slug = slugify(name);
  
      const dup = cats.find(c=>c.slug===slug && c.id!==id);
      if (dup){ alert('이미 사용 중인 슬러그입니다.'); byId('editSlug').focus(); return; }
  
      const c = cats.find(x=>x.id===id);
      if (!c) return;
      c.name=name; c.slug=slug; c.parentId=pid||''; c.desc=desc; c.visible=vis;
  
      save(); renderParentOptions(); renderTable();
      bootstrap.Modal.getInstance('#catEditModal')?.hide();
    });
  
    // 삭제 확인
    function collectWithChildren(ids){
      const out = new Set();
      function dfs(id){
        out.add(id);
        cats.forEach(c=>{ if (c.parentId===id) dfs(c.id); });
      }
      ids.forEach(dfs);
      return out;
    }
    function openDeleteConfirm(){ new bootstrap.Modal('#catDeleteModal').show(); }
    byId('catDeleteConfirm')?.addEventListener('click', ()=>{
      const all = collectWithChildren(Array.from(selected));
      cats = cats.filter(c=>!all.has(c.id));
      selected.clear(); save(); renderTable();
      bootstrap.Modal.getInstance('#catDeleteModal')?.hide();
    });
  
    // 드래그 정렬(동일 부모 내)
    function initDrag(){
      let draggingId = null;
      $$('tr[draggable="true"]', tbody).forEach(tr=>{
        tr.addEventListener('dragstart', (e)=>{
          draggingId = tr.dataset.id;
          tr.classList.add('opacity-50');
          e.dataTransfer.effectAllowed = 'move';
        });
        tr.addEventListener('dragend', ()=>{ draggingId=null; tr.classList.remove('opacity-50'); });
        tr.addEventListener('dragover', (e)=>{
          e.preventDefault();
          const over = e.currentTarget;
          if (!draggingId || over.dataset.id===draggingId) return;
          const a = cats.find(c=>c.id===draggingId);
          const b = cats.find(c=>c.id===over.dataset.id);
          if (!a || !b) return;
          if ((a.parentId||'') !== (b.parentId||'')) return;
  
          const rect = over.getBoundingClientRect();
          const before = (e.clientY - rect.top) < rect.height/2;
  
          const sibs = cats.filter(c=>(c.parentId||'')===(a.parentId||'')).sort((x,y)=>(x.order||0)-(y.order||0));
          const ids = sibs.map(s=>s.id);
          const from = ids.indexOf(a.id);
          const to   = ids.indexOf(b.id) + (before?0:1);
          if (from<0) return;
          ids.splice(to,0,ids.splice(from,1)[0]);
          ids.forEach((id,idx)=>{ const c=cats.find(x=>x.id===id); c.order=idx+1; });
          save(); renderTable();
        });
      });
    }
  
    // 내보내기
    function download(filename, text){
      const blob = new Blob([text], {type:'text/plain;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
      URL.revokeObjectURL(url);
    }
    function downloadCsv(){
      const header = ['id','name','slug','parentId','desc','visible','order','boards','posts'];
      const lines = [header.join(',')];
      cats.forEach(c=>{
        const csv = (v)=>`"${String(v??'').replace(/"/g,'""')}"`;
        lines.push([c.id,csv(c.name),csv(c.slug),c.parentId||'',csv(c.desc||''),c.visible?1:0,c.order||0,c.boards||0,c.posts||0].join(','));
      });
      download('categories.csv', lines.join('\r\n'));
    }
    function downloadJson(){ download('categories.json', JSON.stringify(cats,null,2)); }
  
    byId('catExportCsv')?.addEventListener('click', downloadCsv);
    byId('catExportJson')?.addEventListener('click', downloadJson);
    byId('catExportCsvBtm')?.addEventListener('click', downloadCsv);
    byId('catExportJsonBtm')?.addEventListener('click', downloadJson);
  
    // 정렬 저장(알림)
    byId('catSaveOrder')?.addEventListener('click', ()=>alert('정렬이 저장되었습니다. (데모는 localStorage에 즉시 반영됩니다)'));
  
    // ===== 시작 =====
    seedIfEmpty();
    renderParentOptions();
    renderTable();
  });
  