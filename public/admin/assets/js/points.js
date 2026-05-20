/* /admin/assets/js/points.js
   Imweb Admin - Points manager
   - Mock dataset (데모)
   - 검색/필터/정렬/페이지네이션
   - 선택/일괄 적립·차감/만료(데모)
   - 개별 수정 & 로그 확인
*/
(() => {
    'use strict';
  
    const $  = (s, r=document)=>r.querySelector(s);
    const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
    const on = (el, ev, fn)=>el&&el.addEventListener(ev, fn);
    const money = (n)=> (n||0).toLocaleString('ko-KR');
  
    // ===== NEW: 등급 배지 매핑 =====
    // key: DB.users[].group
    const GROUP_TO_TIER_LABEL = {
        basic   : '일반',
        vip     : 'VIP',      // vip를 골드로 노출하려면 이렇게
        staff   : '관리자',      // 운영자는 별도 색 안 쓰면 '일반'로 둬도 됨
        gold    : '골드',
        silver  : '실버',
        bronze  : '브론즈',
        platinum: '플래티넘',
        diamond : '다이아',
      };
      function renderTierBadge(group) {
        const label = GROUP_TO_TIER_LABEL[group] || String(group || '일반');
        return `<span class="badge tier-badge" data-tier="${escapeHTML(label)}">${escapeHTML(label)}</span>`;
      }
  
    // ===== Mock Data (데모) =====
    const DB = (() => {
      const users = [
        { id:'gildong', name:'홍길동', email:'gildong@example.com', group:'basic', balance:12000, earned:35000, used:23000, recent:'2025-09-12', memo:'자주 구매', logs:[
          {ts:'2025-09-12 10:11', delta:+500, balance:12000, memo:'리뷰 적립'},
          {ts:'2025-09-01 09:20', delta:-1000, balance:11500, memo:'구매 사용'},
          {ts:'2025-08-10 12:00', delta:+2000, balance:12500, memo:'이벤트 적립'},
        ]},
        { id:'jane', name:'제인', email:'jane@picjeju.co.kr', group:'vip', balance:83000, earned:120000, used:37000, recent:'2025-09-15', memo:'VIP, 고액구매', logs:[
          {ts:'2025-09-15 14:01', delta:+3000, balance:83000, memo:'구매 적립'},
          {ts:'2025-09-10 08:33', delta:-5000, balance:80000, memo:'구매 사용'},
        ]},
        { id:'staff01', name:'관리자', email:'staff01@picjeju.co.kr', group:'staff', balance:0, earned:0, used:0, recent:'-', memo:'내부 계정', logs:[]},
        { id:'sumi', name:'이수미', email:'sumi@example.com', group:'basic', balance:4300, earned:9000, used:4700, recent:'2025-08-29', memo:'', logs:[
          {ts:'2025-08-29 16:21', delta:+300, balance:4300, memo:'출석 적립'},
        ]},
        { id:'han', name:'한나', email:'han@ex.co', group:'gold', balance:1500, earned:3500, used:2000, recent:'2025-07-02', memo:'', logs:[
          {ts:'2025-07-02 12:00', delta:-500, balance:1500, memo:'구매 사용'},
        ]},
        { id:'han', name:'한나2', email:'han@ex.co', group:'silver', balance:1500, earned:3500, used:2000, recent:'2025-07-02', memo:'', logs:[
            {ts:'2025-07-02 12:00', delta:-500, balance:1500, memo:'구매 사용'},
          ]},
          { id:'han', name:'한나3', email:'han@ex.co', group:'bronze', balance:1500, earned:3500, used:2000, recent:'2025-07-02', memo:'', logs:[
            {ts:'2025-07-02 12:00', delta:-500, balance:1500, memo:'구매 사용'},
          ]},
          { id:'han', name:'한나4', email:'han@ex.co', group:'platinum', balance:1500, earned:3500, used:2000, recent:'2025-07-02', memo:'', logs:[
            {ts:'2025-07-02 12:00', delta:-500, balance:1500, memo:'구매 사용'},
          ]},
          { id:'han', name:'한나5', email:'han@ex.co', group:'diamond', balance:1500, earned:3500, used:2000, recent:'2025-07-02', memo:'', logs:[
            {ts:'2025-07-02 12:00', delta:-500, balance:1500, memo:'구매 사용'},
          ]},
      ];
      return { users };
    })();
  
    // ===== State =====
    const state = {
      q: '',
      group: '',
      min: '',
      max: '',
      sortKey: 'name', // name | id | balance | earned | used | recent
      sortDir: 'asc',  // asc | desc
      page: 1,
      pageSize: 10,
      selected: new Set(), // ids
    };
  
    // ===== Elements =====
    const $tbody = $('#tbodyPoints');
    const $empty = $('#ptEmpty');
    const $loader= $('#ptLoader');
    const $checkAll = $('#ptCheckAll');
    const $selCount = $('#ptSelCount');
    const $pgNow = $('#ptPgNow');
    const $pgTotal = $('#ptPgTotal');
  
    // Filters
    const $q = $('#ptKeyword');
    const $group = $('#ptGroup');
    const $min = $('#ptMin');
    const $max = $('#ptMax');
  
    // Pagination
    on($('#ptPgPrev'), 'click', (e)=>{ e.preventDefault(); if(state.page>1){state.page--; render();}});
    on($('#ptPgNext'), 'click', (e)=>{ e.preventDefault(); const m=pagesMax(); if(state.page<m){state.page++; render();}});
  
    // Search/Filters
    on($('#btnPtSearch'), 'click', ()=>{ state.q=$q.value.trim(); state.page=1; render();});
    on($('#btnPtRange'), 'click', ()=>{ state.min=$min.value; state.max=$max.value; state.page=1; render();});
    on($group, 'change', ()=>{ state.group=$group.value; state.page=1; render();});
    on($q, 'keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); state.q=$q.value.trim(); state.page=1; render();}});
  
    // Sorting
    $$('#tblPoints thead th[data-sort]').forEach(th=>{
      on(th,'click', ()=>{
        const key = th.getAttribute('data-sort');
        if (state.sortKey===key) state.sortDir = (state.sortDir==='asc'?'desc':'asc');
        else { state.sortKey=key; state.sortDir='asc'; }
        render();
      });
    });
  
    // Bulk buttons
    on($('#btnBulkGrant'),  'click', ()=>openAdjustModal('bulk','grant'));
    on($('#btnBulkDeduct'), 'click', ()=>openAdjustModal('bulk','deduct'));
    on($('#btnBulkExpire'), 'click', ()=>doBulkExpire());
    on($('#btnExportPoints'),'click', ()=>doExport());
  
    // Help
    on($('#btnPtHelp'),'click', ()=> alert('검색, 그룹/포인트 범위 필터, 선택 후 일괄 적립/차감/만료(데모) 기능을 제공합니다.'));
  
    // Check all
    on($checkAll,'change', ()=>{
      const visibleIds = currentPageRows().map(u=>u.id);
      if ($checkAll.checked) visibleIds.forEach(id=>state.selected.add(id));
      else visibleIds.forEach(id=>state.selected.delete(id));
      renderBodyOnly();
    });
  
    // ===== Core =====
    function filtered() {
      let rows = [...DB.users];
  
      // search
      const q = state.q.toLowerCase();
      if (q) {
        rows = rows.filter(u =>
          (u.name||'').toLowerCase().includes(q) ||
          (u.id||'').toLowerCase().includes(q) ||
          (u.email||'').toLowerCase().includes(q)
        );
      }
  
      // group
      if (state.group) {
        rows = rows.filter(u => u.group === state.group);
      }
  
      // range
      const min = Number(state.min||'');
      const max = Number(state.max||'');
      if (!Number.isNaN(min)) rows = rows.filter(u => u.balance >= (state.min===''? -Infinity : min));
      if (!Number.isNaN(max)) rows = rows.filter(u => u.balance <= (state.max===''? Infinity : max));
  
      // sort
      const dir = state.sortDir==='asc'?1:-1;
      rows.sort((a,b)=>{
        const k = state.sortKey;
        let av = a[k]; let bv = b[k];
        if (k==='name' || k==='id') {
          av = (av||'').toString().toLowerCase();
          bv = (bv||'').toString().toLowerCase();
          return av>bv? dir : av<bv? -dir : 0;
        } else if (k==='recent') {
          const ad = a.recent==='-'?0:Date.parse(a.recent);
          const bd = b.recent==='-'?0:Date.parse(b.recent);
          return (ad-bd)*dir;
        } else {
          // numeric
          return ((av||0)-(bv||0))*dir;
        }
      });
  
      return rows;
    }
  
    function pagesMax() {
      const total = filtered().length;
      return Math.max(1, Math.ceil(total / state.pageSize));
    }
  
    function currentPageRows() {
      const all = filtered();
      const m = pagesMax();
      if (state.page>m) state.page = m;
      const start = (state.page-1)*state.pageSize;
      return all.slice(start, start + state.pageSize);
    }
  
    function render() {
      // header info
      $pgNow.textContent = state.page.toString();
      $pgTotal.textContent = pagesMax().toString();
  
      // rows
      renderBodyOnly();
  
      // empty/loader off
      $empty.classList.toggle('d-none', filtered().length !== 0);
      $loader.classList.add('d-none');
    }
  
    function renderBodyOnly() {
      const rows = currentPageRows();
      // sync header checkbox
      const visibleIds = rows.map(u=>u.id);
      const allChecked = visibleIds.length>0 && visibleIds.every(id=>state.selected.has(id));
      $checkAll.checked = allChecked;
  
      $tbody.innerHTML = rows.map(u => {
        const checked = state.selected.has(u.id) ? 'checked' : '';
        return `
          <tr data-id="${u.id}">
            <td><input type="checkbox" class="pt-check form-check-input" ${checked}></td>
            <td>
              <div class="fw-medium">
                ${escapeHTML(u.name)}
                <!-- NEW: 등급 배지 -->
                ${renderTierBadge(u.group)}
              </div>
            </td>
            <td>
              <div class="small text-body">${escapeHTML(u.id)}</div>
              <div class="text-body-secondary small">${escapeHTML(u.email)}</div>
            </td>
            <td class="text-end fw-semibold">${money(u.balance)}</td>
            <td class="text-end d-none d-lg-table-cell">${money(u.earned)}</td>
            <td class="text-end d-none d-lg-table-cell">${money(u.used)}</td>
            <td class="text-center d-none d-md-table-cell">${u.recent||'-'}</td>
            <td class="text-start d-none d-xl-table-cell">
              <div class="text-truncate" style="max-width:260px">${escapeHTML(u.memo||'')}</div>
            </td>
            <td class="text-end">
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-secondary btn-log" title="로그"><i class="ri-arrow-go-back-line"></i></button>
                <button class="btn btn-primary btn-adjust" title="수정"><i class="ri-edit-2-line"></i></button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
  
      // wire row events
      $$('.pt-check', $tbody).forEach(ch => {
        on(ch,'change', ()=>{
          const tr = ch.closest('tr'); const id = tr?.dataset.id;
          if (!id) return;
          if (ch.checked) state.selected.add(id); else state.selected.delete(id);
          refreshSelectedCount();
          syncHeaderCheckbox();
        });
      });
  
      $$('.btn-adjust', $tbody).forEach(btn=>{
        on(btn,'click', ()=>{
          const id = btn.closest('tr')?.dataset.id;
          if (!id) return;
          openAdjustModal('single','grant',[id]);
        });
      });
  
      $$('.btn-log', $tbody).forEach(btn=>{
        on(btn,'click', ()=>{
          const id = btn.closest('tr')?.dataset.id;
          if (!id) return;
          openLogModal(id);
        });
      });
  
      refreshSelectedCount();
    }
  
    function refreshSelectedCount() {
      $selCount.textContent = state.selected.size.toString();
    }
  
    function syncHeaderCheckbox() {
      const ids = currentPageRows().map(u=>u.id);
      const allChecked = ids.length>0 && ids.every(id=>state.selected.has(id));
      $checkAll.checked = allChecked;
    }
  
    function escapeHTML(s='') {
      return s.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[m]));
    }
  
    // ===== Adjust Modal =====
    const mdAdjust = new bootstrap.Modal($('#mdPointAdjust'));
    const $adjScope = $('#adjScope');
    const $adjIds = $('#adjTargetIds');
    const $adjAmount = $('#adjAmount');
    const $adjMemo = $('#adjMemo');
    const $adjGrant = $('#adjGrant');
    const $adjDeduct = $('#adjDeduct');
    const $adjTitle = $('#mdPointTitle');
    const $adjNotify= $('#adjNotify');
  
    function openAdjustModal(scope='single', type='grant', ids=[]) {
      if (scope==='bulk') {
        const sel = [...state.selected];
        if (!sel.length) return alert('선택된 회원이 없습니다.');
        $adjTitle.textContent = `일괄 ${type==='grant'?'적립':'차감'}`;
        $adjScope.value = 'bulk';
        $adjIds.value = sel.join(',');
      } else {
        $adjTitle.textContent = `포인트 ${type==='grant'?'적립':'차감'}`;
        $adjScope.value = 'single';
        $adjIds.value = (ids && ids.length)? ids.join(',') : '';
      }
      // type
      if (type==='grant') { $adjGrant.checked = true; } else { $adjDeduct.checked = true; }
      $adjAmount.value = '';
      $adjMemo.value = '';
      $adjNotify.checked = true;
      mdAdjust.show();
    }
  
    on($('#btnBulkGrant'), 'click', ()=>openAdjustModal('bulk','grant'));
    on($('#btnBulkDeduct'),'click', ()=>openAdjustModal('bulk','deduct'));
  
    on($('#formPointAdjust'),'submit', (e)=>{
      e.preventDefault();
      const ids = ($adjIds.value||'').split(',').filter(Boolean);
      if ($adjScope.value==='bulk' && !ids.length) return alert('선택된 회원이 없습니다.');
      const grant = $adjGrant.checked;
      const amt = Math.floor(Number($adjAmount.value||0));
      if (!Number.isFinite(amt) || amt<=0) return alert('포인트는 1 이상 정수로 입력하세요.');
      const memo = ($adjMemo.value||'').trim() || (grant?'관리자 적립':'관리자 차감');
  
      const targetIds = $adjScope.value==='single' ? ids : [...state.selected];
      targetIds.forEach(id => applyAdjust(id, grant?+amt:-amt, memo));
  
      if ($adjNotify.checked) {
        // 데모: 실제 발송 없음
      }
      state.selected.clear();
      mdAdjust.hide();
      render();
    });
  
    function applyAdjust(id, delta, memo) {
      const u = DB.users.find(x=>x.id===id);
      if (!u) return;
      const newBal = Math.max(0, (u.balance||0) + delta);
      u.balance = newBal;
      if (delta>0) u.earned = (u.earned||0) + delta;
      else         u.used   = (u.used  ||0) + Math.abs(delta);
      u.recent = (new Date()).toISOString().slice(0,10);
      u.logs.unshift({
        ts: new Date().toISOString().replace('T',' ').slice(0,16),
        delta: delta,
        balance: newBal,
        memo
      });
    }
  
    // ===== Expire (demo) =====
    function doBulkExpire() {
      const sel = [...state.selected];
      if (!sel.length) return alert('선택된 회원이 없습니다.');
      if (!confirm('선택 회원의 포인트를 모두 만료 처리할까요?')) return;
      sel.forEach(id => expireAll(id));
      state.selected.clear();
      render();
    }
    function expireAll(id) {
      const u = DB.users.find(x=>x.id===id);
      if (!u || !u.balance) return;
      const delta = -u.balance;
      applyAdjust(id, delta, '만료 처리');
    }
  
    // ===== Export =====
    function doExport() {
      const rows = filtered().map(u=>({
        id: u.id,
        name: u.name,
        email: u.email,
        group: u.group,
        balance: u.balance,
        earned: u.earned,
        used: u.used,
        recent: u.recent,
        memo: u.memo
      }));
      const csv = toCSV(rows);
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'points-export.csv';
      document.body.appendChild(a); a.click();
      setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); },0);
    }
  
    function toCSV(arr) {
      if (!arr.length) return '';
      const headers = Object.keys(arr[0]);
      const escape = v => {
        const s = String(v??'');
        if (/[",\n]/.test(s)) return `"${s.replace(/"/g,'""')}"`;
        return s;
      };
      const lines = [headers.join(',')];
      arr.forEach(o => lines.push(headers.map(h=>escape(o[h])).join(',')));
      return lines.join('\n');
    }
  
    // ===== Logs =====
    const mdLog = new bootstrap.Modal($('#mdPointLog'));
    function openLogModal(id) {
      const u = DB.users.find(x=>x.id===id);
      if (!u) return;
      $('#logUserName').textContent = u.name;
      const $logs = $('#tbodyLogs');
      if (!u.logs || !u.logs.length) {
        $logs.innerHTML = `<tr><td colspan="5" class="text-center text-body-secondary">로그가 없습니다.</td></tr>`;
      } else {
        $logs.innerHTML = u.logs.map(l => `
          <tr>
            <td>${l.ts}</td>
            <td>${l.delta>0? '적립':'사용/차감'}</td>
            <td class="text-end ${l.delta>0?'text-success':'text-danger'}">${l.delta>0?'+':''}${money(l.delta)}</td>
            <td class="text-end">${money(l.balance)}</td>
            <td>${escapeHTML(l.memo||'')}</td>
          </tr>
        `).join('');
      }
      mdLog.show();
    }
  
    // ===== Init =====
    render();
  
  })();
  