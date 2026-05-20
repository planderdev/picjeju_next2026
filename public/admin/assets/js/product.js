// /admin/assets/js/product.js
(function () {
    const $  = (s,r=document)=>r.querySelector(s);
    const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  
    const table = $('#prdTable'); 
    const tbody = $('#prdTableBody');
    if (!tbody) return;
  
    // ====== 데모 상품 데이터 ======
    const DEMO_PRODUCTS = [
      {no: 1001, title: '행복한 코딩 책', subtitle: '입문자를 위한 개발 입문서', thumb: '/admin/assets/img/sample-thumb.svg', price: 15000, status: '판매중', stock: 50, category: '도서', created: '2024-11-10', updated: '2024-11-11'},
      {no: 1002, title: '제주 감귤 선물세트', subtitle: '달콤한 제주 감귤 5kg', thumb: '/admin/assets/img/sample-thumb.svg', price: 32000, status: '판매중', stock: 120, category: '식품', created: '2024-11-05', updated: '2024-11-06'},
      {no: 1003, title: '친환경 주방세제', subtitle: '리필형 1L', thumb: '/admin/assets/img/sample-thumb.svg', price: 8900, status: '품절', stock: 0, category: '생활용품', created: '2024-10-30', updated: '2024-11-01'},
      {no: 1004, title: '고양이 간식 3종세트', subtitle: '닭가슴살 / 연어 / 참치맛', thumb: '/admin/assets/img/sample-thumb.svg', price: 11900, status: '판매중', stock: 70, category: '반려용품/간식', created: '2024-11-01', updated: '2024-11-08'},
      {no: 1005, title: '제주 자연 체험권', subtitle: '숲속 걷기 + 차 한잔', thumb: '/admin/assets/img/sample-thumb.svg', price: 25000, status: '숨김', stock: '-', category: '체험상품', created: '2024-09-15', updated: '2024-09-20'}
    ];
  
    // ====== 카테고리 목록 ======
    const CATEGORIES = ['도서', '식품', '생활용품', '반려용품/간식', '체험상품'];
  
    // ====== 렌더링 함수 ======
    function renderCategoryList() {
      const list = $('#catListGroup');
      if (!list) return;
      list.innerHTML = `<a href="#" class="list-group-item list-group-item-action active" data-filter-cat="__ALL__">전체 카테고리</a>` +
        CATEGORIES.map(c => `<a href="#" class="list-group-item list-group-item-action" data-filter-cat="${c}">${c}</a>`).join('');
    }
  
    function renderTable() {
      tbody.innerHTML = DEMO_PRODUCTS.map(p => `
        <tr data-status="${p.status}" data-category="${p.category}">
          <td><input class="form-check-input row-check" type="checkbox"></td>
          <td>${p.no}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <img src="${p.thumb}" width="48" height="48" class="rounded border" alt="">
              <div>
                <div class="fw-semibold prd-title" role="button">${p.title}</div>
                <div class="text-body-secondary small">${p.subtitle}</div>
              </div>
            </div>
          </td>
          <td class="text-center"><button class="btn btn-sm btn-light" title="새 창에서 보기"><i class="ri-external-link-line"></i></button></td>
          <td data-price="${p.price}">₩${p.price.toLocaleString()}</td>
          <td>
            <div class="dropdown">
              <button class="btn btn-sm btn-outline-secondary dropdown-toggle prd-status-btn" data-bs-toggle="dropdown">${p.status}</button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#" data-status="판매중">판매중</a></li>
                <li><a class="dropdown-item" href="#" data-status="품절">품절</a></li>
                <li><a class="dropdown-item" href="#" data-status="숨김">숨김</a></li>
              </ul>
            </div>
          </td>
          <td>${p.stock}</td>
          <td>${p.category}</td>
          <td data-date="${p.created}">${p.created}</td>
          <td>${p.updated}</td>
          <td class="text-end">
            <div class="dropdown">
              <button class="btn btn-sm btn-light" data-bs-toggle="dropdown"><i class="ri-more-2-fill"></i></button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item" href="edit">수정</a></li>
                <li><a class="dropdown-item" href="#" data-action="copy">복제</a></li>
                <li><a class="dropdown-item text-danger" href="#" data-action="remove">삭제</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" data-action="display">진열 설정</a></li>
              </ul>
            </div>
          </td>
        </tr>
      `).join('');
    }
  
    // ====== 초기 실행 ======
    renderCategoryList();
    renderTable();
  
    // ---- 상태 버튼 클래스 매핑 ----
    const STATUS_BTN_CLASS = {
      '판매중': 'btn-outline-primary',
      '품절'  : 'btn-outline-warning',
      '숨김'  : 'btn-outline-secondary'
    };
  
    // ---- 상태/필터 상태값 ----
    let currentTab  = 'all';            // all | on | soldout | hidden
    let currentCat  = '__ALL__';        // 카테고리
    let searchTerm  = '';               // 검색어
    let sortKey     = 'default';        // default | price | date
    let detailTr    = null;             // 상세 모달 대상 행
  
    const q          = $('#prdSearch');
    const btnSearch  = $('#btnSearch');
    const checkAll   = $('#checkAll');
    const bulkBar    = $('#bulkBar');
    const sortLabel  = $('#btnSortLabel');
   
  
    // ====== 진열설정(데모) 상태 저장: no -> state ======
    const displayState = new Map(); // { visible, start, end, sale, sort, channels[], memo }
  
    // ====== 카테고리 동적 저장 ======
    const catListGroup = $('#catListGroup');
    const categories   = new Set(catListGroup ? $$('[data-filter-cat]', catListGroup).map(a => a.dataset.filterCat) : []);
  
    // ====== 진열설정 모달 요소 (있으면 동작, 없으면 무시) ======
    const mdDs        = $('#mdDisplaySetting');
    const formDs      = $('#displaySettingForm');
    const dsTargetEl  = $('#dsTargetRows');
    const btnDsApply  = $('#btnDsApply');
    const btnDsReset  = $('#btnDsReset');
  
    // ====== 카테고리 추가 모달 요소 (있으면 동작, 없으면 무시) ======
    const mdCatAdd    = $('#mdCategoryAdd');
    const formCatAdd  = $('#categoryAddForm');
    const catNameInput= $('#catNameInput');
  
    // 유틸
    const money = (n)=> '₩'+(Number(n)||0).toLocaleString('ko-KR');
    const show  = (n,yes)=> n && n.classList.toggle('d-none', !yes);
    const getNo = (tr)=> parseInt(tr.children[1]?.textContent?.trim() || '0', 10);
  
    // 행 데이터 읽기
    function readRow(tr){
      const title = tr.querySelector('.prd-title')?.textContent.trim() || '';
      const price = Number(tr.querySelector('[data-price]')?.getAttribute('data-price') || 0);
      const date  = tr.querySelector('[data-date]')?.getAttribute('data-date') || '1970-01-01';
      const status= tr.dataset.status || '';
      const cat   = tr.dataset.category || '';
      return {tr, title, price, date, status, cat, text: tr.innerText.toLowerCase()};
    }
  
    // 탭 카운트 갱신
    function updateTabCounts(){
      const rows=[...tbody.querySelectorAll('tr')];
      const all = rows.length;
      const on  = rows.filter(tr=>tr.dataset.status==='판매중').length;
      const so  = rows.filter(tr=>tr.dataset.status==='품절').length;
      const hd  = rows.filter(tr=>tr.dataset.status==='숨김').length;
      $('[data-tab-count="all"]')   .textContent = all;
      $('[data-tab-count="on"]')    .textContent = on;
      $('[data-tab-count="soldout"]').textContent = so;
      $('[data-tab-count="hidden"]').textContent  = hd;
    }
  
    // 필터 적용
    function applyFilters(){
      const term = (searchTerm||'').toLowerCase().trim();
      const rows=[...tbody.querySelectorAll('tr')];
      rows.forEach(tr=>{
        const d = readRow(tr);
        let visible = true;
        // 탭
        if (currentTab==='on')       visible = d.status==='판매중';
        else if (currentTab==='soldout') visible = d.status==='품절';
        else if (currentTab==='hidden')  visible = d.status==='숨김';
        // 카테고리
        if (visible && currentCat!=='__ALL__') visible = d.cat===currentCat;
        // 검색
        if (visible && term) visible = d.text.includes(term);
        tr.style.display = visible ? '' : 'none';
      });
      updateBulkBar();
    }
  
    // 정렬
    function sortRows(key){
      const rows=[...tbody.querySelectorAll('tr')];
      if (key==='default'){
        // 기본: 진열 순서(sort) → 번호(no) 역순 (없으면 원래 순서 유지)
        const list = Array.from(tbody.children);
        list.sort((r1,r2)=>{
          const s1 = parseInt(r1.dataset.sort||'9999',10);
          const s2 = parseInt(r2.dataset.sort||'9999',10);
          if (s1 !== s2) return s1 - s2;
          return getNo(r2) - getNo(r1);
        });
        list.forEach(tr=>tbody.appendChild(tr));
        return;
      }
      const sorted = rows.sort((a,b)=>{
        const A = readRow(a), B = readRow(b);
        if (key==='price') return (B.price - A.price); // 가격 내림차순
        if (key==='date')  return (B.date  > A.date) ? 1 : (B.date < A.date ? -1 : 0); // 최신순
        return 0;
      });
      sorted.forEach(tr=>tbody.appendChild(tr));
    }
  
    // 벌크바
    function updateBulkBar(){
      const any = tbody.querySelectorAll('.row-check:checked:not(:disabled):not([disabled])')
        .length > 0;
      show(bulkBar, any);
    }
  
    // 상태 버튼 클래스 적용
    function applyStatusBtnClass(btn, status){
      Object.values(STATUS_BTN_CLASS).forEach(c=>btn.classList.remove(c));
      btn.classList.add(STATUS_BTN_CLASS[status] || 'btn-outline-secondary');
      btn.textContent = status;
    }
  
    // 상세 모달 열기
    function openDetail(tr){
      detailTr = tr;
      const d = readRow(tr);
      const body = $('#prdDetailBody');
      const foot = $('#prdDetailFoot');
      const thumb = tr.querySelector('img')?.getAttribute('src') || '';
      if (body) {
        body.innerHTML = `
          <div class="row g-3">
            <div class="col-md-7">
              <div class="d-flex gap-3">
                <img src="${thumb}" style="width:120px;height:120px;object-fit:cover;border-radius:8px" alt="">
                <div>
                  <div class="fw-semibold">${d.title}</div>
                  <div class="text-body-secondary small">카테고리: ${d.cat}</div>
                  <div class="mt-2">상태:
                    <span class="badge ${d.status==='판매중'?'text-bg-primary':(d.status==='품절'?'text-bg-warning':'text-bg-secondary')}">
                      ${d.status}
                    </span>
                  </div>
                </div>
              </div>
              <hr>
              <dl class="row mb-0">
                <dt class="col-4 col-md-3">판매가</dt><dd class="col-8 col-md-9">${money(d.price)}</dd>
                <dt class="col-4 col-md-3">등록일</dt><dd class="col-8 col-md-9">${d.date}</dd>
              </dl>
            </div>
            <div class="col-md-5">
              <div class="card">
                <div class="card-header"><h6 class="mb-0">빠른 설정</h6></div>
                <div class="card-body">
                  <div class="d-grid gap-2">
                    <button class="btn btn-success" id="detailSetOn">판매중</button>
                    <button class="btn btn-outline-warning" id="detailSetSoldout">품절</button>
                    <button class="btn btn-outline-secondary" id="detailSetHide">숨김</button>
                  </div>
                </div>
              </div>
            </div>
          </div>`;
      }
      if (foot) foot.textContent = `상품번호 #${tr.children[1]?.textContent?.trim() || '-'}`;
  
      if (window.bootstrap) new bootstrap.Modal('#mdPrdDetail').show();
  
      // 모달 내 빠른 버튼
      $('#detailSetOn')     ?.addEventListener('click', ()=> setRowStatus(tr, '판매중', true));
      $('#detailSetSoldout')?.addEventListener('click', ()=> setRowStatus(tr, '품절', true));
      $('#detailSetHide')   ?.addEventListener('click', ()=> setRowStatus(tr, '숨김', true));
    }
  
    // 행 상태 변경
    function setRowStatus(tr, status, fromModal=false){
      tr.dataset.status = status;
      const btn = tr.querySelector('.prd-status-btn');
      if (btn) applyStatusBtnClass(btn, status);
      updateTabCounts();
      applyFilters();
      if (fromModal && window.bootstrap){
        const m = bootstrap.Modal.getInstance($('#mdPrdDetail'));
        m?.hide();
      }
    }
  
    // CSV 내보내기 (필터된 노출 행만)
    function exportCSV(){
      const rows=[...tbody.querySelectorAll('tr')].filter(tr=>tr.style.display!=='none');
      if(!rows.length){ alert('내보낼 데이터가 없습니다.'); return; }
      const headers = ['상품번호','상품명','카테고리','상태','판매가','등록일','수정일'];
      const data = rows.map(tr=>{
        const no   = tr.children[1]?.textContent.trim() || '';
        const name = tr.querySelector('.prd-title')?.textContent.trim() || '';
        const cat  = tr.dataset.category || '';
        const st   = tr.dataset.status || '';
        const price= tr.querySelector('[data-price]')?.getAttribute('data-price') || '0';
        const cdt  = tr.querySelector('[data-date]')?.getAttribute('data-date') || '';
        const udt  = tr.children[9]?.textContent.trim() || '';
        return [no,name,cat,st,price,cdt,udt];
      });
      const needs=/["\n,]/, dbl=/"/g;
      const esc=s=>{ s=String(s??''); return needs.test(s)?'"'+s.replace(dbl,'""')+'"':s; };
      const csv='\uFEFF'+[headers.map(esc).join(','), ...data.map(r=>r.map(esc).join(','))].join('\r\n');
      const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob);
      const a=document.createElement('a'); a.href=url; a.download='products_'+Date.now()+'.csv';
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }
  
    // -------------------- 새로 추가: 진열설정 모달 로직 --------------------
    function openDisplayModal(targetTrList){
      if (!mdDs || !formDs || !dsTargetEl) return alert('진열설정 모달 마크업이 없습니다.');
      // 대상 행들의 no를 hidden에 저장
      const ids = targetTrList.map(tr => getNo(tr)).filter(Boolean);
      dsTargetEl.value = ids.join(',');
  
      // 단일: 기존 상태 로드 / 다중: 기본값
      if (ids.length === 1) {
        const st = displayState.get(ids[0]) || {};
        $('#dsVisible') && ($('#dsVisible').checked = st.visible ?? true);
        $('#dsStart')   && ($('#dsStart').value   = st.start ?? '');
        $('#dsEnd')     && ($('#dsEnd').value     = st.end   ?? '');
        $('#dsSaleState')&&($('#dsSaleState').value = st.sale ?? '판매중');
        $('#dsSort')    && ($('#dsSort').value    = st.sort ?? 100);
        if ($('#dsChannels')) {
          const chans = new Set(st.channels || ['web','mobile']);
          $$('#dsChannels .form-check-input').forEach(i => i.checked = chans.has(i.value));
        }
        $('#dsMemo')    && ($('#dsMemo').value    = st.memo ?? '');
      } else {
        formDs.reset?.();
        if ($('#dsVisible')) $('#dsVisible').checked = true;
        if ($('#dsChannels')) {
          $$('#dsChannels .form-check-input').forEach(i => {
            i.checked = (i.value==='web' || i.value==='mobile');
          });
        }
      }
  
      bootstrap.Modal.getOrCreateInstance(mdDs).show();
    }
  
    btnDsReset?.addEventListener('click', ()=>{
      formDs?.reset?.();
      if ($('#dsVisible')) $('#dsVisible').checked = true;
      if ($('#dsChannels')) {
        $$('#dsChannels .form-check-input').forEach(i => {
          i.checked = (i.value==='web' || i.value==='mobile');
        });
      }
    });
  
    btnDsApply?.addEventListener('click', ()=>{
      const ids = (dsTargetEl?.value||'').split(',').map(s=>parseInt(s,10)).filter(Boolean);
      if (ids.length === 0) return;
  
      const payload = {
        visible:  $('#dsVisible')?.checked ?? true,
        start:    $('#dsStart')?.value || '',
        end:      $('#dsEnd')?.value || '',
        sale:     $('#dsSaleState')?.value || '판매중',
        sort:     parseInt($('#dsSort')?.value||'100',10),
        channels: $$('#dsChannels .form-check-input:checked').map(i=>i.value),
        memo:     $('#dsMemo')?.value || ''
      };
  
      // 메모리 저장 + 행 상태/정렬 반영
      ids.forEach(no => {
        displayState.set(no, payload);
        const tr = [...tbody.querySelectorAll('tr')].find(r => getNo(r)===no);
        if (tr) {
          tr.dataset.sort = payload.sort;
          tr.dataset.status = payload.sale;
          const btn = tr.querySelector('.prd-status-btn');
          if (btn) applyStatusBtnClass(btn, payload.sale);
        }
      });
  
      // 정렬 재적용(진열 순서 우선)
      sortRows(sortKey);
      applyFilters();
  
      bootstrap.Modal.getInstance(mdDs)?.hide();
    });
  
    // -------------------- 새로 추가: 카테고리 추가 모달 로직 --------------------
    formCatAdd?.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = (catNameInput?.value || '').trim();
      if (!name || !catListGroup) return;
  
      // 중복 이름 방지: (2), (3) …
      let final = name;
      let n = 2;
      while (categories.has(final)) final = `${name} (${n++})`;
      categories.add(final);
  
      // 좌측 리스트에 추가
      const a = document.createElement('a');
      a.href = '#';
      a.className = 'list-group-item list-group-item-action';
      a.dataset.filterCat = final;
      a.textContent = final;
      catListGroup.appendChild(a);
  
      // 모달 닫고 초기화
      if (window.bootstrap) bootstrap.Modal.getInstance(mdCatAdd)?.hide();
      if (catNameInput) catNameInput.value = '';
    });
  
    // 동적 위임: 카테고리 항목 클릭 시 필터 (기존 정적 바인딩 + 동적 추가 모두 지원)
    catListGroup?.addEventListener('click', (e)=>{
      const a = e.target.closest('[data-filter-cat]');
      if (!a) return;
      e.preventDefault();
      $$('[data-filter-cat]', catListGroup).forEach(x=>x.classList.remove('active'));
      a.classList.add('active');
      currentCat = a.dataset.filterCat || '__ALL__';
      applyFilters();
    });
  
    // -------- 바인딩 --------
    // 탭
    $$('[data-tab]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        $$('[data-tab]').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.dataset.tab;
        applyFilters();
      });
    });
  
    // (정적) 카테고리 초기 바인딩은 위에서 동적 위임으로 대체
  
    // 검색
    function doSearch(){
      searchTerm = q?.value || '';
      applyFilters();
    }
    q?.addEventListener('input', doSearch);
    btnSearch?.addEventListener('click', doSearch);
  
    // 정렬
    document.querySelectorAll('.dropdown-menu [data-sort]').forEach(a=>{
      a.addEventListener('click', e=>{
        e.preventDefault();
        document.querySelectorAll('.dropdown-menu [data-sort]').forEach(x=>x.classList.remove('active'));
        a.classList.add('active');
        sortKey = a.dataset.sort || 'default';
        sortLabel.textContent = a.textContent.trim();
        sortLabel.setAttribute('data-sort-label', sortKey);
        sortRows(sortKey);
        applyFilters(); // 정렬 후 현재 필터 반영
      });
    });
  
    // 상태 변경 (드롭다운)
    table.addEventListener('click', (e)=>{
      const item = e.target.closest('.dropdown-item[data-status]');
      if (!item) return;
      e.preventDefault();
      const tr = e.target.closest('tr');
      setRowStatus(tr, item.dataset.status);
    });
  
    // 제목 클릭 → 상세 모달
    table.addEventListener('click', (e)=>{
      const title = e.target.closest('.prd-title');
      if (!title) return;
      const tr = title.closest('tr');
      openDetail(tr);
    });
  
    // 전체선택/벌크바
    checkAll?.addEventListener('change', ()=>{
      const vis = [...tbody.querySelectorAll('.row-check')].filter(cb=>cb.closest('tr').style.display!=='none');
      vis.forEach(cb=>cb.checked = !!checkAll.checked);
      updateBulkBar();
    });
    tbody.addEventListener('change', e=>{
      if (e.target.classList.contains('row-check')) updateBulkBar();
    });
  
    // 행 액션(복제/삭제/이동/진열설정)
    table.addEventListener('click', (e)=>{
      const a = e.target.closest('.dropdown-item[data-action]');
      if (!a) return;
      e.preventDefault();
      const tr   = a.closest('tr');
      const act  = a.dataset.action;
      const name = tr?.querySelector('.prd-title')?.textContent || '';
  
      if (act === 'remove') {
        tr.remove();
        updateTabCounts();
        applyFilters();
      } else if (act === 'copy') {
        const dup = tr.cloneNode(true);
        tbody.insertBefore(dup, tr.nextSibling);
        updateTabCounts();
        applyFilters();
      } else if (act === 'display') {
        // 행 단일 진열설정 모달 오픈
        openDisplayModal([tr]);
      } else if (act === 'moveTop') {
        tbody.prepend(tr);
      } else if (act === 'moveBottom') {
        tbody.append(tr);
      } else if (act === 'moveUp') {
        const prev = tr.previousElementSibling; if (prev) prev.before(tr);
      } else if (act === 'moveDown') {
        const next = tr.nextElementSibling; if (next) next.after(tr);
      }
    });
  
    // 벌크바 첫 번째 버튼(선택 진열 설정)으로 가정: .btn-group .btn:nth-child(1)
    bulkBar?.querySelector('.btn-group .btn:nth-child(1)')?.addEventListener('click', ()=>{
      const targets = $$('.row-check:checked', tbody).map(cb => cb.closest('tr'));
      if (!targets.length) return alert('선택된 상품이 없습니다.');
      openDisplayModal(targets);
    });
  
    // 엑셀 다운로드
    $('#btnExcel') ?.addEventListener('click', exportCSV);
    $('#btnExcel2')?.addEventListener('click', exportCSV);
  
    // 초기 상태 버튼 외형 적용 + 카운트/필터 초기화
    function initStatusButtons(){
      tbody.querySelectorAll('tr').forEach(tr=>{
        const btn = tr.querySelector('.prd-status-btn');
        if (btn) applyStatusBtnClass(btn, tr.dataset.status || '판매중');
      });
      updateTabCounts();
      sortRows(sortKey); // 기본 정렬 규칙 적용(진열순/번호)
      applyFilters();
    }
  
    // 상세 모달 하단 버튼(모달 공용 버튼)
    $('#btnDetailOn')     ?.addEventListener('click', ()=> detailTr && setRowStatus(detailTr, '판매중', true));
    $('#btnDetailSoldout')?.addEventListener('click', ()=> detailTr && setRowStatus(detailTr, '품절', true));
    $('#btnDetailHide')   ?.addEventListener('click', ()=> detailTr && setRowStatus(detailTr, '숨김', true));
  
    // 초기 구동
    initStatusButtons();
  })();
  