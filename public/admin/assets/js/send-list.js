/* /admin/assets/js/send_list.js
 * 발송 내역 리스트 (데모)
 * - kakao_friend.js 에서 쓰던 로그 + 자체 시드 로그를 합쳐 보여줌
 * - 필터/정렬/페이지/CSV/상세 모달
 */
(function(){
    const $  = (s,r=document)=>r.querySelector(s);
    const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
    const on = (el,ev,fn)=>el&&el.addEventListener(ev,fn);
  
    // LocalStorage keys (친구톡 데모에서 사용한 것 포함)
    const LS_KEYS = {
      FRIEND_LOGS : 'imw.member.kakao_friend.logs.v1',
      SMS_LOGS    : 'imw.member.sms.logs.v1' // 본 파일에서 필요시 시드
    };
  
    // CSV util
    function toCsv(rows){
      const esc = (v)=>`"${String(v??'').replace(/"/g,'""')}"`;
      return rows.map(r=>r.map(esc).join(',')).join('\r\n');
    }
    function download(name, content, type='text/csv'){
      const blob = new Blob([content], {type});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name; a.click();
      setTimeout(()=>URL.revokeObjectURL(url), 10);
    }
  
    // 날짜 포맷
    const fmtDT = (iso)=> iso ? new Date(iso).toLocaleString('ko-KR') : '-';
    const todayStr = ()=> new Date().toISOString().slice(0,10);
  
    // ===== Load/Seed logs =====
    function getLS(k, d){ try{ const v=localStorage.getItem(k); return v? JSON.parse(v):d; }catch(e){ return d; } }
    function setLS(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
  
    // 간단한 시드 (없으면 넣기)
    function seedIfEmpty(){
      let smsLogs = getLS(LS_KEYS.SMS_LOGS, null);
      if (!smsLogs || !smsLogs.length){
        const now = new Date();
        const isoNow = now.toISOString();
        const iso1h  = new Date(now.getTime()-3600e3).toISOString();
        const isoY   = new Date(now.getTime()-86400e3).toISOString();
        smsLogs = [
          {
            id: 's1', channel:'sms', date: iso1h, title:'결제 완료 안내', body:'주문이 결제되었습니다.',
            status:'success', success: 24, fail: 0, count: 24, reserveAt:null,
            recipients: [
              {phone:'010-0000-0001', name:'홍길동1', status:'success', sentAt: iso1h},
              {phone:'010-0000-0002', name:'홍길동2', status:'success', sentAt: iso1h}
            ]
          },
          {
            id: 's2', channel:'alimtalk', date: isoY, title:'배송 시작', body:'송장번호 123-456',
            status:'partial', success: 18, fail: 2, count: 20, reserveAt:null,
            recipients: [
              {phone:'010-0000-0011', name:'김아임', status:'success', sentAt: isoY},
              {phone:'010-0000-0012', name:'박채널', status:'fail',    sentAt: isoY}
            ]
          },
          {
            id: 's3', channel:'friendtalk', date: isoNow, title:'앱 전용 특가', body:'주말 특가 🔥',
            status:'scheduled', success: 0, fail: 0, count: 42, reserveAt: new Date(now.getTime()+2*3600e3).toISOString(),
            recipients: []
          }
        ];
        setLS(LS_KEYS.SMS_LOGS, smsLogs);
      }
    }
    seedIfEmpty();
  
    // kakao_friend 로그와 병합
    function loadAll(){
      const a = getLS(LS_KEYS.SMS_LOGS, []);
      const b = (getLS(LS_KEYS.FRIEND_LOGS, [])||[]).map((l,idx)=>({
        id: `f_${idx}_${l.date}`,
        channel:'friendtalk',
        date: l.date,
        title: l.title || '(제목 없음)',
        body: '',
        status: l.status==='scheduled'?'scheduled':(l.fail>0?'partial':'success'),
        success: Number(l.success||0),
        fail: Number(l.fail||0),
        count: Number(l.count||0),
        reserveAt: l.reserveAt || null,
        recipients:[]
      }));
      return [...a, ...b].sort((x,y)=> x.date>y.date? -1: 1);
    }
  
    // ===== State & DOM =====
    let ALL = loadAll();
    let FILTERED = [...ALL];
    const state = { page:1, pageSize:10, sort:'date_desc' };
  
    const logTableBody = $('#logTable tbody');
    const pager = $('#pager');
    const statTodaySent = $('#statTodaySent');
    const statTodayFail = $('#statTodayFail');
    const statScheduled = $('#statScheduled');
    const statShown = $('#statShown');
    const statTotal = $('#statTotal');
    const checkedCount = $('#checkedCount');
  
    const fChannel = $('#fChannel');
    const fStatus  = $('#fStatus');
    const fFrom    = $('#fFrom');
    const fTo      = $('#fTo');
    const fQuery   = $('#fQuery');
    const sortBy   = $('#sortBy');
  
    const btnApplyFilters = $('#btnApplyFilters');
    const btnResetFilters = $('#btnResetFilters');
    const btnRefresh = $('#btnRefresh');
    const btnRefresh_m = $('#btnRefresh_m');
    const btnClearAll = $('#btnClearAll');
    const btnClearAll_m = $('#btnClearAll_m');
    const btnExportCsv = $('#btnExportCsv');
  
    // ===== Render =====
    function renderStats(){
      const today = todayStr();
      let s=0,f=0,sch=0;
      ALL.forEach(l=>{
        if ((l.date||'').startsWith(today)) { s += l.success||0; f += l.fail||0; }
        if (l.status==='scheduled') sch++;
      });
      statTodaySent.textContent = s;
      statTodayFail.textContent = f;
      statScheduled.textContent = sch;
      statShown.textContent = FILTERED.length;
      statTotal.textContent = ALL.length;
    }
  
    function renderTable(){
      // sort
      FILTERED.sort((a,b)=>{
        if (state.sort==='date_asc') return a.date>b.date?1:-1;
        return a.date>b.date?-1:1;
      });
  
      // pagination
      const start = (state.page-1)*state.pageSize;
      const rows = FILTERED.slice(start, start+state.pageSize);
  
      if (!rows.length){
        logTableBody.innerHTML = `<tr><td colspan="9" class="text-center text-body-secondary py-4">표시할 내역이 없습니다.</td></tr>`;
        renderPager();
        checkedCount.textContent = '0';
        return;
      }
  
      logTableBody.innerHTML = rows.map(l=>`
        <tr data-id="${l.id}">
          <td><input class="form-check-input row-check" type="checkbox"></td>
          <td>${fmtDT(l.date)}</td>
          <td class="truncate" title="${escapeHtml(l.title||'')}">${escapeHtml(l.title||'')}</td>
          <td>${badgeChannel(l.channel)}</td>
          <td>${badgeStatus(l.status, l.fail)}</td>
          <td class="text-end">${Number(l.success||0)}</td>
          <td class="text-end">${Number(l.fail||0)}</td>
          <td class="text-end">${Number(l.count||0)}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-light btn-detail">보기</button>
          </td>
        </tr>
      `).join('');
  
      // bind
      $$('.row-check', logTableBody).forEach(cb=>{
        on(cb,'change', ()=> {
          const n = $$('.row-check', logTableBody).filter(x=>x.checked).length;
          checkedCount.textContent = n;
        });
      });
      $$('.btn-detail', logTableBody).forEach(btn=>{
        on(btn,'click', ()=>{
          const id = btn.closest('tr')?.dataset.id;
          openDetail(id);
        });
      });
  
      renderPager();
    }
  
    function renderPager(){
      const total = FILTERED.length;
      const pages = Math.max(1, Math.ceil(total/state.pageSize));
      const cur = Math.min(state.page, pages);
      state.page = cur;
  
      const prevDisabled = (cur<=1) ? 'disabled':'';
      const nextDisabled = (cur>=pages) ? 'disabled':'';
  
      const items = [];
      items.push(`<li class="page-item ${prevDisabled}"><a class="page-link" data-pg="${cur-1}" href="#">이전</a></li>`);
      for(let i=1;i<=pages;i++){
        items.push(`<li class="page-item ${i===cur?'active':''}"><a class="page-link" data-pg="${i}" href="#">${i}</a></li>`);
      }
      items.push(`<li class="page-item ${nextDisabled}"><a class="page-link" data-pg="${cur+1}" href="#">다음</a></li>`);
  
      pager.innerHTML = items.join('');
      $$('a.page-link', pager).forEach(a=>{
        on(a,'click', (e)=>{
          e.preventDefault();
          const pg = Number(a.dataset.pg);
          if (!isNaN(pg) && pg>=1) { state.page = pg; renderTable(); }
        });
      });
    }
  
    function badgeChannel(ch){
      const map = {
        sms:'<span class="badge text-bg-secondary">SMS</span>',
        lms:'<span class="badge text-bg-dark">LMS</span>',
        alimtalk:'<span class="badge text-bg-warning">알림톡</span>',
        friendtalk:'<span class="badge text-bg-info">친구톡</span>'
      };
      return map[ch] || `<span class="badge text-bg-light">${escapeHtml(ch||'-')}</span>`;
    }
    function badgeStatus(st, fail){
      if (st==='scheduled') return '<span class="badge text-bg-info">예약</span>';
      if (st==='success' && Number(fail||0)===0) return '<span class="badge text-bg-success">성공</span>';
      if (st==='fail' || Number(fail||0)>0) return '<span class="badge text-bg-warning">부분실패</span>';
      return '<span class="badge text-bg-light">-</span>';
    }
    function escapeHtml(s){ return (s??'').toString().replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[m])); }
  
    // ===== Filters =====
    function applyFilters(){
      const ch = fChannel?.value || '__ALL__';
      const st = fStatus?.value || '__ALL__';
      const q  = (fQuery?.value || '').trim().toLowerCase();
      const from = fFrom?.value || '';
      const to   = fTo?.value || '';
  
      FILTERED = ALL.filter(l=>{
        if (ch!=='__ALL__' && l.channel!==ch) return false;
        if (st!=='__ALL__'){
          const stOk =
            (st==='success'   && l.status==='success' && Number(l.fail||0)===0) ||
            (st==='partial'   && (l.status==='partial' || (l.status==='success' && Number(l.fail||0)>0))) ||
            (st==='fail'      && l.status==='fail') ||
            (st==='scheduled' && l.status==='scheduled');
          if (!stOk) return false;
        }
        if (from && (l.date||'').slice(0,10) < from) return false;
        if (to   && (l.date||'').slice(0,10) > to)   return false;
  
        if (q){
          const hay = [l.title||'', l.body||''].join('\n').toLowerCase();
          const rec = (l.recipients||[]).some(r=> (r.phone||'').includes(q) || (r.name||'').toLowerCase().includes(q));
          if (!hay.includes(q) && !rec) return false;
        }
        return true;
      });
  
      state.page = 1;
      renderStats();
      renderTable();
    }
  
    // ===== Detail modal =====
    function openDetail(id){
      const l = ALL.find(x=>x.id===id);
      if (!l) return;
      $('#mdTitle').textContent = l.title || '(제목 없음)';
      $('#mdBody').textContent  = l.body || '';
      $('#mdChannel').textContent = ({sms:'SMS', lms:'LMS', alimtalk:'알림톡', friendtalk:'친구톡'})[l.channel] || l.channel;
      $('#mdStatus').innerHTML = badgeStatus(l.status, l.fail);
      $('#mdSucc').textContent = Number(l.success||0);
      $('#mdFail').textContent = Number(l.fail||0);
      $('#mdReserve').textContent = l.reserveAt ? fmtDT(l.reserveAt) : '-';
  
      const rows = (l.recipients||[]).map(r=>`
        <tr>
          <td>${escapeHtml(r.phone||'-')}</td>
          <td>${escapeHtml(r.name||'-')}</td>
          <td>${r.status==='success'
                ? '<span class="badge text-bg-success">성공</span>'
                : r.status==='fail'
                  ? '<span class="badge text-bg-danger">실패</span>'
                  : '<span class="badge text-bg-light">-</span>'}</td>
          <td>${fmtDT(r.sentAt)}</td>
        </tr>`).join('');
      $('#mdRecipients').innerHTML = rows || `<tr><td colspan="4" class="text-center text-body-secondary">수신자 없음</td></tr>`;
  
      const m = bootstrap.Modal.getOrCreateInstance($('#modalDetail'));
      m.show();
    }
  
    // ===== Handlers =====
    on(btnApplyFilters,'click', applyFilters);
    on(btnResetFilters,'click', ()=>{
      if (fChannel) fChannel.value='__ALL__';
      if (fStatus)  fStatus.value='__ALL__';
      if (fFrom)    fFrom.value='';
      if (fTo)      fTo.value='';
      if (fQuery)   fQuery.value='';
      applyFilters();
    });
    on(sortBy,'change', ()=>{
      state.sort = sortBy.value;
      renderTable();
    });
  
    function reloadAll(){
      ALL = loadAll();
      applyFilters();
    }
    on(btnRefresh,'click', reloadAll);
    on(btnRefresh_m,'click', reloadAll);
  
    on(btnClearAll,'click', ()=>{
      if (!confirm('모든 발송 로그를 삭제할까요? (데모)')) return;
      localStorage.removeItem(LS_KEYS.SMS_LOGS);
      localStorage.removeItem(LS_KEYS.FRIEND_LOGS);
      reloadAll();
    });
    on(btnClearAll_m,'click', ()=> btnClearAll.click());
  
    on(btnExportCsv,'click', ()=>{
      const rows = [
        ['id','date','channel','status','title','success','fail','count','reserveAt']
      ].concat(ALL.map(l=>[
        l.id, l.date, l.channel, l.status, l.title||'', l.success||0, l.fail||0, l.count||0, l.reserveAt||''
      ]));
      download(`send_logs_${new Date().toISOString().slice(0,10)}.csv`, toCsv(rows));
    });
  
    // ===== init =====
    applyFilters();
  })();
  