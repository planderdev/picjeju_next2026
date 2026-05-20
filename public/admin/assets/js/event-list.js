/* /admin/assets/js/event-list.js */
(() => {
    'use strict';
    const $  = (s, r=document) => r.querySelector(s);
    const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
    const KEY_EVENTS  = 'ADMIN_EVENTS';
    const KEY_REVIEWS = 'ADMIN_EVENT_REVIEWS';
  
    // ---- seed helpers ----
    function seedIfEmpty() {
      const evRaw = localStorage.getItem(KEY_EVENTS);
      if (!evRaw) {
        const now = new Date();
        const y = now.getFullYear(), m = String(now.getMonth()+1).padStart(2,'0');
        const seed = [
          { id: crypto.randomUUID(), title:'제주 재즈 나이트', venue:'제주아트센터', start:`${y}-${m}-05`, end:`${y}-${m}-05`, category:'공연', visible:true, thumb:'', desc:'섬에서 즐기는 가을 재즈', tags:['제주','재즈'] },
          { id: crypto.randomUUID(), title:'돌문화공원 사진전', venue:'돌문화공원', start:`${y}-${m}-01`, end:`${y}-${m}-20`, category:'전시', visible:true, thumb:'', desc:'제주의 돌과 빛', tags:['전시','가족'] },
          { id: crypto.randomUUID(), title:'해변 버스킹 페스티벌', venue:'이호테우', start:`${y}-${m}-15`, end:`${y}-${m}-16`, category:'공연', visible:true, thumb:'', desc:'바다와 음악', tags:['야외','무료'] },
        ];
        localStorage.setItem(KEY_EVENTS, JSON.stringify(seed));
      }
      const rvRaw = localStorage.getItem(KEY_REVIEWS);
      if (!rvRaw) {
        const events = JSON.parse(localStorage.getItem(KEY_EVENTS) || '[]');
        const rv = [
          { id: crypto.randomUUID(), eventId: events[0]?.id || 'e1', date:new Date().toISOString().slice(0,10), rating:5, body:'최고였어요!', visible:true },
          { id: crypto.randomUUID(), eventId: events[1]?.id || 'e2', date:new Date(Date.now()-86400000).toISOString().slice(0,10), rating:4, body:'전시가 알찼습니다.', visible:true },
        ];
        localStorage.setItem(KEY_REVIEWS, JSON.stringify(rv));
      }
    }
    seedIfEmpty();
  
    // ---- state ----
    let items = JSON.parse(localStorage.getItem(KEY_EVENTS) || '[]');
    const state = { filtered: [], selected: new Set(), statusCounts:{all:0,sch:0,ong:0,end:0} };
  
    // ---- utils ----
    const fmt = n => (n||0).toLocaleString('ko-KR');
    const escapeHtml = s => (s||'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
    const adminUrl = path => ( (window.ADMIN_BASE_PATH||'/picjeju/admin').replace(/\/$/,'') + '/' + String(path).replace(/^\//,'') );
    const computeStatus = it => {
      const today = new Date().toISOString().slice(0,10);
      if (it.end < today) return 'ended';
      if (it.start > today) return 'scheduled';
      return 'ongoing';
    };
    function save() { localStorage.setItem(KEY_EVENTS, JSON.stringify(items)); }
  
    // ---- elements ----
    const elTbody = $('#evTable tbody');
    const elCount = $('#evCount'), elCountFiltered = $('#evCountFiltered');
    const elCheckAll = $('#evCheckAll');
    const elSearch = $('#evSearch'), elSort = $('#evSort'), elCat = $('#evFilterCategory');
  
    // ---- apply & render ----
    function apply() {
      let arr = items.map(it => ({...it, status: computeStatus(it)}));
      const q = (elSearch?.value || '').toLowerCase().trim();
      const cat = (elCat?.value || '').toLowerCase().trim();
      const active = document.querySelector('.rail-list .active')?.getAttribute('data-filter-status') || '__ALL__';
  
      if (q) {
        arr = arr.filter(it =>
          it.title.toLowerCase().includes(q) ||
          (it.venue||'').toLowerCase().includes(q) ||
          (it.category||'').toLowerCase().includes(q) ||
          (it.tags||[]).join(',').toLowerCase().includes(q)
        );
      }
      if (cat) {
        arr = arr.filter(it =>
          (it.category||'').toLowerCase().includes(cat) ||
          (it.tags||[]).join(',').toLowerCase().includes(cat)
        );
      }
      if (active !== '__ALL__') arr = arr.filter(it => it.status === active);
  
      const sort = elSort?.value || '-start';
      arr.sort((a,b)=>{
        if (sort==='start') return a.start.localeCompare(b.start);
        if (sort==='-start') return b.start.localeCompare(a.start);
        if (sort==='title') return a.title.localeCompare(b.title,'ko');
        return 0;
      });
  
      state.filtered = arr;
      // status counts
      const all = items.length;
      const sch = items.filter(x=>computeStatus(x)==='scheduled').length;
      const ong = items.filter(x=>computeStatus(x)==='ongoing').length;
      const end = items.filter(x=>computeStatus(x)==='ended').length;
      state.statusCounts = {all,sch,ong,end};
  
      render();
    }
  
    function render() {
      elTbody.innerHTML = '';
      state.selected.clear();
      if (elCheckAll) elCheckAll.checked = false;
      document.getElementById('evCountAll').textContent = fmt(state.statusCounts.all);
      document.getElementById('evCountScheduled').textContent = fmt(state.statusCounts.sch);
      document.getElementById('evCountOngoing').textContent = fmt(state.statusCounts.ong);
      document.getElementById('evCountEnded').textContent = fmt(state.statusCounts.end);
  
      for (const it of state.filtered) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><input class="form-check-input row-check" type="checkbox" data-id="${it.id}"></td>
          <td>
            <div class="d-flex align-items-center gap-2">
              ${it.thumb?`<img src="${it.thumb}" class="rounded" style="width:48px;height:48px;object-fit:cover;">`:''}
              <div>
                <div class="fw-semibold">${escapeHtml(it.title)}</div>
                <div class="text-muted small">${escapeHtml(it.category||'')} · ${escapeHtml(it.venue||'')}</div>
              </div>
            </div>
          </td>
          <td><span class="badge text-bg-light">${it.start}</span> ~ <span class="badge text-bg-light">${it.end}</span></td>
          <td>${escapeHtml(it.venue||'-')}</td>
          <td>${labelStatus(it.status)}</td>
          <td>
            <div class="form-check form-switch">
              <input class="form-check-input toggle-visible" type="checkbox" data-id="${it.id}" ${it.visible?'checked':''}>
            </div>
          </td>
          <td>
            <div class="btn-group">
              <a class="btn btn-sm btn-outline-secondary" href="${adminUrl('event/add')}?id=${it.id}"><i class="ri-edit-2-line"></i></a>
              <button class="btn btn-sm btn-outline-danger one-del" data-id="${it.id}"><i class="ri-delete-bin-6-line"></i></button>
            </div>
          </td>`;
        elTbody.appendChild(tr);
      }
      elCount.textContent = `${fmt(state.filtered.length)}`;
      elCountFiltered.textContent = fmt(state.filtered.length);
      updateBulkBar();
    }
  
    function labelStatus(st) {
      const map = { scheduled:['secondary','예정'], ongoing:['success','진행중'], ended:['dark','종료'] };
      const [cls,txt] = map[st] || ['light','-'];
      return `<span class="badge text-bg-${cls}">${txt}</span>`;
    }
  
    function updateBulkBar() {
      const has = state.selected.size>0;
      document.getElementById('evBulkBar')?.classList.toggle('d-none', !has);
    }
  
    // ---- events ----
    document.addEventListener('click', (e)=>{
      const a = e.target.closest('.rail-list [data-filter-status]');
      if (a) {
        e.preventDefault();
        $$('.rail-list [data-filter-status]').forEach(x=>x.classList.remove('active'));
        a.classList.add('active');
        apply();
        return;
      }
      const btn = e.target.closest('button,a');
      if (!btn) return;
  
      if (btn.id==='evExportCsv' || btn.id==='evExportCsvMenu') exportCsv();
      if (btn.id==='evExportJsonMenu') exportJson();
  
      if (btn.classList.contains('one-del')) {
        const id = btn.dataset.id;
        if (confirm('삭제하시겠습니까?')) {
          items = items.filter(x=>x.id!==id); save(); apply();
        }
      }
      if (btn.id==='evBulkDelete' && state.selected.size) {
        if (confirm('선택 삭제?')) {
          items = items.filter(x=>!state.selected.has(x.id)); save(); apply();
        }
      }
      if (btn.id==='evBulkVisible' && state.selected.size) {
        items.forEach(x=>{ if(state.selected.has(x.id)) x.visible=true; }); save(); apply();
      }
      if (btn.id==='evBulkHidden' && state.selected.size) {
        items.forEach(x=>{ if(state.selected.has(x.id)) x.visible=false; }); save(); apply();
      }
    });
  
    document.addEventListener('change', (e)=>{
      const t = e.target;
      if (t.id==='evCheckAll') {
        $$('.row-check', $('#evTable')).forEach(i=>{
          i.checked=t.checked; i.dispatchEvent(new Event('change'));
        });
      }
      if (t.classList.contains('row-check')) {
        const id=t.dataset.id;
        if (t.checked) state.selected.add(id); else state.selected.delete(id);
        updateBulkBar();
      }
      if (t.classList.contains('toggle-visible')) {
        const it = items.find(x=>x.id===t.dataset.id); if(!it) return; it.visible=!!t.checked; save();
      }
      if (['evSearch','evSort','evFilterCategory'].includes(t.id)) apply();
    });
  
    // 빠른추가(데모)
    $('#formQuickAdd')?.addEventListener('submit',(e)=>{
      e.preventDefault();
      const withRv = $('#qaWithReviews')?.checked;
      const ymd = (d)=>d.toISOString().slice(0,10);
      const t=new Date();
      const e1 = { id:crypto.randomUUID(), title:'데모 · 클래식 나이트', venue:'제주문예회관', start:ymd(new Date(t.getFullYear(),t.getMonth(),20)), end:ymd(new Date(t.getFullYear(),t.getMonth(),20)), category:'공연', visible:true, desc:'오케스트라 연주' };
      const e2 = { id:crypto.randomUUID(), title:'데모 · 야외 전시', venue:'사려니숲길', start:ymd(new Date(t.getFullYear(),t.getMonth(),10)), end:ymd(new Date(t.getFullYear(),t.getMonth(),25)), category:'전시', visible:true, desc:'자연 속 작품' };
      const e3 = { id:crypto.randomUUID(), title:'데모 · 버스킹 데이', venue:'이호테우', start:ymd(new Date(t.getFullYear(),t.getMonth(),5)),  end:ymd(new Date(t.getFullYear(),t.getMonth(),5)),  category:'공연', visible:true, desc:'자유 공연' };
      items.push(e1,e2,e3); save();
      if (withRv) {
        const rv = JSON.parse(localStorage.getItem(KEY_REVIEWS)||'[]');
        rv.push({id:crypto.randomUUID(),eventId:e1.id,date:ymd(new Date()),rating:5,body:'완전 좋았어요!',visible:true});
        rv.push({id:crypto.randomUUID(),eventId:e2.id,date:ymd(new Date()),rating:4,body:'공기가 좋아요',visible:true});
        localStorage.setItem(KEY_REVIEWS, JSON.stringify(rv));
      }
      bootstrap.Modal.getInstance(document.getElementById('modalQuickAdd'))?.hide();
      apply();
    });
  
    // 가져오기(데모)
    const importFile = $('#evImportFile');
    importFile?.addEventListener('change', ()=>{
      $('#evImportName').textContent = importFile.files[0]?.name || '선택된 파일 없음';
      $('#evImportRun').disabled = !importFile.files.length;
    });
    $('#evImportRun')?.addEventListener('click', ()=>{
      // 데모: 실제 파싱 없이 알림만
      alert('데모 모드: CSV를 파싱하지 않고 완료 메시지만 표시합니다.');
      bootstrap.Modal.getInstance(document.getElementById('modalImport'))?.hide();
    });
  
    function exportJson() {
      const blob = new Blob([JSON.stringify(state.filtered, null, 2)], {type:'application/json'});
      download(blob, 'events.json');
    }
    function exportCsv() {
      const cols=['id','title','start','end','venue','category','visible'];
      const rows=[cols.join(',')].concat(state.filtered.map(it=>cols.map(k=>`"${(it[k]??'').toString().replace(/"/g,'""')}"`).join(',')));
      const blob = new Blob(["\ufeff"+rows.join('\n')],{type:'text/csv;charset=utf-8;'});
      download(blob,'events.csv');
    }
    function download(blob,filename){
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500);
    }
  
    // first
    apply();
  })();
  