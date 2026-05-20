/* /admin/assets/js/config.default.js
 * 환경설정 > 일반 (데모)
 * - 파일 업로드: 미리보기/삭제, hidden 값 세팅
 * - 국가 변경: 주소 포맷 전환
 * - 폼 변경 감지: 저장 버튼 활성화
 * - 저장: 데모로 직렬화하여 성공 알림 (백엔드 연동 시 저장 함수 교체)
 */
(function () {
    const path = location.pathname.replace(/\/+$/, '');
    if (!/\/config\/default(?:\/index\.php)?$/.test(path)) return;
  
    // ===== util =====
    const $  = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const show = (el) => el.classList.remove('d-none');
    const hide = (el) => el.classList.add('d-none');
    const emptyImageSrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    const toast = (message, type = 'success') => {
      if (window.AdminToast?.show) window.AdminToast.show(message, type);
      else alert(message);
    };
  
    // popover init
    $$('[data-bs-toggle="popover"]').forEach(el => new bootstrap.Popover(el));
  
    // ===== address switcher =====
    const countrySel = $('#country');
    const addrBlocks = {
      KR: $('._addr_kr'),
      JP: $('._addr_jp'),
      TW: $('._addr_tw'),
      HK: $('._addr_hk'),
      VN: $('._addr_vn'),
      OTHER: $('._addr_other')
    };
    function switchAddress(country) {
      Object.values(addrBlocks).forEach(el => el && el.classList.add('d-none'));
      (addrBlocks[country] || addrBlocks.OTHER).classList.remove('d-none');
    }
    countrySel?.addEventListener('change', () => {
      switchAddress(countrySel.value);
      markDirty();
    });
    switchAddress(countrySel?.value || 'KR');
  
    // ===== file upload helpers =====
    function bindImageUpload({wrapId, imgId, delId, hiddenUrlId, hiddenIdxId}) {
      const wrap = $(wrapId);
      const fileInput = wrap?.querySelector('input[type=file]');
      const img = $(imgId);
      const delBtn = $(delId);
      const hiddenUrl = $(hiddenUrlId);
      const hiddenIdx = hiddenIdxId ? $(hiddenIdxId) : null;
  
      if (!wrap || !fileInput || !img || !delBtn || !hiddenUrl) return;
  
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
  
        // 미리보기
        const url = URL.createObjectURL(file);
        img.src = url;
        show(img); show(delBtn);
  
        // hidden 값 (데모: dataURL 저장)
        const dataUrl = await fileToDataURL(file);
        hiddenUrl.value = dataUrl;
        if (hiddenIdx) hiddenIdx.value = Date.now().toString(36); // 데모용 임시 idx
        markDirty();
  
        // 실제 서비스에서는 여기서 업로드 요청 후
        //  - hiddenUrl.value = 업로드된 파일의 URL
        //  - hiddenIdx.value = 서버에서 받은 temp_idx
        // 로 치환하세요.
      });
  
      delBtn.addEventListener('click', () => {
        img.src = emptyImageSrc;
        hide(img); hide(delBtn);
        fileInput.value = '';
        hiddenUrl.value = '';
        if (hiddenIdx) hiddenIdx.value = '';
        markDirty();
      });
    }
  
    function fileToDataURL(file) {
      return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
    }
  
    // favicon png
    bindImageUpload({
      wrapId:'#favicon_png_file_upload',
      imgId:'#favicon_png_img',
      delId:'#favicon_png_img_delete',
      hiddenUrlId:'#favicon_png_url',
      hiddenIdxId:'#favicon_png_tmp_idx'
    });
    // favicon ico
    bindImageUpload({
      wrapId:'#favicon_ico_file_upload',
      imgId:'#favicon_img',
      delId:'#favicon_img_delete',
      hiddenUrlId:'#favicon_url',
      hiddenIdxId:'#favicon_tmp_idx'
    });
    // main og image
    bindImageUpload({
      wrapId:'#main_png_file_upload',
      imgId:'#main_png_img',
      delId:'#main_png_img_delete',
      hiddenUrlId:'#main_png_url',
      hiddenIdxId:'#main_png_tmp_idx'
    });
    // private(close) image
    bindImageUpload({
      wrapId:'#close_file_upload',
      imgId:'#close_img',
      delId:'#close_img_delete',
      hiddenUrlId:'#close_url',
      hiddenIdxId:'#close_tmp_idx'
    });
  
    // ===== form dirty / save =====
    const form = $('#cfgForm');
    const btnSave = $('#btnSave');
    let dirty = false;
  
    function markDirty() {
      if (!dirty) {
        dirty = true;
        btnSave.removeAttribute('disabled');
      }
    }
  
    // 모든 입력 변화 감지
    form?.addEventListener('input', markDirty);
    form?.addEventListener('change', markDirty);
  
    // 저장 (데모)
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }
  
      const data = Object.fromEntries(new FormData(form).entries());
  
      // 실제 저장 요청으로 교체
      // await fetch('/api/config/default/save', {method:'POST', body: JSON.stringify(data)})
  
      toast('일반 설정이 저장되었습니다.', 'success');
  
      dirty = false;
      btnSave.setAttribute('disabled','disabled');
    });
  
    // 도움말
    $('#btnHelp')?.addEventListener('click', ()=>{
      bootstrap.Modal.getOrCreateInstance($('#mdHelp')).show();
    });
  
    function showAlert(type, msg){
      toast(msg, type);
    }
  })();
  
