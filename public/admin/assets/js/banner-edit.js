document.addEventListener('DOMContentLoaded', () => {
    const $ = (s, r=document)=>r.querySelector(s);
    const qs = new URLSearchParams(location.search);
    const idx = parseInt(qs.get('index'), 10);
    const form = $('#bnForm');
    const preview = $('#bnPreview');
    const imageInput = $('#bnImage');
  
    let banners = JSON.parse(localStorage.getItem('ADMIN_BANNERS') || '[]');
    let data = banners[idx] || {};
  
    // 폼 채우기
    if (Object.keys(data).length) {
      form.position.value = data.position || 'main';
      form.order.value = data.order || '';
      form.title.value = data.title || '';
      form.link.value = data.link || '';
      form.start_at.value = data.start_at || '';
      form.end_at.value = data.end_at || '';
      form.bnActive.checked = !!data.active;
      if (data.image) preview.innerHTML = `<img src="${data.image}" class="img-fluid rounded shadow-sm" style="max-width:480px;">`;
    }
  
    // 이미지 변경 시 미리보기
    imageInput?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        preview.innerHTML = `<img src="${ev.target.result}" class="img-fluid rounded shadow-sm" style="max-width:480px;">`;
      };
      reader.readAsDataURL(file);
    });
  
    // 저장
    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      const updated = Object.fromEntries(fd.entries());
      updated.active = form.bnActive.checked;
  
      if (form.bnImage.files[0]) {
        updated.image = URL.createObjectURL(form.bnImage.files[0]);
      } else {
        updated.image = data.image;
      }
  
      banners[idx] = updated;
      localStorage.setItem('ADMIN_BANNERS', JSON.stringify(banners));
      alert('수정이 완료되었습니다.');
      location.href = '/admin/banner/';
    });
  });
  