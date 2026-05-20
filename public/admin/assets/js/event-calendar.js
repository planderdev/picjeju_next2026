/* /admin/assets/js/event-calendar.js */
(() => {
    'use strict';
  
    // ---------- helpers ----------
    const $  = (s, r=document) => r.querySelector(s);
    const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  
    const KEY = 'ADMIN_EVENTS';
    const load = () => { try{ const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); }catch(e){} return []; };
    const save = (arr) => localStorage.setItem(KEY, JSON.stringify(arr));
  
    const escapeHtml = (s) =>
      (s||'').replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
    const adminUrl = (path) => {
      const base = (window.ADMIN_BASE_PATH || '/picjeju/admin').replace(/\/$/,'');
      return base + '/' + String(path||'').replace(/^\//,'');
    };
  
    const toYMD = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth()+1).padStart(2,'0');
      const day = String(d.getDate()).padStart(2,'0');
      return `${y}-${m}-${day}`;
    };
    const daysInMonth = (y,m) => new Date(y, m+1, 0).getDate();
    const wd = (y,m,d) => new Date(y,m,d).getDay();
  
    // ---------- elements ----------
    const elRange   = $('#calRange');     // ← 새 range input
    const elGrid    = $('#calGrid');
    const elListCard= $('#calListCard');
    const elList    = $('#calList');
    const elTitle   = $('#calListTitle');
    const elCat     = $('#calCat');
  
    if (!elRange || !elGrid) return; // 이 페이지가 아니면 종료
  
    // ---------- seed (데모) ----------
    (function seedIfEmpty(){
      if (!localStorage.getItem(KEY)) {
        const now=new Date(), y=now.getFullYear(), m=String(now.getMonth()+1).padStart(2,'0');
        const seed = [
          { id: crypto.randomUUID(), title:'제주 재즈 나이트',  venue:'제주아트센터', start:`${y}-${m}-05`, end:`${y}-${m}-05`, category:'공연', visible:true, tags:['제주','재즈'] },
          { id: crypto.randomUUID(), title:'돌문화공원 사진전', venue:'돌문화공원',   start:`${y}-${m}-01`, end:`${y}-${m}-20`, category:'전시', visible:true, tags:['전시','가족'] },
          { id: crypto.randomUUID(), title:'해변 버스킹 페스티벌', venue:'이호테우',   start:`${y}-${m}-15`, end:`${y}-${m}-16`, category:'공연', visible:true, tags:['야외','무료'] },
        ];
        save(seed);
      }
    })();
  
    const events = load();
  
    // ---------- range picker ----------
    const today = new Date();
    const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const defaultEnd   = new Date(today.getFullYear(), today.getMonth()+1, 0);
  
    let fp = flatpickr(elRange, {
      locale: flatpickr.l10ns?.ko || 'ko',
      mode: 'range',
      inline: false,
      allowInput: true,
      dateFormat: 'Y-m-d',
      defaultDate: [defaultStart, defaultEnd],
      onChange() { render(); }
    });
  
    function currentRange(){
      const sel = fp.selectedDates || [];
      if (!sel.length) return [toYMD(today), toYMD(today), today];
      const a = sel[0], b = sel[1] || sel[0];
      const s = toYMD(a), e = toYMD(b);
      // 첫 날짜가 기준 월
      const base = (a <= b ? a : b);
      return (s <= e) ? [s,e,base] : [e,s,base];
    }
  
    // ---------- renderers ----------
    function render(){
      const [sStr, eStr, base] = currentRange();
      const y = base.getFullYear();
      const m = base.getMonth() + 1;
      const dim = daysInMonth(y, m-1);
      const firstDow = wd(y, m-1, 1);
  
      elGrid.innerHTML = '';
  
      // 앞쪽 빈칸
      for (let i=0;i<firstDow;i++){
        const ph = document.createElement('div');
        ph.className = 'day-cell p-2 bg-light-subtle border rounded';
        ph.style.minHeight = '90px';
        elGrid.appendChild(ph);
      }
  
      // 날짜 셀
      for (let d=1; d<=dim; d++){
        const date = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const list = events.filter(e => e.start <= date && e.end >= date);
  
        const cell = document.createElement('div');
        cell.className = 'day-cell p-1 border rounded';
        cell.style.minHeight = '90px';
        if (date < sStr || date > eStr) cell.classList.add('opacity-50'); // 범위 밖은 연하게
  
        cell.innerHTML = `
          <div class="d-flex justify-content-between align-items-center small mb-1">
            <strong>${d}</strong>
            ${list.length ? `<span class="badge text-bg-primary">${list.length}</span>` : ''}
          </div>
          <div class="d-flex flex-column gap-1">
            ${list.slice(0,3).map(it =>
              `<span class="badge text-bg-light text-truncate w-100" title="${escapeHtml(it.title)}">${escapeHtml(it.title)}</span>`
            ).join('')}
            ${list.length>3 ? `<span class="small text-muted">외 ${list.length-3}건…</span>` : ''}
          </div>
        `;
        cell.addEventListener('click', () => openDay(date, list));
        elGrid.appendChild(cell);
      }
    }
  
    function openDay(date, list){
      elListCard.classList.remove('d-none');
      elTitle.textContent = `${date} 일정`;
      elList.innerHTML = list.map(it=>`
        <div class="list-group-item">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <div class="fw-semibold">${escapeHtml(it.title)}</div>
              <div class="text-muted small">${it.start} ~ ${it.end} · ${escapeHtml(it.venue||'-')}</div>
            </div>
            <div class="btn-group">
              <a class="btn btn-sm btn-outline-secondary" href="${adminUrl('event/add')}?id=${it.id}">
                <i class="ri-edit-2-line"></i> 수정
              </a>
            </div>
          </div>
        </div>
      `).join('') || '<div class="list-group-item text-muted">이 날의 일정이 없습니다.</div>';
  
      const card = document.querySelector('#calCard');
      if (card) window.scrollTo({ top: card.offsetTop, behavior:'smooth' });
    }
  
    // ---------- UI events ----------
    $('#calToday')?.addEventListener('click', () => {
      const t = new Date();
      fp.setDate([t, t], true); // 오늘 하루로 범위 설정
    });
    elCat?.addEventListener('input', () => { render(); }); // 카테고리 입력 시 재랜더
  
    // ---------- first paint ----------
    render();
  })();
  