/* /admin/assets/js/review.js */
(() => {
    const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const qs = new URLSearchParams(location.search);
    const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    const initTooltips = () => { if (!window.bootstrap) return; $$('[data-bs-toggle="tooltip"]').forEach(el => { try { new bootstrap.Tooltip(el); } catch (_) { } }); };
    const showModal = id => { if (!window.bootstrap) return; const el = $(id); if (!el) return; bootstrap.Modal.getOrCreateInstance(el).show(); };
    const hideModal = id => { if (!window.bootstrap) return; const el = $(id); if (!el) return; (bootstrap.Modal.getInstance(el) || bootstrap.Modal.getOrCreateInstance(el)).hide(); };

    const STATUS_LABEL = { ALL: '전체', NEW: '신규리뷰', NEED_REPLY: '답변필요', REPLIED: '답변완료', HIDDEN: '숨김' };
    const STATUS_ORDER = ['ALL', 'NEW', 'NEED_REPLY', 'REPLIED', 'HIDDEN'];

    const el = {
        tabs: $('#reviewTabs'),
        btnPrintTop: $('#btnOrderPrint'), btnExportTop: $('#btnExport'),
        btnPrintM: $('#btnOrderPrint2'), btnExportM: $('#btnExport2'), btnHelp: $('#btnHelp'),
        keyword: $('#keyword'), btnSearch: $('#btnSearch'), btnAdvanced: $('#btnAdvanced'),
        mdAdvanced: $('#mdAdvanced'), advFrom: $('#advFrom'), advTo: $('#advTo'), advStatus: $('#advStatus'), advMemo: $('#advMemo'), formAdvanced: $('#formAdvanced'),
        emptyNew: $('#emptyNew'), emptyList: $('#emptyList'), loader: $('#loader'), jumpDone: $('#jumpDone'),
        tbl: $('#tblReview'), tbody: $('#tbodyReview'), checkAll: $('#checkAll'), selCount: $('#selCount'),
        pgPrev: $('#pgPrev'), pgNext: $('#pgNext'), pgNow: $('#pgNow'), pgTotal: $('#pgTotal'),
        // 모달
        mdDetail: '#mdReviewDetail', detailBody: $('#reviewDetailBody'), btnDetailReply: $('#btnDetailReply'),
        mdReply: '#mdReviewReply', formReply: $('#formReviewReply'), replyMeta: $('#replyMeta'),
        replyTextarea: $('#formReviewReply textarea[name="reply"]'), replyMarkDone: $('#replyMarkDone'),
    };

    // 데모 데이터
    const DEMO = (() => {
        const arr = [];
        const names = ['김지호', '박민수', '최서윤', '이다인', '오유진', '문성우'];
        const prods = ['밤호박 2kg', '감귤 3kg', '천혜향 2kg', '레드비트 1kg', '당근 5kg'];

        // ✅ ALL 은 실제 데이터 상태로 쓰지 않음
        const REAL_STATUSES = STATUS_ORDER.filter(s => s !== 'ALL');

        for (let i = 0; i < 46; i++) {
            const rating = (i % 5) + 1;
            const imgs = Array.from({ length: (i % 3) }, (_, k) => `/admin/assets/img/sample-thumb.svg`);
            arr.push({
                id: 61000 + i,
                createdAt: `2025-08-${String((i % 28) + 1).padStart(2, '0')} ${String(9 + (i % 10)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`,
                productName: prods[i % prods.length],
                productImg: `/admin/assets/img/sample-thumb.svg`,
                writer: names[i % names.length],
                phone: '010-' + String(1000 + (i % 9000)) + '-' + String(1000 + ((i * 11) % 9000)),
                content: (i % 2 ? '아주 신선하고 맛있어요!' : '포장이 살짝 손상됐지만 품질은 좋아요.'),
                rating,
                images: imgs,
                status: REAL_STATUSES[i % REAL_STATUSES.length],   // ✅ 여기만 변경
                reply: null, repliedAt: null, replier: null
            });
        }
        return arr;
    })();


    const state = {
        all: JSON.parse(localStorage.getItem('adm.review') || 'null') || DEMO,
        status: qs.get('status') || 'ALL',
        page: 1, pageSize: 10,
        selected: new Set(),
        keyword: '',
        adv: { from: '', to: '', statuses: new Set(), memo: '' },
        filtered: [],
        current: null,
    };

    const persist = () => localStorage.setItem('adm.review', JSON.stringify(state.all));
    const show = (elx, yes) => { if (elx) elx.classList.toggle('d-none', !yes); };
    const setText = (elx, txt) => { if (elx) elx.textContent = txt; };

    // 별점 렌더
    const starHTML = n => {
        const full = '★'.repeat(n), empty = '☆'.repeat(5 - n);
        return `<span class="text-warning" aria-label="${n}점">${full}</span><span class="text-body-tertiary">${empty}</span>`;
    };

    const badgeFor = s => {
        if (s === 'REPLIED') return '<span class="badge text-bg-success">답변완료</span>';
        if (s === 'NEED_REPLY') return '<span class="badge text-bg-warning">답변필요</span>';
        if (s === 'HIDDEN') return '<span class="badge text-bg-light">숨김</span>'; // 비활성 스타일
        return '<span class="badge text-bg-secondary">신규리뷰</span>';
    };


    const countByStatus = () => {
        const map = Object.fromEntries(STATUS_ORDER.map(s => [s, 0]));
        state.all.forEach(o => {
            if (map[o.status] != null) map[o.status]++;  // 각 상태별 카운트
            map.ALL++;                                   // ✅ 전체 카운트
        });
        return map;
    };


    /* ✅ 전체 탭 렌더링 포함 */
    function renderTabs() {
        const cnt = countByStatus();
        el.tabs.innerHTML = STATUS_ORDER.map(s => `
        <li class="nav-item flex-shrink-0">
          <button class="nav-link ${state.status === s ? 'active' : ''}" data-status="${s}">
            ${STATUS_LABEL[s]} <span class="badge text-bg-primary ms-1">${cnt[s] || 0}</span>
          </button>
        </li>`).join('');

        $$('button[data-status]', el.tabs).forEach(b => b.addEventListener('click', () => {
            state.status = b.dataset.status; state.page = 1; applyFilters(); renderAll();
            const url = new URL(location.href); url.searchParams.set('status', state.status); history.replaceState(null, '', url);
        }));
    }

    /* ✅ 전체 탭일 경우 모든 상태 보여줌 */
    function applyFilters() {
        const k = (state.keyword || '').trim().toLowerCase(); const A = state.adv;
        let list = state.status === 'ALL' ? [...state.all] : state.all.filter(o => o.status === state.status);
        if (k) {
            list = list.filter(o =>
                o.productName.toLowerCase().includes(k) ||
                (o.writer || '').toLowerCase().includes(k) ||
                String(o.phone).toLowerCase().includes(k) ||
                (o.content || '').toLowerCase().includes(k)
            );
        }
        if (A.from) list = list.filter(o => (o.createdAt || '') >= A.from);
        if (A.to) list = list.filter(o => (o.createdAt || '') <= A.to + ' 23:59');
        if (A.statuses.size) list = list.filter(o => A.statuses.has(o.status));
        if (A.memo) {
            const m = A.memo.toLowerCase();
            list = list.filter(o => (o.content || '').toLowerCase().includes(m) || (o.writer || '').toLowerCase().includes(m) || (o.productName || '').toLowerCase().includes(m));
        }
        state.filtered = list; state.selected.clear(); if (el.checkAll) el.checkAll.checked = false;
    }

    function renderTable() {
        const start = (state.page - 1) * state.pageSize; const rows = state.filtered.slice(start, start + state.pageSize);
        if (!rows.length) { show(el.loader, false); show(el.emptyNew, state.status === 'NEW'); show(el.emptyList, state.status !== 'NEW'); } else { show(el.emptyNew, false); show(el.emptyList, false); }
        el.tbody.innerHTML = rows.map(o => `
        <tr data-id="${o.id}">
          <td><input type="checkbox" class="rowchk form-check-input"></td>
          <td><div class="fw-semibold">${esc(o.createdAt)}</div></td>
          <td class="text-center"><img src="${esc(o.productImg)}" style="width:72px;height:54px;object-fit:cover;border-radius:6px"></td>
          <td>
  <div class="fw-semibold link-dark" data-row-action="detail" role="button">
    ${esc(o.productName)}
  </div>
  <div class="text-body-secondary small">${esc(o.writer)} · ${esc(o.phone)}</div>
</td>
          <td class="text-center">${starHTML(o.rating)}</td>
          <td>
            ${esc(o.content || '')}
            ${o.images?.length ? `<div class="mt-1 d-flex gap-1 flex-wrap">${o.images.map(src => `<img src="${esc(src)}" style="width:48px;height:36px;object-fit:cover;border-radius:4px;border:1px solid rgba(0,0,0,.08)">`).join('')}</div>` : ''}
            ${o.reply ? `<div class="small mt-1 text-body-secondary">↳ 답변: ${esc(o.reply.slice(0, 60))}${o.reply.length > 60 ? '…' : ''}</div>` : ''}
          </td>
          <td class="text-center">${badgeFor(o.status)}</td>
          <td class="text-end"> 
              <button class="btn btn-sm btn-light" data-bs-toggle="dropdown"><i class="ri-more-2-line"></i></button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item" href="#" data-row-action="detail">상세보기</a></li>
                <li><a class="dropdown-item" href="#" data-row-action="reply">답변작성</a></li>
              </ul> 
          </td>
        </tr>`).join('');

        $$('#tbodyReview .rowchk').forEach(chk => chk.addEventListener('change', e => {
            const id = Number(e.target.closest('tr')?.dataset.id); if (!id) return;
            if (e.target.checked) state.selected.add(id); else state.selected.delete(id);
            setText(el.selCount, state.selected.size);
            if (el.checkAll) { const all = $$('#tbodyReview .rowchk').every(c => c.checked); el.checkAll.checked = all && state.filtered.length > 0; }
        }));
    }

    function renderPaging() {
        const total = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
        setText(el.pgNow, state.page); setText(el.pgTotal, total);
        el.pgPrev?.classList.toggle('disabled', !(state.page > 1));
        el.pgNext?.classList.toggle('disabled', !(state.page < total));
    }

    function renderAll() { renderTabs(); show(el.loader, true); setTimeout(() => { applyFilters(); renderTable(); renderPaging(); setText(el.selCount, state.selected.size); show(el.loader, false); initTooltips(); }, 120); }

    // 일괄처리
    const ACTION_LABEL = {
        REV_MARK_NEED_REPLY: '답변 필요', REV_MARK_REPLIED: '답변 완료 처리',
        REV_HIDE: '숨김 처리', REV_SHOW: '노출 처리', REV_DELETE: '선택 삭제'
    };
    function runBulkAction(action) {
        const ids = [...state.selected]; if (!ids.length) { alert('처리할 리뷰를 선택하세요.'); return; }
        const label = ACTION_LABEL[action] || action; if (!confirm(`선택 ${ids.length}건에 대해 [${label}] 실행할까요?`)) return;
        const set = new Set(ids);
        if (action === 'REV_DELETE') { state.all = state.all.filter(o => !set.has(o.id)); }
        else {
            state.all = state.all.map(o => {
                if (!set.has(o.id)) return o;
                switch (action) {
                    case 'REV_MARK_NEED_REPLY': o.status = 'NEED_REPLY'; break;
                    case 'REV_MARK_REPLIED': o.status = 'REPLIED'; break;
                    case 'REV_HIDE': o.status = 'HIDDEN'; break;
                    case 'REV_SHOW': o.status = 'NEW'; break;
                }
                return o;
            });
        }
        persist();
        refresh(`[${label}] 완료`);
    }

    function refresh(msg) { applyFilters(); renderAll(); if (msg) alert(msg); }

    // 고급검색 칩
    function ensureAdvancedStatusChips() {
        if (!el.advStatus || el.advStatus.children.length) return;
        el.advStatus.innerHTML = STATUS_ORDER.map(s => `
        <label class="form-check form-check-inline">
          <input class="form-check-input" type="checkbox" name="advStatusChk" value="${s}">
          <span class="form-check-label">${STATUS_LABEL[s]}</span>
        </label>
      `).join('');
    }

    // 상세/답변 모달
    function openDetail(o) {
        state.current = o;
        const photos = o.images?.length ? `
        <div class="mt-2 d-flex gap-2 flex-wrap">
          ${o.images.map(src => `<img src="${esc(src)}" class="rounded border" style="width:96px;height:72px;object-fit:cover">`).join('')}
        </div>`: '';
        const body = `
        <div class="row g-3">
          <div class="col-md-4">
            <img src="${esc(o.productImg)}" class="img-fluid rounded border">
          </div>
          <div class="col-md-8">
            <div class="mb-2"><span class="me-2">${starHTML(o.rating)}</span> <span class="badge">${badgeFor(o.status).replace('badge ', 'badge ')}</span></div>
            <div class="mb-1"><strong>${esc(o.productName)}</strong></div>
            <div class="small text-body-secondary mb-2">${esc(o.createdAt)} · ${esc(o.writer)} · ${esc(o.phone)}</div>
            <div class="mb-3">
              <div class="text-body-secondary small">리뷰 내용</div>
              <div class="border rounded p-2">${esc(o.content || '')}</div>
              ${photos}
            </div>
            ${o.reply ? `
              <div>
                <div class="text-body-secondary small">판매자 답변</div>
                <div class="border rounded p-2 bg-light">${esc(o.reply)}</div>
                <div class="small text-body-secondary mt-1">답변자: ${esc(o.replier || '관리자')} · ${esc(o.repliedAt || '방금')}</div>
              </div>`:
                `<div class="alert alert-warning py-2 mb-0"><i class="ri-information-line me-1"></i> 등록된 답변이 없습니다.</div>`
            }
          </div>
        </div>`;
        el.detailBody.innerHTML = body;
        showModal(el.mdDetail);
    }

    function openReply(o) {
        state.current = o;
        el.replyTextarea.value = o.reply || '';
        el.replyMarkDone.checked = (o.status !== 'REPLIED');
        el.replyMeta.innerHTML = `
        <div><span class="me-2">${starHTML(o.rating)}</span> <span class="badge">${badgeFor(o.status).replace('badge ', 'badge ')}</span> <strong>${esc(o.productName)}</strong></div>
        <div>${esc(o.createdAt)} · ${esc(o.writer)} · ${esc(o.phone)}</div>`;
        showModal(el.mdReply);
    }

    // 바인딩
    function bind() {
        // 출력/CSV
        const openPrint = () => {
            const ids = [...state.selected]; if (!ids.length) { alert('출력할 리뷰를 선택하세요.'); return; }
            const w = window.open('', 'review_print', 'width=900,height=700');
            w.document.write(`<html><head><title>인쇄</title></head><body style="font-family:system-ui,Segoe UI,Apple SD Gothic Neo,sans-serif"><h3>선택 리뷰 (${ids.length}건)</h3><pre>${ids.join(', ')}</pre><hr><p>실서비스에선 서버 템플릿을 렌더링하세요.</p></body></html>`); w.document.close();
        };
        const exportCSV = () => {
            if (!state.filtered.length) { alert('내보낼 데이터가 없습니다.'); return; }
            const headers = ['작성시각', '상품', '작성자', '연락처', '평점', '내용', '상태', '답변', '답변자', '답변시각'];
            const rows = state.filtered.map(o => [o.createdAt, o.productName, o.writer, o.phone, o.rating, o.content || '', STATUS_LABEL[o.status] || o.status, o.reply || '', o.replier || '', o.repliedAt || '']);
            const escCsv = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
            const csv = '\uFEFF' + [headers.map(escCsv).join(','), ...rows.map(r => r.map(escCsv).join(','))].join('\r\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `review_${Date.now()}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        };

        el.btnPrintTop?.addEventListener('click', openPrint);
        el.btnPrintM?.addEventListener('click', openPrint);
        el.btnExportTop?.addEventListener('click', exportCSV);
        el.btnExportM?.addEventListener('click', exportCSV);

        el.btnHelp?.addEventListener('click', () => alert('• 리뷰 상태를 탭/일괄버튼으로 관리\n• 행 “관리”에서 상세/답변 모달 데모 동작'));

        // 검색/고급
        const doSearch = () => { state.keyword = el.keyword?.value || ''; state.page = 1; renderAll(); };
        el.btnSearch?.addEventListener('click', e => { e.preventDefault(); doSearch(); });
        el.keyword?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } });
        el.btnAdvanced?.addEventListener('click', () => { ensureAdvancedStatusChips(); showModal('#mdAdvanced'); });
        el.formAdvanced?.addEventListener('submit', e => {
            e.preventDefault();
            state.adv.from = el.advFrom?.value || ''; state.adv.to = el.advTo?.value || '';
            const set = new Set(); $$('input[name="advStatusChk"]:checked', el.advStatus).forEach(i => set.add(i.value));
            state.adv.statuses = set; state.adv.memo = el.advMemo?.value || ''; hideModal('#mdAdvanced'); state.page = 1; renderAll();
        });

        // 탭 이동 단축
        el.jumpDone?.addEventListener('click', e => { e.preventDefault(); state.status = 'REPLIED'; state.page = 1; renderAll(); const url = new URL(location.href); url.searchParams.set('status', state.status); history.replaceState(null, '', url); });

        // 체크/페이지
        el.checkAll?.addEventListener('change', () => {
            const checked = !!el.checkAll.checked; state.selected.clear();
            $$('#tbodyReview .rowchk').forEach(c => { c.checked = checked; const id = Number(c.closest('tr')?.dataset.id); if (checked && id) state.selected.add(id); });
            setText(el.selCount, state.selected.size);
        });
        el.pgPrev?.addEventListener('click', e => { e.preventDefault(); if (state.page > 1) { state.page--; renderAll(); } });
        el.pgNext?.addEventListener('click', e => { e.preventDefault(); const total = Math.max(1, Math.ceil(state.filtered.length / state.pageSize)); if (state.page < total) { state.page++; renderAll(); } });

        // 일괄
        $$('[data-action]').forEach(btn => btn.addEventListener('click', e => { e.preventDefault(); const a = btn.dataset.action; if (a) runBulkAction(a); }));

        // 행 관리: 상세/답변
        el.tbody?.addEventListener('click', e => {
            const a = e.target.closest('[data-row-action]'); if (!a) return; e.preventDefault();
            const tr = e.target.closest('tr[data-id]'); const id = Number(tr?.dataset.id); if (!id) return;
            const o = state.all.find(x => x.id === id); if (!o) return;
            if (a.dataset.rowAction === 'detail') openDetail(o);
            if (a.dataset.rowAction === 'reply') openReply(o);
        });

        // 상세 모달에서 답변 작성
        el.btnDetailReply?.addEventListener('click', () => { if (!state.current) return; hideModal(el.mdDetail); openReply(state.current); });

        // 답변 저장
        el.formReply?.addEventListener('submit', e => {
            e.preventDefault();
            if (!state.current) return;
            const text = el.replyTextarea.value.trim(); if (!text) { alert('답변 내용을 입력하세요.'); return; }
            state.current.reply = text; state.current.replier = '관리자';
            const now = new Date();
            state.current.repliedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            if (el.replyMarkDone.checked) state.current.status = 'REPLIED';
            persist(); hideModal(el.mdReply); refresh('답변이 저장되었습니다.');
        });
    }

    function ensureAdvancedStatusChips() {
        if (!el.advStatus || el.advStatus.children.length) return;
        el.advStatus.innerHTML = STATUS_ORDER.map(s => `
        <label class="form-check form-check-inline">
          <input class="form-check-input" type="checkbox" name="advStatusChk" value="${s}">
          <span class="form-check-label">${STATUS_LABEL[s]}</span>
        </label>`).join('');
    }

    function init() { const s = qs.get('status'); if (s && STATUS_LABEL[s]) state.status = s; applyFilters(); renderAll(); bind(); }
    init();
})();
