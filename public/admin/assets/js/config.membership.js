/* config.membership.js
 * 회원가입/그룹/등급 UI 동작 스텁
 * 실제 저장은 서버 연동 시 연결하세요.
*/
(function () {
    const $ = (sel, ctx=document) => ctx.querySelector(sel);
    const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
  
    const enableSave = () => {
      $('#btnSave') && ($('#btnSave').disabled = false);
      $('#btnSaveGroup') && ($('#btnSaveGroup').disabled = false);
    };
  
    // 토글: 사용 체크 -> 필수 가능
    $$('#default_type_form_wrap [data-essential], #business_type_form_wrap [data-essential]').forEach(el=>{
      el.addEventListener('change', e=>{
        const target = e.currentTarget.getAttribute('data-essential');
        const essential = document.querySelector(target);
        if (!essential) return;
        essential.disabled = !e.currentTarget.checked;
        if (!e.currentTarget.checked) essential.checked = false;
        enableSave();
      });
    });
  
    // 섹션 보이기/숨기기 체크박스
    $$('._use_checkbox').forEach(el=>{
      const tgtSel = el.getAttribute('data-target');
      const tgt = tgtSel ? document.querySelector(tgtSel) : null;
      const apply = () => {
        if (!tgt) return;
        tgt.classList.toggle('d-none', !el.checked);
      };
      el.addEventListener('change', ()=>{ apply(); enableSave(); });
      apply();
    });
  
    // 로그인 타입 선택 시 아이디 사용 토글
    $$('input[name="login_type"]').forEach(r=>{
      r.addEventListener('change', ()=>{
        const useId = $('#use_id'), essId = $('#essential_id');
        const byId  = $('#login_type_id').checked;
        if (useId && essId) {
          useId.disabled = !byId;
          essId.disabled = !byId;
          if (!byId) { useId.checked = false; essId.checked = false; }
        }
        enableSave();
      });
    });
  
    // 저장 버튼 (폼 submit 막고 안내)
    $('#membershipForm')?.addEventListener('submit', (e)=>{
      e.preventDefault();
      CONFIG_MEMBERSHIP.toast('가입 설정이 저장되었습니다.');
      e.currentTarget.querySelector('#btnSave').disabled = true;
    });
  
    $('#groupGradeForm')?.addEventListener('submit', (e)=>{
      e.preventDefault();
      CONFIG_MEMBERSHIP.toast('그룹/등급 설정이 저장되었습니다.');
      e.currentTarget.querySelector('#btnSaveGroup').disabled = true;
    });
  
    // 그룹/등급 행 추가
    $('#btnAddGroup')?.addEventListener('click', ()=>{
      const tbody = $('#tblGroups tbody');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="text" class="form-control form-control-sm" name="group_name[]" placeholder="그룹명"></td>
        <td><div class="form-check m-0"><input class="form-check-input" type="radio" name="group_default"></div></td>
        <td>
          <select class="form-select form-select-sm" name="group_allow[]">
            <option value="auto" selected>자동승인</option>
            <option value="manual">관리자 승인</option>
            <option value="invite">초대 전용</option>
          </select>
        </td>
        <td><input type="text" class="form-control form-control-sm" name="group_desc[]" placeholder="설명(선택)"></td>
        <td class="text-end"><button type="button" class="btn btn-sm btn-light" title="삭제" onclick="CONFIG_MEMBERSHIP.removeRow(this)"><i class="ri-delete-bin-6-line"></i></button></td>
      `;
      tbody.appendChild(tr);
      enableSave();
    });
  
    $('#btnAddGrade')?.addEventListener('click', ()=>{
      const tbody = $('#tblGrades tbody');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="text" class="form-control form-control-sm" name="grade_name[]" placeholder="등급명"></td>
        <td>
          <select class="form-select form-select-sm" name="grade_rule[]">
            <option value="amount" selected>누적 구매액(원)</option>
            <option value="count">누적 구매 횟수(건)</option>
            <option value="point">포인트(점)</option>
          </select>
        </td>
        <td><input type="number" class="form-control form-control-sm" name="grade_value[]" value="0" min="0"></td>
        <td>
          <div class="row g-1">
            <div class="col-sm-4"><input type="number" class="form-control form-control-sm" name="benefit_discount[]" placeholder="할인 %" min="0" max="100"></div>
            <div class="col-sm-4"><input type="number" class="form-control form-control-sm" name="benefit_point[]" placeholder="적립 %" min="0" max="100"></div>
            <div class="col-sm-4">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" name="benefit_free_ship[]">
                <label class="form-check-label small">무료배송</label>
              </div>
            </div>
          </div>
        </td>
        <td class="text-end"><button type="button" class="btn btn-sm btn-light" title="삭제" onclick="CONFIG_MEMBERSHIP.removeRow(this)"><i class="ri-delete-bin-6-line"></i></button></td>
      `;
      tbody.appendChild(tr);
      enableSave();
    });
  
    // 전역 popover/tooltip (부트스트랩 준비 후)
    const initBs = () => {
      // tooltips
      document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el=>{
        try { new bootstrap.Tooltip(el); } catch(e){}
      });
      // popovers
      document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el=>{
        try { new bootstrap.Popover(el); } catch(e){}
      });
    };
    if (window.bootstrap) initBs();
    window.addEventListener('bootstrap:ready', initBs, { once:true });
  
    // 조작 시 저장 버튼 활성화
    document.addEventListener('input', enableSave);
    document.addEventListener('change', enableSave);
  
  })();
  
  // 노출용 API (페이지 내에서 호출)
  window.CONFIG_MEMBERSHIP = {
    showHiddenForm(key){
      const el = document.getElementById(key + '_hidden_form');
      if (el) el.classList.remove('d-none');
    },
    hideHiddenForm(key){
      const el = document.getElementById(key + '_hidden_form');
      if (el) el.classList.add('d-none');
    },
    saveHiddenForm(key){
      this.toast('설정을 반영했습니다.');
      this.hideHiddenForm(key);
    },
    resetDefaultText(btn, text){
      const input = btn?.parentElement?.querySelector('input[type="text"]');
      if (input) input.value = text || '';
    },
    openJoinTypeEditForm(type){
      this.toast((type==='business'?'사업자':'일반') + ' 유형 상세 설정은 서버 연동 후 확장합니다.');
    },
    openJoinFormAddForm(type){
      this.toast((type==='business'?'사업자':'일반') + ' 사용자 정의 항목 추가 UI는 커스텀 구현 대상입니다.');
    },
    openJoinTypeAddForm(){
      this.toast('새 유형 추가 UI는 커스텀 구현 대상입니다.');
    },
    removeRow(btn){
      const tr = btn.closest('tr');
      if (tr && confirm('이 항목을 삭제할까요?')) tr.remove();
    },
    toast(msg){
      if (!msg) return;
      if (window.AdminToast?.show) {
        window.AdminToast.show(msg);
        return;
      }
      try {
        // 간단 토스트
        const el = document.createElement('div');
        el.className = 'toast align-items-center text-bg-dark border-0 position-fixed bottom-0 end-0 m-3';
        el.role = 'alert';
        el.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
        document.body.appendChild(el);
        const t = new bootstrap.Toast(el,{delay:2000});
        t.show();
        el.addEventListener('hidden.bs.toast', ()=> el.remove());
      } catch(e) {
        alert(msg);
      }
    }
  };
  
