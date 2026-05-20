// /admin/assets/js/product-form.js
(function () {
    const toast = (message, type = 'success') => {
      if (window.AdminToast?.show) window.AdminToast.show(message, type);
      else alert(message);
    };

    // ---------- 이미지 업로드/드롭 ----------
    const dz = document.getElementById('imageDropzone');
    const input = document.getElementById('prodImages');
    const list = document.getElementById('imageList');
  
    function addFile(file) {
      if (!file || !file.type?.startsWith('image/')) return;
      const li = document.createElement('li');
      li.className = 'image-item';
      li.draggable = true;
  
      const img = document.createElement('img');
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'btn btn-sm btn-light remove';
      rm.innerHTML = '<i class="ri-close-line"></i>';
      rm.addEventListener('click', () => li.remove());
  
      li.addEventListener('dragstart', e => {
        li.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      li.addEventListener('dragend', () => li.classList.remove('dragging'));
      list?.addEventListener('dragover', e => {
        e.preventDefault();
        const dragging = list.querySelector('.dragging');
        if (!dragging) return;
        const after = [...list.querySelectorAll('.image-item:not(.dragging)')]
          .find(el => e.clientY <= el.getBoundingClientRect().top + el.offsetHeight / 2);
        after ? list.insertBefore(dragging, after) : list.appendChild(dragging);
      });
  
      const reader = new FileReader();
      reader.onload = e => { img.src = e.target.result; };
      reader.readAsDataURL(file);
  
      li.append(img, rm);
      list?.appendChild(li);
    }
  
    input?.addEventListener('change', e => [...e.target.files].forEach(addFile));
    ['dragenter', 'dragover'].forEach(ev =>
      dz?.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('drag'); })
    );
    ['dragleave', 'drop'].forEach(ev =>
      dz?.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('drag'); })
    );
    dz?.addEventListener('drop', e => { [...e.dataTransfer.files].forEach(addFile); });
  
  
    // ---------- Toast Editor 초기화 ----------
    let descEditor, mobileEditor;
  
    try {
        const descEl = document.querySelector('#descEditor');
        if (descEl) {
          descEditor = new toastui.Editor({
            el: descEl,
            height: '400px',
            initialEditType: 'wysiwyg',
            previewStyle: 'vertical'
          });
        }
      } catch (err) {
        console.error('❌ ToastEditor 초기화 실패(descEditor)', err);
      }
      
  
    try {
      mobileEditor = new toastui.Editor({
        el: document.querySelector('#mobileEditor'),
        height: '400px',
        initialEditType: 'wysiwyg',
        previewStyle: 'vertical'
      });
    } catch (err) {
      console.error('❌ ToastEditor 초기화 실패(mobileEditor)', err);
    }
  
    // 모바일 상세설명 토글
    const mobileWrap = document.getElementById('mobileDescWrap');
    document.querySelectorAll('input[name="mobile_desc_mode"]').forEach(r => {
      r.addEventListener('change', () => {
        const use = document.getElementById('mobileUse').checked;
        mobileWrap?.classList.toggle('d-none', !use);
      });
    });
  
  
    // ---------- 옵션 ----------
    const optUse = document.getElementById('optUse');
    const optWrap = document.getElementById('optWrap');
    const optType = document.getElementById('optType');
    const optTable = document.getElementById('optTable')?.querySelector('tbody');
    const optAddRow = document.getElementById('optAddRow');
  
    function refreshOptType() {
      const two = (optType?.value === 'double');
      document.querySelectorAll('.opt2-col').forEach(el => el.classList.toggle('d-none', !two));
      optTable?.querySelectorAll('tr').forEach(tr => {
        const td2 = tr.querySelector('[data-opt2]');
        if (td2) td2.classList.toggle('d-none', !two);
      });
    }
    function addOptRow() {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="text" class="form-control form-control-sm" name="option1[]"></td>
        <td data-opt2 class="opt2-col d-none"><input type="text" class="form-control form-control-sm" name="option2[]"></td>
        <td style="width:120px"><input type="number" class="form-control form-control-sm" name="option_extra[]" value="0" step="1"></td>
        <td style="width:120px"><input type="number" class="form-control form-control-sm" name="option_stock[]" value="0" step="1"></td>
        <td class="text-end" style="width:80px">
          <button type="button" class="btn btn-sm btn-light" data-row-del><i class="ri-close-line"></i></button>
        </td>
      `;
      optTable?.appendChild(tr);
      refreshOptType();
    }
  
    optUse?.addEventListener('change', () => optWrap?.classList.toggle('d-none', !optUse.checked));
    optType?.addEventListener('change', refreshOptType);
    optAddRow?.addEventListener('click', addOptRow);
    optTable?.addEventListener('click', (e) => {
      if (e.target.closest('[data-row-del]')) e.target.closest('tr')?.remove();
    });
  
  
    // ---------- 배송 ----------
    const shipMethod = document.getElementById('shipMethod');
    const shipFeeType = document.getElementById('shipFeeType');
  
    function refreshShipBoxes() {
      const method = shipMethod?.value || 'parcel';
      const showFee = !(method === 'none' || method === 'digital');
      document.getElementById('shipFeeBox')?.classList.toggle('d-none', !showFee);
  
      const type = shipFeeType?.value || 'free';
      document.querySelectorAll('[data-ship-fee]').forEach(el => {
        el.classList.toggle('d-none', el.getAttribute('data-ship-fee') !== type);
      });
    }
    shipMethod?.addEventListener('change', refreshShipBoxes);
    shipFeeType?.addEventListener('change', refreshShipBoxes);
    refreshShipBoxes();
  
  
    // ---------- 재고 ----------
    const stockUnlimited = document.getElementById('stockUnlimited');
    const stockBox = document.getElementById('stockBox');
    function refreshStockBox() {
      stockBox.style.display = stockUnlimited?.checked ? 'none' : '';
    }
    stockUnlimited?.addEventListener('change', refreshStockBox);
    refreshStockBox();
  
  
    // ---------- 제출 ----------
    function collectAndSubmit() {
      // 상세설명 / 모바일 상세설명 HTML 동기화
      const descHidden = document.getElementById('descHidden');
      const mobileHidden = document.getElementById('mobileHidden');
      const useMobile = document.getElementById('mobileUse')?.checked;
  
      if (descEditor && descHidden) descHidden.value = descEditor.getHTML();
      if (mobileEditor && mobileHidden && useMobile) {
        mobileHidden.value = mobileEditor.getHTML();
      } else if (mobileHidden) {
        mobileHidden.value = '';
      }
  
      // 서버 저장 연동 (FormData + fetch)
      toast('상품 정보가 저장되었습니다.');
    }
  
    document.getElementById('btnSubmit')?.addEventListener('click', collectAndSubmit);
    document.getElementById('btnSubmitBottom')?.addEventListener('click', collectAndSubmit);
    document.getElementById('btnDraftSave')?.addEventListener('click', () => toast('임시 저장되었습니다.'));
    document.getElementById('btnDeleteDraft')?.addEventListener('click', () => toast('임시 저장이 삭제되었습니다.'));
  
  })();
  
