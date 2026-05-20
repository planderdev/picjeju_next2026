/* /admin/assets/js/kakao_friend.js
 * 친구톡 보내기 (데모) — /admin/member/kakao_friend
 * localStorage로 연락처/템플릿/로그/쿼타 시뮬레이션
 */

(function(){
    const $  = (s,r=document)=>r.querySelector(s);
    const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
    const on = (el,ev,fn)=>el&&el.addEventListener(ev,fn);
    const onAll = (els,ev,fn)=>els.forEach(el=>on(el,ev,fn));
  
    // Storage keys (member-scope로 네임스페이스)
    const storage = {
      contacts: 'imw.member.kakao_friend.contacts.v1',
      templates:'imw.member.kakao_friend.tpl.v1',
      logs:     'imw.member.kakao_friend.logs.v1',
      quota:    'imw.member.kakao_friend.quota.v1'
    };
  
    /* ===== Seed ===== */
    function seedContacts() {
      const demo = [];
      const seg = (i)=> i%5===0?'VIP' : i%3===0?'DORMANT' : 'RECENT';
      for (let i=1;i<=42;i++){
        demo.push({
          id:'c'+i,
          name:`홍길동${i}`,
          phone:`010-${String(1000+i).slice(-4)}-${String(2000+i).slice(-4)}`,
          tags: i%2? ['블랙프라이데이','앱유저'] : ['신규','푸시거부X'],
          segment: seg(i)
        });
      }
      localStorage.setItem(storage.contacts, JSON.stringify(demo));
      return demo;
    }
    function seedTemplates() {
      const demo = [
        {
          id:'t1', title:'신규가입 환영', body:
  `{{name}}님, 환영합니다!
  첫 구매 전용 5,000P가 지급되었어요 🎁
  - 쿠폰: {{coupon_code}}
  - 유효기간: {{coupon_expiry}}
  지금 혜택 확인해보세요.`,
          btnText:'바로가기', btnUrl:'https://example.com/join', img:'/admin/assets/img/sample-thumb.svg'
        },
        {
          id:'t2', title:'앱 전용 특가', body:
  `앱에서만 열리는 주말 특가 🔥
  지금 접속하면 {{name}}님 전용 할인!`,
          btnText:'앱 열기', btnUrl:'https://example.com/app', img:''
        },
        {
          id:'t3', title:'휴면 고객 케어', body:
  `그동안 잘 지내셨어요, {{name}}님?
  돌아오신 고객님께 추가 쿠폰을 드려요.`,
          btnText:'쿠폰 받기', btnUrl:'https://example.com/coupon', img:'/admin/assets/img/sample-thumb.svg'
        }
      ];
      localStorage.setItem(storage.templates, JSON.stringify(demo));
      return demo;
    }
  
    const get = (k, dflt)=>{ try { const v = localStorage.getItem(k); return v? JSON.parse(v) : dflt; } catch(e){ return dflt; } };
    const set = (k, v)=> localStorage.setItem(k, JSON.stringify(v));
  
    let CONTACTS  = get(storage.contacts, null)  || seedContacts();
    let TEMPLATES = get(storage.templates, null) || seedTemplates();
    let LOGS      = get(storage.logs, []);
    let QUOTA     = ensureTodayQuota();
  
    function ensureTodayQuota(){
      const today = new Date().toISOString().slice(0,10);
      let q = get(storage.quota, null);
      if (!q) { q = { date: today, daily: 100, remain: 100 }; set(storage.quota, q); }
      if (q.date !== today) { q.date = today; q.remain = q.daily; set(storage.quota, q); }
      return q;
    }
  
    /* ===== DOM ===== */
    const quotaRemain = $('#quotaRemain');
    const quotaDaily  = $('#quotaDaily');
    const todaySuccess= $('#todaySuccess');
    const todayFail   = $('#todayFail');
  
    const btnSelectAudience = $('#btnSelectAudience');
    const btnClearAudience  = $('#btnClearAudience');
    const audienceChips     = $('#audienceChips');
    const quickSearch       = $('#quickSearch');
    const selectedCount     = $('#selectedCount');
  
    const msgTitle = $('#msgTitle');
    const msgBody  = $('#msgBody');
    const btnText  = $('#btnText');
    const btnUrl   = $('#btnUrl');
    const imgUrl   = $('#imgUrl');
    const reserveAt= $('#reserveAt');
    const optAb    = $('#optAbtest');
    const optTrack = $('#optTrack');
  
    const btnTemplate = $$('.js-template');
    const btnPreview  = $('#btnPreview');
    const btnSend     = $('#btnSend');
    const btnSendTest = $$('.js-send-test');
    const btnOpenLogs = $('#btnOpenLogs');
    const btnRefreshLogs = $('#btnRefreshLogs');
  
    // Modals
    const audienceModalEl = $('#audienceModal');
    const audienceModal   = audienceModalEl ? new bootstrap.Modal(audienceModalEl) : null;
    const audSearch = $('#audSearch');
    const audTbody  = $('#audTbody');
    const audSelCount = $('#audSelCount');
    const audCheckAll = $('#audCheckAll');
    const audApply = $('#audApply');
  
    const tplModalEl = $('#tplModal');
    const tplModal   = tplModalEl ? new bootstrap.Modal(tplModalEl) : null;
    const tplGrid    = $('#tplGrid');
  
    const previewModalEl = $('#previewModal');
    const previewModal = previewModalEl ? new bootstrap.Modal(previewModalEl) : null;
    const pvTitle = $('#pvTitle');
    const pvBody  = $('#pvBody');
    const pvImg   = $('#pvImg');
    const pvBtn   = $('#pvBtn');
  
    const logsModalEl = $('#logsModal');
    const logsModal = logsModalEl ? new bootstrap.Modal(logsModalEl) : null;
    const logsTbody = $('#logsTbody');
    const btnClearLogs = $('#btnClearLogs');
  
    const logTableBody = $('#logTable tbody');
  
    /* ===== State ===== */
    const state = {
      selectedIds: new Set(),
      audienceFilter: { quick:'', seg:{VIP:true,RECENT:true,DORMANT:true} },
      modalFilter: { q:'', seg:'all' }
    };
  
    /* ===== Utils ===== */
    const fmtDT = (iso)=> iso ? new Date(iso).toLocaleString('ko-KR') : '-';
    const todayStr = ()=> new Date().toISOString().slice(0,10);
    function escapeHtml(s){ return (s??'').toString().replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[m])); }
    function interpolate(tpl, c){
      const map = { name:c.name, phone:c.phone, segment:c.segment, coupon_code:'WELCOME-5000', coupon_expiry:'2025-12-31' };
      return (tpl||'').replace(/\{\{(\w+)\}\}/g, (_,k)=> map[k] ?? '');
    }
    function toast(text){
      const wrap = document.createElement('div');
      wrap.className = 'position-fixed bottom-0 end-0 p-3'; wrap.style.zIndex = 1080;
      wrap.innerHTML = `<div class="toast show"><div class="toast-header"><strong class="me-auto">안내</strong></div><div class="toast-body">${escapeHtml(text)}</div></div>`;
      document.body.appendChild(wrap); setTimeout(()=>wrap.remove(), 2500);
    }
  
    /* ===== KPI/로그 ===== */
    function renderQuota(){
      QUOTA = ensureTodayQuota();
      quotaDaily.textContent  = QUOTA.daily;
      quotaRemain.textContent = QUOTA.remain;
    }
    function recalcTodayStats(){
      const today = todayStr(); let s=0,f=0;
      LOGS.forEach(l=>{ if (l.date.startsWith(today)) { s+=l.success||0; f+=l.fail||0; } });
      todaySuccess.textContent = s; todayFail.textContent = f;
    }
    function renderLogTables(){
      const rows = [...LOGS].slice(-10).reverse().map(l=>`
        <tr>
          <td>${escapeHtml(fmtDT(l.date))}</td>
          <td>${l.count}명</td>
          <td>${escapeHtml(l.title||'')}</td>
          <td>${l.status==='scheduled'?'<span class="badge text-bg-info">예약</span>': l.fail>0?'<span class="badge text-bg-warning">부분실패</span>':'<span class="badge text-bg-success">성공</span>'}</td>
          <td>${l.success}</td>
          <td>${l.fail}</td>
        </tr>`).join('');
      logTableBody.innerHTML = rows || `<tr><td colspan="6" class="text-center text-muted py-3">로그가 없습니다.</td></tr>`;
  
      logsTbody.innerHTML = [...LOGS].reverse().map(l=>`
        <tr>
          <td>${escapeHtml(fmtDT(l.date))}</td>
          <td>${l.count}</td>
          <td>${escapeHtml(l.title||'')}</td>
          <td>${l.status==='scheduled'?'<span class="badge text-bg-info">예약</span>': l.fail>0?'<span class="badge text-bg-warning">부분실패</span>':'<span class="badge text-bg-success">성공</span>'}</td>
          <td>${l.success}/${l.fail}</td>
          <td>${l.reserveAt? escapeHtml(fmtDT(l.reserveAt)) : '-'}</td>
        </tr>`).join('') || `<tr><td colspan="6" class="text-center text-muted py-3">로그가 없습니다.</td></tr>`;
    }
  
    /* ===== Audience chips/filters ===== */
    function chipHtml(c){
      return `<span class="badge rounded-pill text-bg-light d-inline-flex align-items-center gap-1">
        ${escapeHtml(c.name)} <small class="text-muted">(${escapeHtml(c.phone)})</small>
        <button class="btn-close btn-close-white ms-1 remove-chip" data-id="${c.id}" title="제거"></button>
      </span>`;
    }
    function refreshAudienceChips(){
      const chosen = CONTACTS.filter(c=>state.selectedIds.has(c.id));
      audienceChips.innerHTML = chosen.length ? chosen.map(chipHtml).join('') : '<span class="text-muted">선택된 대상이 없습니다.</span>';
      selectedCount.textContent = chosen.length;
      $$('.remove-chip', audienceChips).forEach(b=> on(b,'click',()=>{ state.selectedIds.delete(b.dataset.id); refreshAudienceChips(); }));
    }
    on(btnClearAudience,'click', ()=>{ state.selectedIds.clear(); refreshAudienceChips(); });
    on(quickSearch,'input', ()=>{ state.audienceFilter.quick = quickSearch.value.trim().toLowerCase(); });
  
    on($('#segVIP'),'change', e=>{ state.audienceFilter.seg.VIP = e.target.checked; });
    on($('#segRecent'),'change', e=>{ state.audienceFilter.seg.RECENT = e.target.checked; });
    on($('#segDormant'),'change', e=>{ state.audienceFilter.seg.DORMANT = e.target.checked; });
    on($('#btnResetSeg'),'click', ()=>{
      ['segVIP','segRecent','segDormant'].forEach(id=>{ const el=$('#'+id); el.checked=true; });
      state.audienceFilter.seg = {VIP:true,RECENT:true,DORMANT:true};
    });
  
    /* ===== Audience modal ===== */
    // ⚠️ 여기서의 중복 선언을 제거했습니다 (audienceModal는 위에서 선언됨)
    function renderAudienceTable(){
      const q = state.modalFilter.q.toLowerCase(); const seg = state.modalFilter.seg;
      const rows = CONTACTS.filter(c=>{
        const matchQ = !q || (c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.tags||[]).join(',').toLowerCase().includes(q));
        const matchSeg = (seg==='all') || (c.segment===seg);
        return matchQ && matchSeg;
      }).map(c=>{
        const checked = state.selectedIds.has(c.id) ? 'checked' : '';
        return `<tr data-id="${c.id}">
          <td><input class="form-check-input aud-row" type="checkbox" ${checked}></td>
          <td><div class="fw-semibold">${escapeHtml(c.name)}</div><div class="text-muted small">${escapeHtml(c.phone)}</div></td>
          <td>${(c.tags||[]).map(t=>`<span class="badge text-bg-light me-1">${escapeHtml(t)}</span>`).join('')}</td>
          <td><span class="badge ${c.segment==='VIP'?'text-bg-warning':c.segment==='RECENT'?'text-bg-success':'text-bg-secondary'}">${c.segment}</span></td>
        </tr>`;
      }).join('');
      $('#audTbody').innerHTML = rows || `<tr><td colspan="4" class="text-center text-muted py-4">대상이 없습니다.</td></tr>`;
      $('#audSelCount').textContent = state.selectedIds.size;
      $$('.aud-row', $('#audTbody')).forEach(cb=>{
        on(cb,'change', (e)=>{
          const id = e.target.closest('tr')?.dataset.id;
          if (!id) return;
          if (e.target.checked) state.selectedIds.add(id); else state.selectedIds.delete(id);
          $('#audSelCount').textContent = state.selectedIds.size;
        });
      });
      const cbs = $$('.aud-row', $('#audTbody'));
      $('#audCheckAll').checked = cbs.length>0 && cbs.every(x=>x.checked);
    }
    on($('#audCheckAll'),'change', ()=>{
      $$('.aud-row', $('#audTbody')).forEach(cb=>{
        cb.checked = $('#audCheckAll').checked;
        const id = cb.closest('tr')?.dataset.id;
        if ($('#audCheckAll').checked) state.selectedIds.add(id); else state.selectedIds.delete(id);
      });
      $('#audSelCount').textContent = state.selectedIds.size;
    });
    on($('#audApply'),'click', ()=>{ audienceModal?.hide(); refreshAudienceChips(); });
    on(btnSelectAudience,'click', ()=>{ state.modalFilter = { q:'', seg:'all' }; $('#audSearch').value=''; renderAudienceTable(); audienceModal?.show(); });
    on($('#audSearch'),'input', ()=>{ state.modalFilter.q = $('#audSearch').value.trim(); renderAudienceTable(); });
    $$('.seg-btn').forEach(b=> on(b,'click', ()=>{ state.modalFilter.seg = b.dataset.seg; renderAudienceTable(); }));
  
    /* ===== Templates ===== */
    function renderTplGrid(){
      $('#tplGrid').innerHTML = `<div class="row g-3">
        ${TEMPLATES.map(t=>`
          <div class="col-12 col-md-6">
            <div class="card h-100">
              ${t.img? `<img src="${t.img}" class="card-img-top" alt="">`:''}
              <div class="card-body">
                <h6 class="card-title">${escapeHtml(t.title)}</h6>
                <pre class="small mb-2" style="white-space:pre-wrap">${escapeHtml(t.body)}</pre>
                ${t.btnText && t.btnUrl ? `<div class="small text-muted">버튼: ${escapeHtml(t.btnText)} → ${escapeHtml(t.btnUrl)}</div>`:''}
              </div>
              <div class="card-footer text-end">
                <button class="btn btn-sm btn-primary tpl-apply" data-id="${t.id}">적용</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>`;
      $$('.tpl-apply', $('#tplGrid')).forEach(btn=>{
        on(btn,'click', ()=>{
          const t = TEMPLATES.find(x=>x.id===btn.dataset.id);
          if (!t) return;
          $('#msgTitle').value = t.title||'';
          $('#msgBody').value  = t.body||'';
          $('#btnText').value  = t.btnText||'';
          $('#btnUrl').value   = t.btnUrl||'';
          $('#imgUrl').value   = t.img||'';
          tplModal?.hide();
          showPreview();
        });
      });
    }
    onAll(btnTemplate,'click', ()=>{ renderTplGrid(); tplModal?.show(); });
  
    /* ===== Preview ===== */
    function showPreview(){
      const t = msgTitle.value.trim();
      const b = msgBody.value;
      const img= imgUrl.value.trim();
      const bt = btnText.value.trim();
      const bu = btnUrl.value.trim();
  
      $('#pvTitle').textContent = t || '(제목 없음)';
      $('#pvBody').textContent  = b || '(내용 없음)';
      if (img) { $('#pvImg').src = img; $('#pvImg').classList.remove('d-none'); } else { $('#pvImg').classList.add('d-none'); }
      if (bt && bu) { $('#pvBtn').textContent = bt; $('#pvBtn').href = bu; $('#pvBtn').classList.remove('d-none'); } else { $('#pvBtn').classList.add('d-none'); }
  
      previewModal?.show();
    }
    on(btnPreview,'click', showPreview);
  
    /* ===== Logs ===== */
    on(btnOpenLogs,'click', ()=>{ renderLogTables(); logsModal?.show(); });
    on(btnRefreshLogs,'click', renderLogTables);
    on(btnClearLogs,'click', ()=>{
      if (!confirm('모든 로그를 삭제할까요?')) return;
      LOGS = []; set(storage.logs, LOGS); renderLogTables(); recalcTodayStats();
    });
  
    /* ===== Send (demo) ===== */
    function validateBeforeSend(){
      if (state.selectedIds.size===0) { alert('수신 대상을 선택하세요.'); return false; }
      if (!msgBody.value.trim()) { alert('메시지 내용을 입력하세요.'); return false; }
      return true;
    }
    function doSend({test=false}={}){
      if (!validateBeforeSend()) return;
  
      QUOTA = ensureTodayQuota();
      const targetIds = [...state.selectedIds];
      const count = test ? 1 : targetIds.length;
      if (QUOTA.remain < count) { alert(`잔여 쿼타 부족: ${QUOTA.remain}건`); return; }
  
      const reserve = reserveAt.value ? new Date(reserveAt.value).toISOString() : null;
      const title = msgTitle.value.trim();
      const body  = msgBody.value;
      const bt    = btnText.value.trim();
      const bu    = btnUrl.value.trim();
      const img   = imgUrl.value.trim();
      const dateNow = new Date().toISOString();
  
      const contacts = test ? [CONTACTS[0]] : CONTACTS.filter(c=>state.selectedIds.has(c.id));
      const rendered = contacts.map(c=>({
        to: c.phone,
        text: interpolate(body, c),
        title: interpolate(title, c),
        button: (bt&&bu) ? { text: interpolate(bt, c), url: bu } : null,
        image: img || null
      }));
  
      let success=0, fail=0, status='success';
      if (reserve) {
        status='scheduled';
      } else {
        success = rendered.length;
        QUOTA.remain -= success; set(storage.quota, QUOTA);
      }
  
      const log = { date: dateNow, title, count: rendered.length, success, fail, status, reserveAt: reserve };
      LOGS.push(log); set(storage.logs, LOGS);
  
      renderQuota(); recalcTodayStats(); renderLogTables();
      toast(reserve ? `예약 등록: ${rendered.length}명 (${fmtDT(reserve)})` : `${test?'테스트':''} 발송 성공: ${rendered.length}명`);
    }
    onAll(btnSendTest,'click', ()=> doSend({test:true}));
    on(btnSend,'click', ()=> doSend({test:false}));
  
    /* ===== Live preview sync ===== */
    ['input','change'].forEach(ev=>{
      [msgTitle,msgBody,btnText,btnUrl,imgUrl].forEach(el=> on(el,ev, ()=>{ if (previewModalEl?.classList.contains('show')) showPreview(); }));
    });
  
    /* ===== init ===== */
    function init(){
      renderQuota(); recalcTodayStats(); renderLogTables(); refreshAudienceChips();
    }
    init();
  
  })();
  
