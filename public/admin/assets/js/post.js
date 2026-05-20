// /admin/assets/js/post.js — 포스트 관리 (상태 탭 + 카테고리 셀렉트 + 고급검색)
(() => {
    "use strict";
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const qs = new URLSearchParams(location.search);

    const show = (el, on) => el && el.classList.toggle('d-none', !on);
    const setTxt = (el, t) => el && (el.textContent = t);
    const withBS = (cb) => { if (window.bootstrap) return cb(); window.addEventListener('load', () => window.bootstrap && cb(), { once: true }); };

    // ===== 상태/라벨/뱃지 =====
    const STAT = ['ALL', 'PUBLISHED', 'DRAFT', 'SCHEDULED', 'HIDDEN', 'DELETED'];
    const SLAB = { 
        ALL: '전체',
        PUBLISHED: '발행',
        DRAFT: '임시저장',
        SCHEDULED: '예약',
        HIDDEN: '숨김',
        DELETED: '삭제'
    };
    const SBAD = {
        PUBLISHED: 'text-bg-info',
        DRAFT: 'text-bg-warning',
        SCHEDULED: 'text-bg-primary',
        HIDDEN: 'text-bg-secondary',
        DELETED: 'text-bg-danger'
    };
    const CATS = ['전체', '제주살이 꿀팁', '픽제주 친구들', '이벤트'];

    // ===== 엘리먼트 =====
    const el = {
        tabs: $('#postTabs'),           // 상태 탭
        catSel: $('#postCatSel'),         // ← NEW: 카테고리 셀렉트

        tbody: $('#tbodyPost'),
        empty: $('#emptyList'),
        loader: $('#loader'),
        selCount: $('#selCount'),
        checkAll: $('#checkAll'),
        pgPrev: $('#pgPrev'), pgNext: $('#pgNext'), pgNow: $('#pgNow'), pgTotal: $('#pgTotal'),

        btnSearch: $('#btnSearch'), keyword: $('#keyword'),
        btnHelp: $('#btnHelp'),

        // 정렬
        sortLabel: $('#sortLabel'),

        // 모달/작성
        btnNew: $('#btnNewPost'),
        mdWrite: $('#mdPostWrite'),
        wTitle: $('#wTitle'), wCat: $('#wCat'), wStatus: $('#wStatus'),
        editorHost: $('#postEditor'),
        editorFallback: $('#postEditorFallback'),
        btnWriteSave: $('#btnWriteSave'),

        // 상세/빠른수정
        mdDetail: $('#mdPostDetail'), detailBody: $('#postDetailBody'),
        mdQuick: $('#mdPostQuick'), qTitle: $('#qTitle'), qCat: $('#qCat'),
        qStatus: $('#qStatus'), qScheduleBox: $('#qScheduleBox'),
        qDate: $('#qDate'), qTime: $('#qTime'),
        formQuick: $('#formPostQuick'),

        // === 고급 검색 ===
        btnAdvanced: $('#btnAdvanced'),
        mdAdvanced: $('#mdAdvanced'),
        formAdvanced: $('#formAdvanced'),
        advFrom: $('#advFrom'),
        advTo: $('#advTo'),
        advStatus: $('#advStatus'),   // 상태 체크박스 컨테이너
        advCat: $('#advCat'),      // 카테고리 셀렉트
        advMemo: $('#advMemo'),     // 작성자/키워드
    };

    // ===== 데모 데이터 =====
    const DEMO = (() => {
        const arr = []; let id = 975;
        for (let i = 0; i < 37; i++) {
            const cat = CATS[Math.floor(Math.random() * (CATS.length - 1)) + 1];
            const st = STAT[i % STAT.length];
            arr.push({
                id: id--,
                thumb: `/admin/assets/img/sample-thumb.svg`,
                title: `포스트 제목 ${i + 1}`,
                category: cat,
                author: (i % 2 ? '에디A' : '운영자'),
                status: st,
                views: 700 - i, comments: 9 - (i % 10), likes: (i * 3) % 20,
                created: `2025-09-${String((i % 9) + 1).padStart(2, '0')} ${String(9 + (i % 10)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
                updated: `2025-09-${String((i % 9) + 1).padStart(2, '0')} ${String(10 + (i % 10)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
                content: `<p>데모 본문 ${i + 1}</p>`
            });
        }
        return arr;
    })();

    // ===== 상태 =====
    const state = {
        all: DEMO,
        cat: qs.get('cat') || '전체',
        status: qs.get('status') || 'ALL',
        sort: qs.get('sort') || 'recent',
        page: 1, pageSize: 10,
        keyword: '',
        selected: new Set(),
        filtered: [],
        // === 고급 검색 상태 ===
        adv: { from: '', to: '', statuses: new Set(), cat: '', memo: '' }
    };

    // ===== 탭 렌더(상태) =====
    function renderTabs() {
        const sc = Object.fromEntries(STAT.map(s => [s, 0]));
        state.all.forEach(o => sc[o.status] = (sc[o.status] || 0) + 1);
        sc.ALL = state.all.length; // 전체 카운트
    
        el.tabs.innerHTML = STAT.map(s => `
          <li class="nav-item flex-shrink-0">
            <button class="nav-link ${state.status === s ? 'active' : ''}" data-status="${s}">
              ${SLAB[s]} <span class="badge text-bg-primary align-middle ms-1">${sc[s] || 0}</span>
            </button>
          </li>`).join('');
    }
    // ===== 카테고리 셀렉트 =====
    function buildCatSelect() {
        if (!el.catSel) return;
        const cc = Object.fromEntries(CATS.map(c => [c, 0]));
        state.all.forEach(o => { cc[o.category] = (cc[o.category] || 0) + 1; cc['전체']++; });
        el.catSel.innerHTML = CATS.map(c =>
            `<option value="${c}" ${state.cat === c ? 'selected' : ''}>${c} (${cc[c] || 0})</option>`
        ).join('');
    }
    function bindCatSelect() {
        el.catSel?.addEventListener('change', () => {
            state.cat = el.catSel.value || '전체';
            state.page = 1;
            apply(); paint();
            const u = new URL(location.href); u.searchParams.set('cat', state.cat); history.replaceState(null, '', u);
        });
    }

    // 상태 탭 이벤트
    el.tabs.addEventListener('click', (e) => {
        const b = e.target.closest('[data-status]'); if (!b) return;
        state.status = b.dataset.status; state.page = 1; apply(); paint();
        const u = new URL(location.href); u.searchParams.set('status', state.status); history.replaceState(null, '', u);
        $$('#postTabs .nav-link').forEach(x => x.classList.toggle('active', x === b));
    });

    // ===== 공통 유틸 =====
    const toTime = (s) => {
        if (!s) return NaN;
        const iso = s.includes('T') ? s : s.replace(' ', 'T');
        const d = new Date(iso);
        return d.getTime();
    };

    // ===== 고급검색: 모달 열기/적용/필터 =====
    const ADV_STATUS = STAT.map(id => ({ id, label: SLAB[id] }));

    function openAdvancedModal() {
        // 상태 체크박스 동적 구성
        if (el.advStatus) {
            el.advStatus.innerHTML = ADV_STATUS.map(s => `
          <label class="form-check form-check-inline">
            <input class="form-check-input adv-status" type="checkbox" value="${s.id}">
            <span class="form-check-label">${s.label}</span>
          </label>
        `).join('');
            el.advStatus.querySelectorAll('.adv-status').forEach(chk => {
                chk.checked = state.adv.statuses.has(chk.value);
            });
        }
        // 카테고리 select (전체 제외)
        if (el.advCat) {
            el.advCat.innerHTML = `<option value="">전체</option>` + CATS.slice(1).map(c => `<option value="${c}">${c}</option>`).join('');
            el.advCat.value = state.adv.cat || '';
        }
        if (el.advFrom) el.advFrom.value = state.adv.from || '';
        if (el.advTo) el.advTo.value = state.adv.to || '';
        if (el.advMemo) el.advMemo.value = state.adv.memo || '';

        withBS(() => bootstrap.Modal.getOrCreateInstance(el.mdAdvanced).show());
    }

    el.btnAdvanced?.addEventListener('click', (e) => {
        e.preventDefault(); openAdvancedModal();
    });

    el.formAdvanced?.addEventListener('submit', (e) => {
        e.preventDefault();
        state.adv.from = (el.advFrom?.value || '').trim();
        state.adv.to = (el.advTo?.value || '').trim();

        const set = new Set();
        el.mdAdvanced?.querySelectorAll('.adv-status')?.forEach(chk => { if (chk.checked) set.add(chk.value); });
        state.adv.statuses = set;

        state.adv.cat = (el.advCat?.value || '').trim();
        state.adv.memo = (el.advMemo?.value || '').trim();

        state.page = 1;
        apply(); paint();
        withBS(() => bootstrap.Modal.getOrCreateInstance(el.mdAdvanced).hide());
    });

    function matchAdvanced(o) {
        const a = state.adv || {};
        if (a.from) {
            const from = new Date(a.from + 'T00:00:00').getTime();
            if (toTime(o.created) < from) return false;
        }
        if (a.to) {
            const to = new Date(a.to + 'T23:59:59').getTime();
            if (toTime(o.created) > to) return false;
        }
        if (a.statuses && a.statuses.size > 0 && !a.statuses.has(o.status)) return false;
        if (a.cat && o.category !== a.cat) return false;
        if (a.memo) {
            const hay = `${o.title} ${o.author} ${o.category}`.toLowerCase();
            if (!hay.includes(a.memo.toLowerCase())) return false;
        }
        return true;
    }

    // ===== 필터/정렬 =====
    function apply() {
        let list = state.all
            // "전체" 상태 데이터는 목록에서 제외
            .filter(o => o.status !== 'ALL')
            // 선택된 카테고리와 상태 조건 적용
            .filter(o => 
                (state.cat === '전체' || o.category === state.cat) &&
                (state.status === 'ALL' || o.status === state.status)
            );
    
        const k = (state.keyword || '').trim().toLowerCase();
        if (k) list = list.filter(o => (o.title + o.author + o.category).toLowerCase().includes(k));
    
        list = list.filter(matchAdvanced);
    
        switch (state.sort) {
            case 'views': list.sort((a, b) => b.views - a.views); break;
            case 'title': list.sort((a, b) => a.title.localeCompare(b.title, 'ko')); break;
            default: list.sort((a, b) => b.id - a.id);
        }
        state.filtered = list;
        state.selected.clear();
        el.checkAll && (el.checkAll.checked = false);
    }
    

    // ===== 테이블 렌더 =====
    function renderTable() {
        const start = (state.page - 1) * state.pageSize;
        const rows = state.filtered.slice(start, start + state.pageSize);
        show(el.empty, !rows.length);

        el.tbody.innerHTML = rows.map(o => `
        <tr data-id="${o.id}">
          <td><input type="checkbox" class="rowchk form-check-input"></td>
          <td class="text-center"><img src="${o.thumb}" style="width:72px;height:54px;object-fit:cover;border-radius:6px"></td>
          <td>
  <a href="${window.ADMIN_BASE_PATH}/content/post/edit/?id=${o.id}"
     class="text-decoration-none fw-semibold text-dark">
    ${o.title}
  </a>
</td>

<td>${o.category}</td>
<td>${o.author}</td>
          <td class="text-center"><span class="badge ${SBAD[o.status] || 'text-bg-secondary'}">${SLAB[o.status] || o.status}</span></td>
          <td class="text-center">${o.views}</td>
          <td class="text-center">${o.comments}</td>
          <td class="text-center">${o.likes}</td>
          <td class="text-center">
            <div class="small">${o.created}</div>
            <div class="text-body-secondary small">${o.updated}</div>
          </td>
          <td class="text-end"> 
             <button class="btn btn-sm btn-light" data-bs-toggle="dropdown"><i class="ri-more-2-line"></i></button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item row-act" href="#" data-act="preview">미리보기</a></li>
                <li><a class="dropdown-item row-act" href="#" data-act="quick">빠른수정</a></li>
                <li><a class="dropdown-item text-danger row-act" href="#" data-act="delete">삭제</a></li>
              </ul> 
          </td>
        </tr>`).join('');

        // 체크박스
        $$('#tbodyPost .rowchk').forEach(chk => {
            chk.addEventListener('change', e => {
                const id = Number(e.target.closest('tr').dataset.id);
                if (e.target.checked) state.selected.add(id); else state.selected.delete(id);
                setTxt(el.selCount, state.selected.size);
                if (el.checkAll) {
                    el.checkAll.checked = $$('#tbodyPost .rowchk').every(c => c.checked) && state.filtered.length > 0;
                }
            });
        });
    }

    function renderPaging() {
        const total = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
        setTxt(el.pgNow, state.page); setTxt(el.pgTotal, total);
        el.pgPrev?.classList.toggle('disabled', state.page <= 1);
        el.pgNext?.classList.toggle('disabled', state.page >= total);
    }

    function paint() {
        show(el.loader, true);
        setTimeout(() => { show(el.loader, false); renderTable(); renderPaging(); setTxt(el.selCount, state.selected.size); }, 180);
    }

    // ===== 검색/정렬 =====
    el.btnSearch?.addEventListener('click', (e) => { e.preventDefault(); state.keyword = el.keyword?.value || ''; state.page = 1; apply(); paint(); });
    el.keyword?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.btnSearch.click(); } });

    document.addEventListener('click', (e) => {
        const sort = e.target.closest('[data-sort]');
        if (sort) {
            e.preventDefault();
            state.sort = sort.dataset.sort;
            setTxt(el.sortLabel, sort.textContent.trim());
            $$('.dropdown-menu [data-sort]').forEach(a => a.classList.toggle('active', a === sort));
            apply(); paint();
            const u = new URL(location.href); u.searchParams.set('sort', state.sort); history.replaceState(null, '', u);
        }
    });

    // ===== 툴바/일괄 처리 =====
    const ACTION_LABEL = {
        POST_PUBLISH: '공개', POST_DRAFT: '임시저장', POST_SCHEDULE: '예약', POST_HIDE: '숨김', POST_DELETE: '삭제'
    };
    function runBulk(action) {
        const ids = [...state.selected];
        if (!ids.length) return alert('처리할 글을 선택하세요.');
        const label = ACTION_LABEL[action] || action;
        if (!confirm(`선택 ${ids.length}건을 [${label}] 처리할까요?`)) return;
        const set = new Set(ids);
        state.all = state.all.map(o => {
            if (!set.has(o.id)) return o;
            switch (action) {
                case 'POST_PUBLISH': o.status = 'PUBLISHED'; break;
                case 'POST_DRAFT': o.status = 'DRAFT'; break;
                case 'POST_SCHEDULE': o.status = 'SCHEDULED'; break;
                case 'POST_HIDE': o.status = 'HIDDEN'; break;
                case 'POST_DELETE': o.status = 'DELETED'; break;
            }
            return o;
        });
        refresh(`[${label}] 완료`);
    }
    document.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); runBulk(b.dataset.action); }));

    el.checkAll?.addEventListener('change', () => {
        const on = !!el.checkAll.checked; state.selected.clear();
        $$('#tbodyPost .rowchk').forEach(c => { c.checked = on; const id = Number(c.closest('tr')?.dataset.id); if (on && id) state.selected.add(id); });
        setTxt(el.selCount, state.selected.size);
    });

    el.pgPrev?.addEventListener('click', e => { e.preventDefault(); if (state.page > 1) { state.page--; paint(); } });
    el.pgNext?.addEventListener('click', e => {
        e.preventDefault(); const t = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
        if (state.page < t) { state.page++; paint(); }
    });

    el.btnHelp?.addEventListener('click', () => alert('상태 탭 + 카테고리 셀렉트 + 고급검색으로 필터링하고, 상단 버튼으로 일괄 처리하세요. (데모)'));

    // ===== 행 액션/모달 =====
    document.addEventListener('click', (e) => {
        const a = e.target.closest('.row-act'); if (!a) return;
        e.preventDefault();
        const tr = a.closest('tr'); const id = Number(tr?.dataset.id);
        const item = state.all.find(x => x.id === id);
        if (!item) return;

        if (a.dataset.act === 'preview') {
            el.detailBody.innerHTML = `
          <h4 class="mb-2">${item.title}</h4>
          <div class="text-body-secondary small mb-3">${item.category} · ${item.author} · ${item.created}</div>
          <div>${item.content}</div>`;
            withBS(() => bootstrap.Modal.getOrCreateInstance(el.mdDetail).show());
            return;
        }
        if (a.dataset.act === 'quick') {
            el.qTitle.value = item.title; el.qCat.value = item.category; el.qStatus.value = item.status;
            el.qScheduleBox.classList.toggle('d-none', el.qStatus.value !== 'SCHEDULED');
            el.formQuick.dataset.id = String(item.id);
            withBS(() => bootstrap.Modal.getOrCreateInstance(el.mdQuick).show());
            return;
        }
        if (a.dataset.act === 'delete') {
            if (confirm('삭제하시겠습니까?')) { item.status = 'DELETED'; refresh('삭제 완료'); }
        }
    });

    el.qStatus?.addEventListener('change', () => el.qScheduleBox.classList.toggle('d-none', el.qStatus.value !== 'SCHEDULED'));
    el.formQuick?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = Number(e.currentTarget.dataset.id || 0);
        const item = state.all.find(x => x.id === id); if (!item) return;
        item.title = el.qTitle.value || item.title;
        item.category = el.qCat.value || item.category;
        item.status = el.qStatus.value || item.status;
        refresh('저장되었습니다.');
        withBS(() => bootstrap.Modal.getOrCreateInstance(el.mdQuick).hide());
    });

    // ===== 글쓰기(Toast UI) =====
    let editor = null;
    function ensureEditor() {
        if (editor) return editor;
        if (window.toastui) {
            editor = new toastui.Editor({ el: el.editorHost, height: '460px', initialEditType: 'wysiwyg', previewStyle: 'vertical', placeholder: '여기에 내용을 작성하세요.' });
            el.editorFallback?.classList.add('d-none');
        } else {
            el.editorFallback?.classList.remove('d-none');
        }
        return editor;
    }
    el.btnNew?.addEventListener('click', () => {
        el.wCat.innerHTML = CATS.slice(1).map(c => `<option>${c}</option>`).join('');
        ensureEditor(); editor?.setHTML('<p>여기에 내용을 작성하세요.</p>');
        el.wTitle.value = ''; el.wStatus.value = 'DRAFT';
        withBS(() => bootstrap.Modal.getOrCreateInstance(el.mdWrite).show());
    });

    el.btnWriteSave?.addEventListener('click', () => {
        const title = (el.wTitle.value || '제목 없음').trim();
        const cat = el.wCat.value || '여행';
        const st = el.wStatus.value || 'DRAFT';
        const id = Math.max(1, ...state.all.map(x => x.id)) + 1;
        state.all.unshift({
            id, thumb: `/admin/assets/img/sample-thumb.svg`,
            title, category: cat, author: '운영자', status: st,
            views: 0, comments: 0, likes: 0,
            created: new Date().toISOString().slice(0, 16).replace('T', ' '),
            updated: new Date().toISOString().slice(0, 16).replace('T', ' '),
            content: editor ? editor.getHTML() : (el.editorFallback?.querySelector('textarea')?.value || '')
        });
        refresh('저장되었습니다.');
        withBS(() => bootstrap.Modal.getOrCreateInstance(el.mdWrite).hide());
    });

    // ===== 공통 =====
    function refresh(msg) { renderTabs(); buildCatSelect(); apply(); paint(); if (msg) alert(msg); }

    function init() {
        if (!SLAB[state.status]) state.status = 'PUBLISHED';
        if (!CATS.includes(state.cat)) state.cat = '전체';
        // 빠른수정/글쓰기 카테고리 옵션
        el.qCat.innerHTML = CATS.slice(1).map(c => `<option>${c}</option>`).join('');
        el.wCat.innerHTML = CATS.slice(1).map(c => `<option>${c}</option>`).join('');
        renderTabs(); buildCatSelect(); bindCatSelect(); apply(); paint();
    }
    init();
})();
