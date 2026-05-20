/* /admin/assets/js/alimtalk.js
 * 알림톡 보내기 (데모) — /admin/member/alimtalk
 * localStorage로 연락처/템플릿/로그/쿼타 시뮬레이션
 */

(function(){
    const $  = (s,r=document)=>r.querySelector(s);
    const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
    const on = (el,ev,fn)=>el&&el.addEventListener(ev,fn);
    const onAll = (els,ev,fn)=>els.forEach(el=>on(el,ev,fn));
  
    const storage = {
      contacts: 'imw.member.alimtalk.contacts.v1',
      templates:'imw.member.alimtalk.tpl.v1',
      logs:     'imw.member.alimtalk.logs.v1',
      quota:    'imw.member.alimtalk.quota.v1'
    };
  
    // ===== Seed =====
    function seedContacts(){
      const demo = [];
      const seg = (i)=> i%5===0?'VIP' : i%3===0?'DORMANT' : 'RECENT';
      for (let i=1;i<=40;i++){
        demo.push({ id:'c'+i, name:`김알림${i}`, phone:`010-9${(1000+i).toString().slice(-4)}-${(2000+i).toString().slice(-4)}`, tags: i%2?['앱유저']:['웹'], segment: seg(i) });
      }
      localStorage.setItem(storage.contacts, JSON.stringify(demo));
      return demo;
    }
    function seedTemplates(){
      const demo = [
        { id:'t_welcome', code:'WELCOME_JOIN_001', title:'알림톡 도착', status:'approved',
          body:`안녕하세요. {{name}}님!
  ABC몰 회원가입을 환영합니다.
  
  ■ 아이디: {{user_id}}
  ■ 회원등급: {{membership}}
  
  앞으로도 많은 이용 부탁드립니다.`,
          btn1:{text:'채널 추가', url:'https://example.com/channel'},
          btn2:{text:'ABC몰 바로가기', url:'https://example.com'},
          img:'' },
        { id:'t_ship', code:'DELIVERY_INFO_001', title:'배송 안내', status:'approved',
          body:`{{name}}님, 주문 {{order_no}}가 발송되었습니다.
  택배사: 대한통운
  조회는 아래 버튼을 눌러 확인하세요.`,
          btn1:{text:'배송조회', url:'https://tracker.example.com/{{order_no}}'},
          btn2:null, img:'' },
        { id:'t_coupon', code:'COUPON_ISSUE_001', title:'쿠폰 도착', status:'pending',
          body:`{{name}}님, 전용 쿠폰이 발급되었어요 🎁
  - 쿠폰코드: {{coupon_code}}
  - 유효기간: {{coupon_expiry}}`,
          btn1:{text:'쿠폰 사용하기', url:'https://example.com/coupon'},
          btn2:null, img:'/admin/assets/img/sample-thumb.svg' }
      ];
      localStorage.setItem(storage.templates, JSON.stringify(demo));
      return demo;
    }
    const get = (k,d)=>{ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch(e){ return d; } };
    const set = (k,v)=> localStorage.setItem(k, JSON.stringify(v));
  
    let CONTACTS  = get(storage.contacts,null)  || seedContacts();
    let TEMPLATES = get(storage.templates,null) || seedTemplates();
    let LOGS      = get(storage.logs,[]);
    let QUOTA     = ensureQuota();
  
    function ensureQuota(){
      const today = new Date().toISOString().slice(0,10);
      let q = get(storage.quota,null);
      if (!q) { q = {date: today, daily: 100, remain: 100}; set(storage.quota,q); }
      if (q.date !== today) { q.date=today; q.remain=q.daily; set(storage.quota,q); }
      return q;
    }
  
    // ===== DOM
    const quotaRemain = $('#quotaRemain');
    const quotaDaily  = $('#quotaDaily');
    const todaySuccess= $('#todaySuccess');
    const todayFail   = $('#todayFail');
  
    const btnSelectAudience = $('#btnSelectAudience');
    const btnClearAudience  = $('#btnClearAudience');
    const audienceChips     = $('#audienceChips');
    const quickSearch       = $('#quickSearch');
    const selectedCount     = $('#selectedCount');
  
    const tplCode   = $('#tplCode');
    const tplStatus = $('#tplStatus');
    const sendType  = $('#sendType');
    const msgBody   = $('#msgBody');
    const btn1Text  = $('#btn1Text'); const btn1Url = $('#btn1Url');
    const btn2Text  = $('#btn2Text'); const btn2Url = $('#btn2Url');
    const imgUrl    = $('#imgUrl');   const reserveAt = $('#reserveAt');
  
    const btnTplGallery = $$('.js-tpl-gallery');
    const btnPreview    = $$('.js-preview');
    const btnSend       = $('#btnSend');
    const btnSendTest   = $('#btnSendTest');
    const btnOpenLogs   = $('#btnOpenLogs');
    const btnRefreshLogs= $('#btnRefreshLogs');
  
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
    const pvTitle = $('#pvTitle'); const pvBody = $('#pvBody');
    const pvImg   = $('#pvImg');   const pvBtn1 = $('#pvBtn1'); const pvBtn2 = $('#pvBtn2');
  
    const logsModalEl = $('#logsModal');
    const logsModal = logsModalEl ? new bootstrap.Modal(logsModalEl) : null;
    const logsTbody = $('#logsTbody');
    const logTableBody = $('#logTable tbody');
    const btnClearLogs = $('#btnClearLogs');
  
    // ===== State
    const state = {
      selectedIds: new Set(),
      audienceFilter: { quick:'', seg:{VIP:true,RECENT:true,DORMANT:true} },
      modalFilter: { q:'', seg:'all' }
    };
  
    // ===== Utils
    const fmtDT = (iso)=> iso ? new Date(iso).toLocaleString('ko-KR') : '-';
    const todayStr = ()=> new Date().toISOString().slice(0,10);
    function escapeHtml(s){ return (s??'').toString().replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[m])); }
    function interpolate(tpl, c){
      const map = {
        name:c.name, phone:c.phone, user_id:(c.user_id||('user'+c.id)), membership:(c.segment||'일반'),
        order_no:'A'+String(100000+c.id).slice(-6), delivery_track_url:'https://tracker.example.com/',
        coupon_code:'WELCOME-5000', coupon_expiry:'2025-12-31'
      };
      return (tpl||'').replace(/\{\{(\w+)\}\}/g, (_,k)=> map[k] ?? '');
    }
    function toast(text){
      const wrap = document.createElement('div');
      wrap.className='position-fixed bottom-0 end-0 p-3'; wrap.style.zIndex=1080;
      wrap.innerHTML=`<div class="toast show"><div class="toast-header"><strong class="me-auto">안내</strong></div><div class="toast-body">${escapeHtml(text)}</div></div>`;
      document.body.appendChild(wrap); setTimeout(()=>wrap.remove(), 2500);
    }
  
    // ===== KPI/로그
    function renderQuota(){ QUOTA=ensureQuota(); quotaDaily.textContent=QUOTA.daily; quotaRemain.textContent=QUOTA.remain; }
    function recalcTodayStats(){
      const t=todayStr(); let s=0,f=0;
      LOGS.forEach(l=>{ if(l.date.startsWith(t)){ s+=l.success||0; f+=l.fail||0; } });
      todaySuccess.textContent=s; todayFail.textContent=f;
    }
    function renderLogTables(){
      const rows=[...LOGS].slice(-10).reverse().map(l=>`
        <tr>
          <td>${escapeHtml(fmtDT(l.date))}</td>
          <td>${l.count}명</td>
          <td>${escapeHtml(l.code||'')}</td>
          <td>${l.status==='scheduled'?'<span class="badge text-bg-info">예약</span>': l.fail>0?'<span class="badge text-bg-warning">부분실패</span>':'<span class="badge text-bg-success">성공</span>'}</td>
          <td>${l.success}</td>
          <td>${l.fail}</td>
        </tr>`).join('');
      logTableBody.innerHTML = rows || `<tr><td colspan="6" class="text-center text-muted py-3">로그가 없습니다.</td></tr>`;
  
      logsTbody.innerHTML = [...LOGS].reverse().map(l=>`
        <tr>
          <td>${escapeHtml(fmtDT(l.date))}</td>
          <td>${l.count}</td>
          <td>${escapeHtml(l.code||'')}</td>
          <td>${l.status==='scheduled'?'<span class="badge text-bg-info">예약</span>': l.fail>0?'<span class="badge text-bg-warning">부분실패</span>':'<span class="badge text-bg-success">성공</span>'}</td>
          <td>${l.success}/${l.fail}</td>
          <td>${l.reserveAt? escapeHtml(fmtDT(l.reserveAt)) : '-'}</td>
        </tr>`).join('') || `<tr><td colspan="6" class="text-center text-muted py-3">로그가 없습니다.</td></tr>`;
    }
  
    // ===== Audience chips/filters
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
  
    // ===== Audience modal
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
      audTbody.innerHTML = rows || `<tr><td colspan="4" class="text-center text-muted py-4">대상이 없습니다.</td></tr>`;
      audSelCount.textContent = state.selectedIds.size;
      $$('.aud-row', audTbody).forEach(cb=>{
        on(cb,'change', (e)=>{
          const id = e.target.closest('tr')?.dataset.id;
          if (!id) return;
          if (e.target.checked) state.selectedIds.add(id); else state.selectedIds.delete(id);
          audSelCount.textContent = state.selectedIds.size;
        });
      });
      const cbs = $$('.aud-row', audTbody);
      audCheckAll.checked = cbs.length>0 && cbs.every(x=>x.checked);
    }
    on(audCheckAll,'change', ()=>{
      $$('.aud-row', audTbody).forEach(cb=>{
        cb.checked = audCheckAll.checked;
        const id = cb.closest('tr')?.dataset.id;
        if (audCheckAll.checked) state.selectedIds.add(id); else state.selectedIds.delete(id);
      });
      audSelCount.textContent = state.selectedIds.size;
    });
    on(audApply,'click', ()=>{ audienceModal?.hide(); refreshAudienceChips(); });
    on(btnSelectAudience,'click', ()=>{ state.modalFilter = { q:'', seg:'all' }; audSearch.value=''; renderAudienceTable(); audienceModal?.show(); });
    on(audSearch,'input', ()=>{ state.modalFilter.q = audSearch.value.trim(); renderAudienceTable(); });
    $$('.seg-btn').forEach(b=> on(b,'click', ()=>{ state.modalFilter.seg = b.dataset.seg; renderAudienceTable(); }));
  
    // ===== Template gallery
    function renderTplGrid(){
      tplGrid.innerHTML = `<div class="row g-3">
        ${TEMPLATES.map(t=>`
          <div class="col-12 col-md-6">
            <div class="card h-100">
              ${t.img? `<img src="${t.img}" class="card-img-top" alt="">`:''}
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <h6 class="card-title mb-0">${escapeHtml(t.code)}</h6>
                  <span class="badge ${t.status==='approved'?'text-bg-success':t.status==='pending'?'text-bg-secondary':'text-bg-danger'}">${t.status}</span>
                </div>
                <div class="small text-muted">${escapeHtml(t.title||'')}</div>
                <pre class="small mt-2" style="white-space:pre-wrap">${escapeHtml(t.body)}</pre>
                ${t.btn1? `<div class="small text-muted">버튼1: ${escapeHtml(t.btn1.text)} → ${escapeHtml(t.btn1.url)}</div>`:''}
                ${t.btn2? `<div class="small text-muted">버튼2: ${escapeHtml(t.btn2.text)} → ${escapeHtml(t.btn2.url)}</div>`:''}
              </div>
              <div class="card-footer text-end">
                <button class="btn btn-sm btn-primary tpl-apply" data-id="${t.id}">적용</button>
              </div>
            </div>
          </div>`).join('')}
      </div>`;
      $$('.tpl-apply', tplGrid).forEach(btn=>{
        on(btn,'click', ()=>{
          const t = TEMPLATES.find(x=>x.id===btn.dataset.id);
          if (!t) return;
          tplCode.value   = t.code||'';
          tplStatus.value = t.status||'approved';
          msgBody.value   = t.body||'';
          btn1Text.value  = t.btn1?.text || '';
          btn1Url.value   = t.btn1?.url  || '';
          btn2Text.value  = t.btn2?.text || '';
          btn2Url.value   = t.btn2?.url  || '';
          imgUrl.value    = t.img || '';
          tplModal?.hide();
          showPreview(t.title||'알림톡 도착');
        });
      });
    }
    onAll(btnTplGallery,'click', ()=>{ renderTplGrid(); tplModal?.show(); });
  
    // ===== Preview
    function showPreview(title='알림톡 도착'){
      pvTitle.textContent = title;
      pvBody.textContent  = msgBody.value || '';
      const img = imgUrl.value.trim();
      if (img) { pvImg.src = img; pvImg.classList.remove('d-none'); } else { pvImg.classList.add('d-none'); }
      const b1t = btn1Text.value.trim(), b1u = btn1Url.value.trim();
      const b2t = btn2Text.value.trim(), b2u = btn2Url.value.trim();
      if (b1t && b1u) { pvBtn1.textContent=b1t; pvBtn1.href=b1u; pvBtn1.classList.remove('d-none'); } else { pvBtn1.classList.add('d-none'); }
      if (b2t && b2u) { pvBtn2.textContent=b2t; pvBtn2.href=b2u; pvBtn2.classList.remove('d-none'); } else { pvBtn2.classList.add('d-none'); }
      previewModal?.show();
    }
    onAll(btnPreview,'click', ()=>showPreview());
  
    // ===== Logs
    on(btnOpenLogs,'click', ()=>{ renderLogTables(); logsModal?.show(); });
    on(btnRefreshLogs,'click', renderLogTables);
    on(btnClearLogs,'click', ()=>{
      if (!confirm('모든 로그를 삭제할까요?')) return;
      LOGS=[]; set(storage.logs, LOGS); renderLogTables(); recalcTodayStats();
    });
  
    // ===== Send (demo)
    function validateBeforeSend(){
      if (state.selectedIds.size===0) { alert('수신 대상을 선택하세요.'); return false; }
      if (!tplCode.value.trim()) { alert('템플릿 코드를 입력하세요.'); return false; }
      if (!msgBody.value.trim()) { alert('메시지 본문을 입력하세요.'); return false; }
      if (tplStatus.value!=='approved') { if (!confirm('템플릿 상태가 승인 아님(데모). 계속할까요?')) return false; }
      return true;
    }
    function doSend({test=false}={}){
      if (!validateBeforeSend()) return;
      QUOTA = ensureQuota();
      const targetIds = [...state.selectedIds];
      const count = test ? 1 : targetIds.length;
      if (QUOTA.remain < count) { alert(`잔여 쿼타 부족: ${QUOTA.remain}건`); return; }
  
      const reserve = reserveAt.value ? new Date(reserveAt.value).toISOString() : null;
      const code = tplCode.value.trim();
      const body = msgBody.value;
      const b1t = btn1Text.value.trim(), b1u = btn1Url.value.trim();
      const b2t = btn2Text.value.trim(), b2u = btn2Url.value.trim();
      const img = imgUrl.value.trim();
      const dateNow = new Date().toISOString();
  
      const contacts = test ? [CONTACTS[0]] : CONTACTS.filter(c=>state.selectedIds.has(c.id));
      // 치환(미리보기와 동일하게)
      const rendered = contacts.map(c=>({
        to: c.phone,
        text: interpolate(body, c),
        buttons: [
          ...(b1t&&b1u ? [{text: interpolate(b1t,c), url: b1u}] : []),
          ...(b2t&&b2u ? [{text: interpolate(b2t,c), url: b2u}] : []),
        ],
        image: img || null,
        code
      }));
  
      let success=0, fail=0, status='success';
      if (reserve) status='scheduled';
      else { success = rendered.length; QUOTA.remain -= success; set(storage.quota, QUOTA); }
  
      const log = { date: dateNow, code, count: rendered.length, success, fail, status, reserveAt: reserve, sendType: sendType.value };
      LOGS.push(log); set(storage.logs, LOGS);
  
      renderQuota(); recalcTodayStats(); renderLogTables();
      toast(reserve ? `예약 등록: ${rendered.length}명 (${fmtDT(reserve)})` : `${test?'테스트':''} 발송 성공: ${rendered.length}명`);
    }
    on(btnSendTest,'click', ()=> doSend({test:true}));
    on(btnSend,'click', ()=> doSend({test:false}));
  
    // Live preview sync
    ['input','change'].forEach(ev=>{
      [msgBody,btn1Text,btn1Url,btn2Text,btn2Url,imgUrl].forEach(el=> on(el,ev, ()=>{ if (previewModalEl?.classList.contains('show')) showPreview(); }));
    });
  
    // ===== init
    function init(){ renderQuota(); recalcTodayStats(); renderLogTables(); refreshAudienceChips(); }
    init();
  })();
  
