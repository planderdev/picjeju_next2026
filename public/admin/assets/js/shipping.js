/* 동일 레이아웃용 배송설정 스크립트 (Bootstrap5 + 바닐라) */
(() => {
    const $=(s,r=document)=>r.querySelector(s);
    const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
    const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  
    // Elements
    const el = {
      tabs: $('#shippingTabs'),
      pTemplate: $('#panel-template'),
      pPlace: $('#panel-place'),
      pService: $('#panel-service'),
  
      // 템플릿 테이블
      tbodyTemplates: $('#tbodyTemplates'),
      checkAllTpl: $('#checkAllTpl'),
      selTplCount: $('#selTplCount'),
      linkAddCountry: $('#linkAddCountry'),
  
      // 장소 테이블
      tbodyPlaces: $('#tbodyPlaces'),
      checkAllPlace: $('#checkAllPlace'),
      selPlaceCount: $('#selPlaceCount'),
  
      // 모달/폼
      mdTemplate: $('#mdTemplate'),
      formTemplate: $('#formTemplate'),
      tplPlaceSel: $('#formTemplate select[name="placeId"]'),
      tplCountryList: $('#tplCountryList'),
      btnTplAddCountry: $('#btnTplAddCountry'),
  
      mdPlace: $('#mdPlace'),
      formPlace: $('#formPlace'),
  
      // 서비스
      btnServiceApply: $('#btnServiceApply'),
      btnCarrierRegister: $('#btnCarrierRegister'),
      carrierStatus: $('#carrierStatus'),
  
      // 요금/충전
      priceTbody: $('#priceTbody'),
      chargeOptions: $('#chargeOptions'),
      chargeTotal: $('#chargeTotal'),
      formCharge: $('#formCharge'),
    };
  
    const initTooltips = () => {
      if (!window.bootstrap) return;
      $$('[data-bs-toggle="tooltip"]').forEach(t => { try { new bootstrap.Tooltip(t); } catch(_){} });
    };
  
    // Demo data (localStorage 유지)
    const DEMO_PLACES = [{ id:'P1', name:'출고 및 반품/교환지명 A', fromAddr:'', returnAddr:'', tel:'' }];
    const DEMO_TEMPLATES = [{
      id:'T1', name:'배송 템플릿 A', isDefault:true, placeId:'P1',
      countries:[{name:'대한민국', ship:'택배/선결제', baseFee:2500, freeOver:50000, returnFee:2500, exchangeFee:5000}]
    }];
    const PRICE_PLANS = [
      {count:1000, price:22000, benefit:'-'},
      {count:2000, price:44000, benefit:'-'},
      {count:3000, price:66000, benefit:'-'},
      {count:5000, price:111000, benefit:'-'},
      {count:10000, price:220000, benefit:'1,000건 추가'},
      {count:20000, price:440000, benefit:'2,000건 추가'},
      {count:30000, price:660000, benefit:'5,000건 추가'},
      {count:50000, price:1100000, benefit:'15,000건 추가'},
    ];
    const money = v => `KRW ${Number(v||0).toLocaleString()}`;
    const won = v => `${Number(v||0).toLocaleString()}원`;
  
    const state = {
      tab: 'template',
      templates: JSON.parse(localStorage.getItem('adm.ship.templates')||'null') || DEMO_TEMPLATES,
      places: JSON.parse(localStorage.getItem('adm.ship.places')||'null') || DEMO_PLACES,
      editingTplId: null,
      editingPlaceId: null,
      chargeSelected: PRICE_PLANS[0].count,
      selTpl: new Set(),
      selPlace: new Set(),
    };
    const save = ()=>{
      localStorage.setItem('adm.ship.templates', JSON.stringify(state.templates));
      localStorage.setItem('adm.ship.places', JSON.stringify(state.places));
    };
  
    // Tabs
    function setTab(tab){
      state.tab = tab;
      $$('#shippingTabs .nav-link').forEach(a=>a.classList.toggle('active', a.dataset.tab===tab));
      el.pTemplate.classList.toggle('d-none', tab!=='template');
      el.pPlace.classList.toggle('d-none', tab!=='place');
      el.pService.classList.toggle('d-none', tab!=='service');
      if(tab==='template') renderTemplates();
      if(tab==='place') renderPlaces();
    }
  
    // Templates table
    function renderTemplates(){
      const rows = state.templates.map(t=>{
        const place = state.places.find(p=>p.id===t.placeId);
        const statusBadge = t.isDefault
          ? '<span class="badge text-bg-secondary">기본</span>'
          : '<span class="badge text-bg-light">일반</span>'; // <- 비활성/일반은 text-bg-light
        const countries = t.countries?.length||0;
        return `
          <tr data-id="${t.id}">
            <td><input type="checkbox" class="chk-tpl"></td>
            <td class="fw-semibold">${esc(t.name)}</td>
            <td>${esc(place?.name||'지정 필요')}</td>
            <td class="text-center">${countries}</td>
            <td class="text-center">${statusBadge}</td>
            <td class="text-end">
              <div class="btn-group">
                <button class="btn btn-outline-secondary btn-sm" data-action="edit">수정</button>
                <button class="btn btn-outline-danger btn-sm" ${t.isDefault?'disabled':''} data-action="del">삭제</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
      el.tbodyTemplates.innerHTML = rows || '';
      $('#emptyList')?.classList.toggle('d-none', !!rows);
  
      // 체크
      el.checkAllTpl.checked = false;
      state.selTpl.clear();
      el.selTplCount.textContent = '0';
  
      // row events
      el.tbodyTemplates.addEventListener('click', onTplTableClick, { once:true });
    }
    function onTplTableClick(e){
      const tr = e.target.closest('tr[data-id]');
      if(!tr) return;
      const id = tr.dataset.id;
  
      if(e.target.classList.contains('chk-tpl')){
        e.stopPropagation();
        const checked = e.target.checked;
        if(checked) state.selTpl.add(id); else state.selTpl.delete(id);
        el.selTplCount.textContent = String(state.selTpl.size);
        return;
      }
  
      const actBtn = e.target.closest('[data-action]');
      if(!actBtn) return;
      const act = actBtn.dataset.action;
      if(act==='edit'){ openTemplateModal(id); }
      if(act==='del'){
        if(!confirm('이 템플릿을 삭제할까요?')) return;
        state.templates = state.templates.filter(t=>t.id!==id);
        save(); renderTemplates();
      }
    }
    el.checkAllTpl?.addEventListener('change', ()=>{
      const on = el.checkAllTpl.checked;
      $$('.chk-tpl', el.tbodyTemplates).forEach(c=>{ c.checked = on; c.dispatchEvent(new Event('click')); });
    });
  
    // Places table
    function renderPlaces(){
      const rows = state.places.map(p=>`
        <tr data-id="${p.id}">
          <td><input type="checkbox" class="chk-place"></td>
          <td class="fw-semibold">${esc(p.name)}</td>
          <td>${p.fromAddr?esc(p.fromAddr):'<span class="text-body-secondary">-</span>'}</td>
          <td>${p.returnAddr?esc(p.returnAddr):'<span class="text-body-secondary">-</span>'}</td>
          <td>${p.tel?esc(p.tel):'<span class="text-body-secondary">-</span>'}</td>
          <td class="text-end">
            <div class="btn-group">
              <button class="btn btn-outline-secondary btn-sm" data-action="edit">수정</button>
              <button class="btn btn-outline-danger btn-sm" data-action="del">삭제</button>
            </div>
          </td>
        </tr>
      `).join('');
      el.tbodyPlaces.innerHTML = rows || '';
      $('#emptyList')?.classList.toggle('d-none', !!rows);
  
      el.checkAllPlace.checked = false;
      state.selPlace.clear();
      el.selPlaceCount.textContent = '0';
  
      el.tbodyPlaces.addEventListener('click', onPlaceTableClick, { once:true });
    }
    function onPlaceTableClick(e){
      const tr = e.target.closest('tr[data-id]');
      if(!tr) return;
      const id = tr.dataset.id;
  
      if(e.target.classList.contains('chk-place')){
        e.stopPropagation();
        if(e.target.checked) state.selPlace.add(id); else state.selPlace.delete(id);
        el.selPlaceCount.textContent = String(state.selPlace.size);
        return;
      }
  
      const actBtn = e.target.closest('[data-action]');
      if(!actBtn) return;
      const act = actBtn.dataset.action;
      if(act==='edit'){ openPlaceModal(id); }
      if(act==='del'){
        if(!confirm('삭제할까요?')) return;
        const used = state.templates.some(t=>t.placeId===id);
        if(used){ alert('이 장소를 사용하는 템플릿이 있어 삭제할 수 없습니다.'); return; }
        state.places = state.places.filter(x=>x.id!==id);
        save(); renderPlaces(); renderTemplates();
      }
    }
    el.checkAllPlace?.addEventListener('change', ()=>{
      const on = el.checkAllPlace.checked;
      $$('.chk-place', el.tbodyPlaces).forEach(c=>{ c.checked = on; c.dispatchEvent(new Event('click')); });
    });
  
    // Template Modal
    function openTemplateModal(id=null, opts={}){
      state.editingTplId = id;
      const t = id ? state.templates.find(x=>x.id===id)
                   : { id:`T${Date.now()}`, name:'', isDefault:false, placeId: state.places[0]?.id||'', countries:[] };
  
      // place select
      el.tplPlaceSel.innerHTML = state.places.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
      el.formTemplate.name.value = t.name||'';
      el.formTemplate.isDefault.checked = !!t.isDefault;
      el.formTemplate.placeId.value = t.placeId||state.places[0]?.id||'';
  
      // countries
      renderCountryList(t);
  
      el.btnTplAddCountry.onclick = (e)=>{ e.preventDefault(); addCountryRow(t); };
  
      el.formTemplate.onsubmit = (e)=>{
        e.preventDefault();
        const payload = {
          id: t.id,
          name: el.formTemplate.name.value.trim(),
          isDefault: el.formTemplate.isDefault.checked,
          placeId: el.formTemplate.placeId.value,
          countries: readCountriesDOM()
        };
        if(!payload.name) return alert('템플릿명을 입력하세요.');
        if(!payload.placeId) return alert('출고/반품지를 선택하세요.');
        if(payload.isDefault){ state.templates.forEach(x=>{ if(x.id!==payload.id) x.isDefault=false; }); }
  
        const exists = state.templates.some(x=>x.id===payload.id);
        if(exists) state.templates = state.templates.map(x=>x.id===payload.id? payload : x);
        else state.templates.push(payload);
  
        save();
        bootstrap.Modal.getOrCreateInstance(el.mdTemplate).hide();
        renderTemplates();
      };
  
      bootstrap.Modal.getOrCreateInstance(el.mdTemplate).show();
    }
    function renderCountryList(t){
      el.tplCountryList.innerHTML = (t.countries||[]).map((c,idx)=>countryRowHTML(c, idx)).join('') || `<div class="text-body-secondary">국가 정책을 추가하세요.</div>`;
    }
    function countryRowHTML(c={}, idx){
      return `
        <div class="border rounded p-2" data-country-row="${idx}">
          <div class="row g-2 align-items-center">
            <div class="col-6 col-md-3">
              <label class="form-label small mb-0">국가</label>
              <input class="form-control form-control-sm" name="c_name" value="${esc(c.name||'대한민국')}">
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label small mb-0">배송/결제</label>
              <input class="form-control form-control-sm" name="c_ship" value="${esc(c.ship||'택배/선결제')}">
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label small mb-0">기본 배송비</label>
              <input class="form-control form-control-sm" name="c_base" type="number" value="${Number(c.baseFee||0)}">
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label small mb-0">무료조건</label>
              <input class="form-control form-control-sm" name="c_free" type="number" value="${Number(c.freeOver||0)}">
            </div>
            <div class="col-6 col-md-1">
              <label class="form-label small mb-0">반품</label>
              <input class="form-control form-control-sm" name="c_ret" type="number" value="${Number(c.returnFee||0)}">
            </div>
            <div class="col-6 col-md-1">
              <label class="form-label small mb-0">교환</label>
              <input class="form-control form-control-sm" name="c_ex" type="number" value="${Number(c.exchangeFee||0)}">
            </div>
          </div>
        </div>
      `;
    }
    function addCountryRow(t){
      t.countries = t.countries || [];
      t.countries.push({name:'대한민국', ship:'택배/선결제', baseFee:0, freeOver:0, returnFee:0, exchangeFee:0});
      renderCountryList(t);
    }
    function readCountriesDOM(){
      return $$('#tplCountryList [data-country-row]').map((row)=>({
        name: row.querySelector('[name="c_name"]').value.trim(),
        ship: row.querySelector('[name="c_ship"]').value.trim(),
        baseFee: Number(row.querySelector('[name="c_base"]').value||0),
        freeOver: Number(row.querySelector('[name="c_free"]').value||0),
        returnFee: Number(row.querySelector('[name="c_ret"]').value||0),
        exchangeFee: Number(row.querySelector('[name="c_ex"]').value||0),
      }));
    }
  
    // Place Modal
    function openPlaceModal(id=null){
      state.editingPlaceId = id;
      const p = id ? state.places.find(x=>x.id===id)
                   : {id:`P${Date.now()}`, name:'', fromAddr:'', returnAddr:'', tel:''};
  
      el.formPlace.name.value = p.name||'';
      el.formPlace.fromAddr.value = p.fromAddr||'';
      el.formPlace.returnAddr.value = p.returnAddr||'';
      el.formPlace.tel.value = p.tel||'';
  
      el.formPlace.onsubmit = (e)=>{
        e.preventDefault();
        const payload = {
          id: p.id,
          name: el.formPlace.name.value.trim(),
          fromAddr: el.formPlace.fromAddr.value.trim(),
          returnAddr: el.formPlace.returnAddr.value.trim(),
          tel: el.formPlace.tel.value.trim(),
        };
        if(!payload.name) return alert('지점명을 입력하세요.');
  
        const exists = state.places.some(x=>x.id===payload.id);
        if(exists) state.places = state.places.map(x=>x.id===payload.id? payload : x);
        else state.places.push(payload);
  
        save();
        bootstrap.Modal.getOrCreateInstance(el.mdPlace).hide();
        renderPlaces(); renderTemplates();
      };
  
      bootstrap.Modal.getOrCreateInstance(el.mdPlace).show();
    }
  
    // Service (demo)
    function bindService(){
      $('#btnServiceApply')?.addEventListener('click', e=>{
        e.preventDefault();
        window.scrollTo({ top: document.body.scrollHeight, behavior:'smooth' });
        alert('서비스 신청(데모)');
      });
      el.btnCarrierRegister?.addEventListener('click', (e)=>{
        e.preventDefault();
        el.carrierStatus.textContent = '계약정보 확인 중…';
        setTimeout(()=>{ el.carrierStatus.textContent = '계약정보 확인완료'; }, 1200);
      });
    }
  
    // Price/Charge
    function renderPriceCharge(){
      el.priceTbody.innerHTML = PRICE_PLANS.map(p=>`
        <tr><td class="text-center">${p.count.toLocaleString()}건</td><td class="text-center">${esc(p.benefit)}</td><td class="text-end">${won(p.price)}</td><td class="text-end">${won(Math.round(p.price/p.count))}</td></tr>
      `).join('');
      el.chargeOptions.innerHTML = PRICE_PLANS.map(p=>`
        <label class="form-check d-flex justify-content-between border rounded p-2">
          <span>${p.count.toLocaleString()}건</span>
          <span>${won(p.price)}</span>
          <input class="form-check-input ms-2" type="radio" name="chargeCnt" value="${p.count}" ${state.chargeSelected===p.count?'checked':''}>
        </label>
      `).join('');
      el.chargeOptions.addEventListener('change', e=>{
        if(e.target.name==='chargeCnt'){
          state.chargeSelected = Number(e.target.value);
          const plan = PRICE_PLANS.find(x=>x.count===state.chargeSelected);
          el.chargeTotal.textContent = won(plan?.price||0);
        }
      });
      el.formCharge?.addEventListener('submit',(e)=>{
        e.preventDefault();
        const plan = PRICE_PLANS.find(x=>x.count===state.chargeSelected);
        alert(`충전 요청: ${plan.count.toLocaleString()}건 / ${won(plan.price)} (데모)`);
        bootstrap.Modal.getInstance($('#mdCharge'))?.hide();
      });
    }
  
    // Toolbar buttons
    function bindToolbar(){
      $('#btnAddTemplateTop')?.addEventListener('click', ()=>openTemplateModal());
      $('#btnAddTemplate')?.addEventListener('click', ()=>openTemplateModal());
      $('#btnAddTemplateCard')?.addEventListener('click', ()=>openTemplateModal());
      $('#linkAddCountry')?.addEventListener('click', (e)=>{
        e.preventDefault();
        const first = state.templates[0];
        if(!first) return alert('먼저 템플릿을 추가하세요.');
        openTemplateModal(first.id);
        // 국가행은 모달 안에서 추가 버튼 사용
      });
  
      $('#btnAddPlace')?.addEventListener('click', ()=>openPlaceModal());
    }
  
    // Tab events
    $$('#shippingTabs .nav-link').forEach(a=>{
      a.addEventListener('click', (e)=>{ e.preventDefault(); setTab(a.dataset.tab); });
    });
  
    // Init
    function init(){
      initTooltips();
      setTab('template');
      renderTemplates();
      renderPlaces();
      renderPriceCharge();
      bindToolbar();
      bindService();
    }
    init();
  })();
  