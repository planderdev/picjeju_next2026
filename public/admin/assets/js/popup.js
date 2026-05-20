/* /admin/assets/js/popup.js
 * 팝업/배너 관리자 (데모: localStorage)
 * - 목록 렌더, 검색/필터, 추가/수정/삭제, 미리보기, 벌크
 * - 페이지네이션(데모), CSV 내보내기
 */

(function () {
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
    const fmtDate = (d) => d ? new Date(d).toLocaleString('ko-KR') : '-';
    const nowISO = () => new Date().toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
    const uid = () => 'p' + Math.random().toString(36).slice(2, 9);
    const storageKey = 'imw.popups.v1';

    // DOM refs
    const tbl = $('#popTable tbody');
    const checkAll = $('#popCheckAll');
    const bulkBar = $('#popBulkBar');
    const bulkCount = $('#bulkCount');
    const searchInput = $('#popSearch');
    const statusChips = $('#statusChips');
    const countAll = $('#countAll');
    const countOn = $('#countOn');
    const countOff = $('#countOff');
    const countScheduled = $('#countScheduled');
    const countExpired = $('#countExpired');
    const countShown = $('#countShown');
    const countTotal = $('#countTotal');
    const emptyState = $('#emptyState');
    const pager = $('#popPager');

    const btnAdd = $('#btnAdd');
    const btnAddEmpty = $('#btnAddEmpty');
    const btnExportCsv = $('#btnExportCsv');
    const btnResetFilters = $('#btnResetFilters');

    // Modal refs
    const editModalEl = $('#popupEditModal');
    const editModal = editModalEl ? new bootstrap.Modal(editModalEl) : null;
    const modalMode = $('#modalMode');
    const form = $('#popupForm');
    const f = {
        id: $('#popId'),
        title: $('#popTitle'),
        type: $('#popType'),
        location: $('#popLocation'),
        device: $('#popDevice'),
        content: $('#popContent'),
        image: $('#popImage'),
        link: $('#popLink'),
        start: $('#popStart'),
        end: $('#popEnd'),
        enabled: $('#popEnabled'),
        closable: $('#popClosable'),
        once: $('#popOncePerDay'),
        memo: $('#popMemo'),
    };

    const delModalEl = $('#popupDeleteModal');
    const delModal = delModalEl ? new bootstrap.Modal(delModalEl) : null;
    const btnConfirmDelete = $('#btnConfirmDelete');

    const previewModalEl = $('#popupPreviewModal');
    const previewModal = previewModalEl ? new bootstrap.Modal(previewModalEl) : null;
    const previewStage = $('#previewStage');

    // Filter refs
    const typeFilters = {
        layer: $('#ftLayer'),
        banner: $('#ftBanner'),
        toast: $('#ftToast')
    };
    const locFilter = $('#locFilter');

    // State
    let data = load() || seed();
    let view = {
        q: '',
        status: 'all',
        types: { layer: true, banner: true, toast: true },
        loc: '',
        page: 1,
        perPage: 10,
        selected: new Set(),
        pendingDeleteIds: [],
    };

    // ===== Storage =====
    function load() {
        try { return JSON.parse(localStorage.getItem(storageKey) || ''); } catch (e) { return null; }
    }
    function save() {
        localStorage.setItem(storageKey, JSON.stringify(data));
    }

    // ===== Seed demo =====
    function seed() {
        const today = new Date();
        const start1 = new Date(today.getFullYear(), today.getMonth(), 1, 9, 0);
        const end1 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 23, 59);
        const start2 = new Date(today.getFullYear(), today.getMonth() - 1, 25, 0, 0);
        const end2 = new Date(today.getFullYear(), today.getMonth() - 1, 30, 23, 59);
        const start3 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0);
        const end3 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 23, 59);

        const demo = [
            {
                id: uid(), title: '10월 오픈 기념 배너', type: 'banner', location: '전페이지', device: 'all',
                content: '<strong>오픈 특가</strong> 지금 바로 확인!',
                image: '/admin/assets/img/sample-thumb.svg',
                link: 'https://example.com/event',
                start: start1.toISOString(), end: end1.toISOString(),
                enabled: true, closable: true, once: false, 
                memo: '상단고정',createdAt: new Date().toISOString() // ✅ 추가
            },
            {
                id: uid(), title: '신규 회원 전용 레이어팝', type: 'layer', location: '/', device: 'pc',
                content: '<h3 class="mb-2">신규회원 5,000P</h3><p>지금 가입하고 혜택 받기</p>',
                image: '/admin/assets/img/sample-thumb.svg',
                link: 'https://example.com/join',
                start: start2.toISOString(), end: end2.toISOString(), // 만료됨
                enabled: true, closable: true, once: true, memo: '만료 예시',createdAt: new Date().toISOString()
            },
            {
                id: uid(), title: '앱 설치 알림', type: 'toast', location: '/store', device: 'mobile',
                content: '앱에서 더 빠르게 쇼핑해보세요!',
                image: '', link: 'https://example.com/app',
                start: start3.toISOString(), end: end3.toISOString(), // 예약
                enabled: true, closable: false, once: false, memo: '예약 예시',createdAt: new Date().toISOString()
            },
            {
                id: uid(), title: '주말 특가 토스트', type: 'toast', location: '전페이지', device: 'all',
                content: '주말 한정! 전상품 5% 추가할인',
                image: '', link: '', start: '', end: '', enabled: false, closable: true, once: false, memo: '비활성',createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem(storageKey, JSON.stringify(demo));
        return demo;
    }

    // ===== Helpers =====
    function toStatus(item) {
        if (!item.enabled) return 'off';
        const now = new Date();
        const s = item.start ? new Date(item.start) : null;
        const e = item.end ? new Date(item.end) : null;
        if (s && now < s) return 'scheduled';
        if (e && now > e) return 'expired';
        return 'on';
    }

    function statusBadge(st) {
        if (st === 'on') return '<span class="badge text-bg-success">보임</span>';
        if (st === 'off') return '<span class="badge text-bg-secondary">숨김</span>';
        if (st === 'scheduled') return '<span class="badge text-bg-info">예약</span>';
        if (st === 'expired') return '<span class="badge text-bg-warning">기간만료</span>';
        return '<span class="badge text-bg-light">-</span>';
    }

    function typeBadge(t) {
        if (t === 'layer') return '<span class="badge rounded-pill text-bg-primary">레이어</span>';
        if (t === 'banner') return '<span class="badge rounded-pill text-bg-dark">배너</span>';
        if (t === 'toast') return '<span class="badge rounded-pill text-bg-secondary">토스트</span>';
        return t;
    }

    function deviceLabel(d) {
        return d === 'pc' ? 'PC' : d === 'mobile' ? '모바일' : 'PC+모바일';
    }

    function matchesFilters(item) {
        // 상태 필터
        const st = toStatus(item);
        if (view.status !== 'all' && st !== view.status) return false;
        // 타입 필터
        if (!view.types[item.type]) return false;
        // 위치 필터
        if (view.loc) {
            const needle = view.loc.trim().toLowerCase();
            const hay = (item.location || '').toLowerCase();
            if (!hay.includes(needle)) return false;
        }
        // 검색
        if (view.q) {
            const q = view.q.toLowerCase();
            const txt = [item.title, item.location, item.memo].join(' ').toLowerCase();
            if (!txt.includes(q)) return false;
        }
        return true;
    }

    // ===== Rendering =====
    function render() {
        // 카운트 집계
        const totals = { all: data.length, on: 0, off: 0, scheduled: 0, expired: 0 };
        data.forEach(it => { totals[toStatus(it)]++; });
        countAll.textContent = totals.all;
        countOn.textContent = totals.on;
        countOff.textContent = totals.off;
        countScheduled.textContent = totals.scheduled;
        countExpired.textContent = totals.expired;

        // 필터링
        const filtered = data.filter(matchesFilters);
        countShown.textContent = filtered.length;
        countTotal.textContent = data.length;

        // 페이지네이션
        const pages = Math.max(1, Math.ceil(filtered.length / view.perPage));
        if (view.page > pages) view.page = pages;
        const start = (view.page - 1) * view.perPage;
        const rows = filtered.slice(start, start + view.perPage);

        // 테이블 렌더
        tbl.innerHTML = rows.map(it => {
            const st = toStatus(it);
            const visibilityIcon = it.enabled ? 'ri-eye-line' : 'ri-eye-off-line';
            const visibilityTitle = it.enabled ? '숨김 처리' : '보임 처리';
            const checked = view.selected.has(it.id) ? 'checked' : '';
            return `
          <tr data-id="${it.id}">
            <td><input class="form-check-input row-check" type="checkbox" ${checked}></td>
            <td>
              <button type="button" class="admin-title-action pop-preview-trigger">${escapeHtml(it.title)}</button>
              ${it.memo ? `<div class="text-muted small">${escapeHtml(it.memo)}</div>` : ''}
            </td>
            <td>
              <div class="mb-1">${typeBadge(it.type)} <span class="text-muted small ms-1">${deviceLabel(it.device)}</span></div>
              <div class="small text-muted">${escapeHtml(it.location || '')}</div>
            </td>
            <td>
              <div class="small">${fmtDate(it.start)} ~ ${fmtDate(it.end)}</div>
            </td>
            <td>${statusBadge(st)}</td>
           <td><div class="small text-muted">${it.createdAt ? new Date(it.createdAt).toLocaleDateString('ko-KR') : '-'}</div></td>

            <td>
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-secondary btn-edit"><i class="ri-edit-2-line"></i></button>
                <button class="btn btn-outline-secondary btn-dup" title="복제"><i class="ri-file-copy-line"></i></button>
                <button class="btn btn-outline-secondary btn-toggle" title="${visibilityTitle}" aria-label="${visibilityTitle}"><i class="${visibilityIcon}"></i></button>
                <button class="btn btn-outline-danger btn-del"><i class="ri-delete-bin-line"></i></button>
              </div>
            </td>
          </tr>
        `;
        }).join('');

        // 빈 상태 토글
        emptyState.classList.toggle('d-none', filtered.length !== 0);

        // 헤더 체크 상태
        syncCheckAll();

        // 페이지네이션 렌더
        renderPager(pages);

        // 바인딩
        $$('.row-check', tbl).forEach(cb => {
            on(cb, 'change', (e) => {
                const id = e.target.closest('tr')?.dataset.id;
                if (!id) return;
                if (e.target.checked) view.selected.add(id); else view.selected.delete(id);
                updateBulkBar();
                syncCheckAll();
            });
        });
        $$('.pop-preview-trigger', tbl).forEach(b => {
            on(b, 'click', onPreview);
            on(b, 'keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') onPreview(e);
            });
        });
        $$('.btn-edit', tbl).forEach(b => on(b, 'click', onEdit));
        $$('.btn-dup', tbl).forEach(b => on(b, 'click', onDuplicate));
        $$('.btn-toggle', tbl).forEach(b => on(b, 'click', onToggle));
        $$('.btn-del', tbl).forEach(b => on(b, 'click', onDelete));
    }

    function renderPager(pages) {
        if (!pager) return;
        const make = (p, label, active = false, disabled = false) => `
        <li class="page-item ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}">
          <a class="page-link" href="#" data-page="${p}">${label}</a>
        </li>`;
        let html = '';
        html += make(view.page - 1, '이전', false, view.page === 1);
        for (let p = 1; p <= pages; p++) {
            if (p === 1 || p === pages || Math.abs(p - view.page) <= 1) {
                html += make(p, p, p === view.page);
            } else if (Math.abs(p - view.page) === 2) {
                html += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
            }
        }
        html += make(view.page + 1, '다음', false, view.page === pages);
        pager.innerHTML = html;
        $$('a.page-link', pager).forEach(a => {
            on(a, 'click', (e) => {
                e.preventDefault();
                const p = parseInt(a.dataset.page, 10);
                if (!isNaN(p)) { view.page = p; render(); }
            });
        });
    }

    function syncCheckAll() {
        const checks = $$('.row-check', tbl);
        const all = checks.length > 0 && checks.every(cb => cb.checked);
        checkAll.checked = all;
        updateBulkBar();
    }

    function updateBulkBar() {
        const selCount = view.selected.size;
        bulkCount.textContent = selCount;
        bulkBar.classList.toggle('d-none', selCount === 0);
    }

    function escapeHtml(s) { return (s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }

    // ===== Actions =====
    function onPreview(e) {
        e.preventDefault();
        const id = e.currentTarget.closest('tr')?.dataset.id;
        const it = data.find(x => x.id === id);
        if (!it || !previewModal) return;

        // Stage 초기화
        previewStage.innerHTML = `
        <div class="position-relative" style="min-height:420px;">
          <img src="/admin/assets/img/sample-thumb.svg" class="img-fluid w-100" alt="">
          <div id="previewMount"></div>
        </div>
      `;
        const mount = $('#previewMount', previewStage);

        // 타입별 모의 렌더
        if (it.type === 'banner') {
            mount.innerHTML = `
          <div class="position-absolute top-0 start-0 end-0 p-3">
            <a href="${escapeHtml(it.link || '#')}" class="d-block text-decoration-none">
              <div class="rounded-3 shadow p-3 bg-white border">
                ${it.image ? `<img src="${escapeHtml(it.image)}" class="img-fluid d-block w-100 mb-2" alt="">` : ''}
                <div>${it.content || ''}</div>
              </div>
            </a>
          </div>`;
        } else if (it.type === 'layer') {
            mount.innerHTML = `
          <div class="position-absolute top-50 start-50 translate-middle" style="width:640px;max-width:90%;">
            <div class="card shadow-lg">
              ${it.image ? `<img src="${escapeHtml(it.image)}" class="card-img-top" alt="">` : ''}
              <div class="card-body">
                <h5 class="card-title mb-2">${escapeHtml(it.title)}</h5>
                <div class="card-text">${it.content || ''}</div>
                ${it.link ? `<a class="btn btn-primary mt-3" href="${escapeHtml(it.link)}" target="_blank">바로가기</a>` : ''}
              </div>
            </div>
          </div>`;
        } else {
            // toast
            mount.innerHTML = `
          <div class="position-absolute bottom-0 end-0 p-3" style="max-width:360px;">
            <div class="toast show">
              <div class="toast-header">
                <strong class="me-auto">${escapeHtml(it.title)}</strong>
                <small>지금</small>
              </div>
              <div class="toast-body">
                ${it.image ? `<img src="${escapeHtml(it.image)}" class="img-fluid mb-2" alt="">` : ''}
                <div>${it.content || ''}</div>
                ${it.link ? `<div class="mt-2"><a href="${escapeHtml(it.link)}" target="_blank">자세히 보기</a></div>` : ''}
              </div>
            </div>
          </div>`;
        }
        previewModal.show();
    }

    function openForm(mode, item) {
        if (!editModal) return;
        modalMode.textContent = mode === 'add' ? '추가' : '수정';
        f.id.value = item?.id || '';
        f.title.value = item?.title || '';
        f.type.value = item?.type || 'layer';
        f.location.value = item?.location || '전페이지';
        f.device.value = item?.device || 'all';
        f.content.value = item?.content || '';
        f.image.value = item?.image || '';
        f.link.value = item?.link || '';
        f.start.value = item?.start ? item.start.slice(0, 16) : '';
        f.end.value = item?.end ? item.end.slice(0, 16) : '';
        f.enabled.checked = item?.enabled ?? true;
        f.closable.checked = item?.closable ?? true;
        f.once.checked = item?.once ?? false;
        f.memo.value = item?.memo || '';
        editModal.show();
    }

    function onEdit(e) {
        e.preventDefault();
        const id = e.currentTarget.closest('tr')?.dataset.id;
        const it = data.find(x => x.id === id);
        openForm('edit', it);
    }

    function onAdd() {
        openForm('add', null);
    }

    function onDuplicate(e) {
        e.preventDefault();
        const id = e.currentTarget.closest('tr')?.dataset.id;
        const it = data.find(x => x.id === id);
        if (!it) return;
        const copy = JSON.parse(JSON.stringify(it));
        copy.id = uid();
        copy.title = it.title + ' (복제)';
        data.unshift(copy);
        save(); render();
    }

    function onToggle(e) {
        e.preventDefault();
        const id = e.currentTarget.closest('tr')?.dataset.id;
        const it = data.find(x => x.id === id);
        if (!it) return;
        it.enabled = !it.enabled;
        save(); render();
    }

    function onDelete(e) {
        e.preventDefault();
        const id = e.currentTarget.closest('tr')?.dataset.id;
        view.pendingDeleteIds = [id];
        delModal?.show();
    }

    // ===== Events =====
    on(btnAdd, 'click', onAdd);
    on(btnAddEmpty, 'click', onAdd);

    on(checkAll, 'change', () => {
        const ids = $$('#popTable tbody tr').map(tr => tr.dataset.id);
        if (checkAll.checked) ids.forEach(id => view.selected.add(id)); else view.selected.clear();
        render();
    });

    on(btnConfirmDelete, 'click', () => {
        if (!view.pendingDeleteIds?.length) return;
        data = data.filter(it => !view.pendingDeleteIds.includes(it.id));
        view.pendingDeleteIds = [];
        delModal?.hide();
        view.selected.clear();
        save(); render();
    });

    // 벌크
    on($('#bulkShow'), 'click', () => { bulkEnable(true); });
    on($('#bulkHide'), 'click', () => { bulkEnable(false); });
    on($('#bulkDelete'), 'click', () => {
        view.pendingDeleteIds = [...view.selected];
        delModal?.show();
    });

    function bulkEnable(v) {
        data.forEach(it => { if (view.selected.has(it.id)) it.enabled = v; });
        view.selected.clear();
        save(); render();
    }

    // 검색
    on(searchInput, 'input', () => {
        view.q = searchInput.value.trim();
        view.page = 1;
        render();
    });

    // 상태 칩
    $$('#statusChips .btn').forEach(btn => {
        on(btn, 'click', () => {
            $$('#statusChips .btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            view.status = btn.dataset.status;
            view.page = 1;
            render();
        });
    });

    // 타입/위치 필터
    Object.entries(typeFilters).forEach(([k, el]) => {
        on(el, 'change', () => {
            view.types[k] = !!el.checked;
            view.page = 1;
            render();
        });
    });
    on(locFilter, 'input', () => {
        view.loc = locFilter.value;
        view.page = 1;
        render();
    });
    on(btnResetFilters, 'click', () => {
        Object.values(typeFilters).forEach(el => el.checked = true);
        view.types = { layer: true, banner: true, toast: true };
        locFilter.value = '';
        view.loc = '';
        $$('#statusChips .btn').forEach(b => b.classList.remove('active'));
        $('#statusChips .btn[data-status="all"]').classList.add('active');
        view.status = 'all';
        view.q = ''; searchInput.value = '';
        view.page = 1;
        render();
    });

    // CSV
    on(btnExportCsv, 'click', () => {
        const filtered = data.filter(matchesFilters);
        const rows = [
            ['id', 'title', 'type', 'location', 'device', 'content', 'image', 'link', 'start', 'end', 'enabled', 'closable', 'once', 'memo', 'status'],
            ...filtered.map(it => [
                it.id, it.title, it.type, it.location, it.device,
                (it.content || '').replace(/\n/g, ' ').replace(/"/g, '""'),
                it.image || '', it.link || '',
                it.start || '', it.end || '',
                it.enabled ? 1 : 0, it.closable ? 1 : 0, it.once ? 1 : 0,
                it.memo || '', toStatus(it)
            ])
        ];
        const csv = rows.map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'popups.csv';
        a.click();
        URL.revokeObjectURL(a.href);
    });

    // 폼 저장
    on(form, 'submit', (e) => {
        e.preventDefault();
        const item = {
            id: f.id.value || uid(),
            title: f.title.value.trim(),
            type: f.type.value,
            location: f.location.value,
            device: f.device.value,
            content: f.content.value,
            image: f.image.value.trim(),
            link: f.link.value.trim(),
            start: f.start.value ? new Date(f.start.value).toISOString() : '',
            end: f.end.value ? new Date(f.end.value).toISOString() : '',
            enabled: !!f.enabled.checked,
            closable: !!f.closable.checked,
            once: !!f.once.checked,
            memo: f.memo.value.trim(),
            // ✅ 신규 생성일 경우 createdAt 추가
            createdAt: f.id.value 
                ? (data.find(x => x.id === f.id.value)?.createdAt || new Date().toISOString()) 
                : new Date().toISOString()
          };
          
        if (!item.title) { alert('제목을 입력하세요.'); return; }

        const ix = data.findIndex(x => x.id === item.id);
        if (ix >= 0) data[ix] = item; else data.unshift(item);
        save();
        editModal?.hide();
        render();
    });

    // 초기화
    if (data.length === 0) data = seed();
    render();

})();
