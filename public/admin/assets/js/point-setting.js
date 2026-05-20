/* /admin/assets/js/point-add.js — 픽포인트 지급/차감 */
(() => {
    const $ = (s,r=document)=>r.querySelector(s);
    const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  
    // ------------------------------
    // 🔹 임의 회원 데이터 (8명)
    // ------------------------------
    const members = [
      {name:'랄라고고', email:'lalagogo@lalagogo.co.kr', point:10000},
      {name:'물비늘', email:'mulbinnal@picjeju.co.kr', point:500},
      {name:'밍', email:'mmm@lalagogo.co.kr', point:25000},
      {name:'도토리', email:'dotori@picjeju.co.kr', point:4800},
      {name:'니모', email:'nemo@picjeju.co.kr', point:15200},
      {name:'봄날', email:'bomnal@picjeju.co.kr', point:7200},
      {name:'라라', email:'lala@picjeju.co.kr', point:1200},
      {name:'한라봉', email:'hallabong@picjeju.co.kr', point:35000}
    ];
  
    const el = {
      form: $('#pointForm'),
      tbody: $('#tbodyMemberSearch'),
      btnSearch: $('#btnMemberSearch'),
      keyword: $('#memberKeyword'),
      btnAdd: $('#btnMemberAdd'),
      selected: $('#selectedMembers'),
      amount: $('#pointAmount'),
      reason: $('#pointReason')
    };
  
    let checked = new Set();
  
    // ------------------------------
    // 🔹 회원 리스트 렌더링
    // ------------------------------
    function renderSearchList(list){
      if(!list.length){
        el.tbody.innerHTML = `
          <tr><td colspan="4" class="text-center text-body-secondary py-4">
            검색 결과가 없습니다.
          </td></tr>`;
        return;
      }
  
      el.tbody.innerHTML = list.map(m => `
        <tr class="member-row" data-email="${m.email}" data-name="${m.name}" data-point="${m.point}">
          <td class="text-center">
  <div class="form-check m-0 d-flex justify-content-center">
    <input class="form-check-input chk-member" type="checkbox"
      data-email="${m.email}" data-name="${m.name}" data-point="${m.point}">
  </div>
</td>
          <td>${m.name}</td>
          <td>${m.email}</td>
          <td class="text-end">${m.point.toLocaleString()} P</td>
        </tr>
      `).join('');
  
      // 행 클릭 시 체크박스 토글
      $$('.member-row').forEach(row => {
        row.addEventListener('click', e => {
          if(e.target.tagName === 'INPUT') return; // 체크박스 직접 클릭시 무시
          const chk = row.querySelector('.chk-member');
          chk.checked = !chk.checked;
        });
      });
    }
  
    // ------------------------------
    // 🔹 선택된 회원 리스트 렌더링
    // ------------------------------
    function renderSelected(){
      if(!checked.size){
        el.selected.innerHTML = `<div class="text-body-secondary small">선택된 회원이 없습니다.</div>`;
        return;
      }
  
      el.selected.innerHTML = [...checked].map(j => `
        <div class="d-flex justify-content-between align-items-center p-3 border rounded bg-light">
          <div><strong class="me-3">${j.name}</strong> <span class="text-body-secondary">${j.email}</span></div>
          <button class="btn btn-sm btn-link text-danger" data-remove="${j.email}">
            <i class="ri-close-line"></i>
          </button>
        </div>
      `).join('');
  
      // 삭제 버튼
      $$('#selectedMembers [data-remove]').forEach(btn=>{
        btn.addEventListener('click',()=>{
          checked = new Set([...checked].filter(x=>x.email!==btn.dataset.remove));
          renderSelected();
        });
      });
    }
  
    // ------------------------------
    // 🔹 검색 수행 함수
    // ------------------------------
    function doSearch(){
      const k = el.keyword.value.trim().toLowerCase();
      const filtered = k
        ? members.filter(m => (m.name+m.email).toLowerCase().includes(k))
        : [];
      renderSearchList(filtered);
    }
  
    // ------------------------------
    // 🔹 검색 버튼 클릭 + 엔터
    // ------------------------------
    el.btnSearch?.addEventListener('click', doSearch);
    el.keyword?.addEventListener('keydown', e=>{
      if(e.key === 'Enter'){
        e.preventDefault();
        doSearch();
      }
    });
  
    // ------------------------------
    // 🔹 회원 추가 버튼
    // ------------------------------
    el.btnAdd?.addEventListener('click',()=>{
      $$('.chk-member:checked').forEach(chk=>{
        const d = {name:chk.dataset.name, email:chk.dataset.email, point:+chk.dataset.point};
        if (![...checked].some(item => item.email === d.email)) checked.add(d);
      });
      renderSelected();
  
      const modal = bootstrap.Modal.getInstance($('#modalMemberSearch'));
      modal?.hide();
    });

    el.form?.addEventListener('submit', e => {
      e.preventDefault();
      const amount = Number(el.amount?.value || 0);
      const reason = (el.reason?.value || '').trim();
      const type = document.querySelector('input[name="ptype"]:checked')?.value || 'plus';
      const targetType = document.querySelector('input[name="targetType"]:checked')?.value || 'member';

      if (!amount || amount < 1) {
        window.adminToast?.('금액을 입력해 주세요.', 'warning') || alert('금액을 입력해 주세요.');
        el.amount?.focus();
        return;
      }

      if (!reason) {
        window.adminToast?.('사유를 입력해 주세요.', 'warning') || alert('사유를 입력해 주세요.');
        el.reason?.focus();
        return;
      }

      if (targetType === 'member' && !checked.size) {
        window.adminToast?.('대상 회원을 선택해 주세요.', 'warning') || alert('대상 회원을 선택해 주세요.');
        return;
      }

      const actionText = type === 'plus' ? '지급' : '차감';
      const targetText = targetType === 'member' ? `${checked.size}명` : '선택 그룹';
      window.adminToast?.(`${targetText}에게 ${amount.toLocaleString('ko-KR')}P ${actionText} 처리되었습니다.`, 'success')
        || alert('처리되었습니다.');
      el.form.reset();
      checked = new Set();
      renderSelected();
    });
  
    // 초기엔 리스트 비움
    el.tbody.innerHTML = `
      <tr><td colspan="4" class="text-center text-body-secondary py-4">
        검색 결과가 없습니다.
      </td></tr>`;
  })();
  
