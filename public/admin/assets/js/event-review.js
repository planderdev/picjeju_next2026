/* /admin/assets/js/event-review.js */
(() => {
    'use strict';
  
    // ---------- helpers ----------
    const $  = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const KEY_E = 'ADMIN_EVENTS';
    const KEY_R = 'ADMIN_EVENT_REVIEWS';
  
    const load = (k, d=[]) => { try { const raw = localStorage.getItem(k); if (raw) return JSON.parse(raw); } catch(e){} return d; };
    const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
    const escapeHtml = (s) => (s||'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  
    // ---------- seed (데모 데이터) ----------
    (function seedIfEmpty(){
      if (!localStorage.getItem(KEY_E)) {
        const t=new Date(), y=t.getFullYear(), m=String(t.getMonth()+1).padStart(2,'0');
        const ev = [
          { id: crypto.randomUUID(), title:'제주 재즈 나이트', venue:'제주아트센터', start:`${y}-${m}-05`, end:`${y}-${m}-05`, category:'공연', visible:true, tags:['제주','재즈'] },
          { id: crypto.randomUUID(), title:'돌문화공원 사진전', venue:'돌문화공원', start:`${y}-${m}-01`, end:`${y}-${m}-20`, category:'전시', visible:true, tags:['전시','가족'] },
        ];
        save(KEY_E, ev);
      }
      if (!localStorage.getItem(KEY_R)) {
        const ev = load(KEY_E);
        const rv = [
          { id: crypto.randomUUID(), eventId: ev[0]?.id || 'e1', date: new Date().toISOString().slice(0,10), rating: 5, body:'최고였어요! 라이브 연주가 짱.', visible:true },
          { id: crypto.randomUUID(), eventId: ev[1]?.id || 'e2', date: new Date(Date.now()-86400000).toISOString().slice(0,10), rating: 3, body:'전시는 좋은데 동선이 아쉬움.', visible:true },
        ];
        save(KEY_R, rv);
      }
    })();
  
    // ---------- elements ----------
    const elTbody   = $('#rvTable tbody');
    const elCount   = $('#rvCount');             // 헤더 숫자만 갱신
    const elCheckAll= $('#rvCheckAll');
    const elSelEvent= $('#rvEventSelect');
    const elRating  = $('#rvFilterRating');
    const elSort    = $('#rvSort');
  
    if (!elTbody || !elSelEvent) return; // 페이지가 아니면 종료
  
    // ---------- data & state ----------
    const events = load(KEY_E);
    const rv     = load(KEY_R);
    const state  = { filtered: [], selected: new Set() };
  
    // 이벤트 셀렉트 옵션 채우기
    elSelEvent.innerHTML =
      `<option value="">전체</option>` +
      events.map(e => `<option value="${e.id}">${escapeHtml(e.title)}</option>`).join('');
  
    // ---------- core ----------
    function apply() {
      const evId  = elSelEvent?.value || '';
      const min   = Number(elRating?.value || 0);     // 5,4,3,2 or 0
      const sort  = elSort?.value || '-date';
  
      let arr = rv.slice();
      if (evId) arr = arr.filter(x => x.eventId === evId);
      if (min)  arr = arr.filter(x => (x.rating || 0) >= min);
  
      arr.sort((a,b) => {
        if (sort === '-date')   return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
        if (sort === 'date')    return a.date > b.date ? 1 : a.date < b.date ? -1 : 0;
        if (sort === '-rating') return (a.rating||0) < (b.rating||0) ? 1 : -1;
        return 0;
      });
  
      state.filtered = arr;
      render();
    }
  
    function render() {
      elTbody.innerHTML = '';
      state.selected.clear();
      if (elCheckAll) elCheckAll.checked = false;
      updateBulkButtons();
  
      for (const it of state.filtered) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><input class="form-check-input row-check" type="checkbox" data-id="${it.id}"></td>
          <td><span class="badge text-bg-light">${it.date}</span></td>
          <td>
            <div class="text-truncate" style="max-width:640px">${escapeHtml(it.body || '')}</div>
            <div class="text-muted small">${titleOf(it.eventId)}</div>
          </td>
          <td>${'★'.repeat(it.rating || 0)}</td>
          <td>
            <div class="form-check form-switch">
              <input class="form-check-input toggle-visible" type="checkbox" data-id="${it.id}" ${it.visible ? 'checked' : ''}>
            </div>
          </td>
          <td>
            <div class="btn-group">
              <button class="btn btn-sm btn-outline-secondary edit" data-id="${it.id}"><i class="ri-edit-2-line"></i></button>
              <button class="btn btn-sm btn-outline-danger del" data-id="${it.id}"><i class="ri-delete-bin-6-line"></i></button>
            </div>
          </td>`;
        elTbody.appendChild(tr);
      }
      if (elCount) elCount.textContent = String(state.filtered.length); // 숫자만
    }
  
    function titleOf(id) {
      const e = events.find(x => x.id === id);
      return e ? e.title : '(삭제됨)';
    }
  
    function updateBulkButtons() {
      const has = state.selected.size > 0;
      ['rvBulkDelete','rvBulkVisible','rvBulkHidden'].forEach(id=>{
        const el = document.getElementById(id);
        if (el) el.disabled = !has;
      });
    }
  
    // ---------- listeners ----------
    // 필터 셀렉트: change + input 모두
    [elSelEvent, elRating, elSort].forEach(el => {
      el?.addEventListener('change', apply);
      el?.addEventListener('input', apply);
    });
  
    document.addEventListener('change', (e) => {
      const t = e.target;
  
      if (t === elCheckAll) {
        $$('.row-check', elTbody).forEach(i => {
          i.checked = elCheckAll.checked;
          i.dispatchEvent(new Event('change'));
        });
        return;
      }
  
      if (t.classList?.contains('row-check')) {
        const id = t.dataset.id;
        if (t.checked) state.selected.add(id); else state.selected.delete(id);
        updateBulkButtons();
        return;
      }
  
      if (t.classList?.contains('toggle-visible')) {
        const item = rv.find(x => x.id === t.dataset.id);
        if (!item) return;
        item.visible = !!t.checked;
        save(KEY_R, rv);
      }
    });
  
    document.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
  
      if (b.classList.contains('del')) {
        const id = b.dataset.id;
        const i  = rv.findIndex(x => x.id === id);
        if (i < 0) return;
        if (confirm('삭제하시겠습니까?')) {
          rv.splice(i, 1);
          save(KEY_R, rv);
          apply();
        }
        return;
      }
  
      if (b.classList.contains('edit')) {
        const id = b.dataset.id;
        const it = rv.find(x => x.id === id);
        if (!it) return;
        openModal(it);
        return;
      }
  
      if (b.id === 'rvBulkDelete' && state.selected.size) {
        if (confirm('선택 삭제?')) {
          for (const id of state.selected) {
            const i = rv.findIndex(x => x.id === id);
            if (i >= 0) rv.splice(i, 1);
          }
          save(KEY_R, rv);
          apply();
        }
        return;
      }
  
      if (b.id === 'rvBulkVisible' && state.selected.size) {
        rv.forEach(x => { if (state.selected.has(x.id)) x.visible = true; });
        save(KEY_R, rv); apply(); return;
      }
      if (b.id === 'rvBulkHidden' && state.selected.size) {
        rv.forEach(x => { if (state.selected.has(x.id)) x.visible = false; });
        save(KEY_R, rv); apply(); return;
      }
  
      if (b.id === 'rvSave') saveModal();
    });
  
    // ---------- modal ----------
    let modal, currentId = null;
    try { modal = new bootstrap.Modal($('#rvModal')); } catch (e) {}
    function openModal(it) {
      currentId = it?.id || null;
      $('#rvDate').value    = it?.date   || new Date().toISOString().slice(0,10);
      $('#rvRating').value  = it?.rating || 5;
      $('#rvBody').value    = it?.body   || '';
      $('#rvVisible').checked = it ? !!it.visible : true;
      modal?.show();
    }
    function saveModal() {
      const dto = {
        id: currentId || crypto.randomUUID(),
        eventId: elSelEvent.value || (events[0]?.id || ''),
        date: $('#rvDate').value,
        rating: Number($('#rvRating').value || 5) || 5,
        body: ($('#rvBody').value || '').trim(),
        visible: !!$('#rvVisible').checked
      };
      const i = rv.findIndex(x => x.id === dto.id);
      if (i >= 0) rv[i] = dto; else rv.push(dto);
      save(KEY_R, rv);
      modal?.hide();
      apply();
    }
  
    // ---------- init ----------
    apply();
  })();
  