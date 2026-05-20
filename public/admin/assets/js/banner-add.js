document.addEventListener('DOMContentLoaded', () => {
  
    const $ = (s, r=document)=>r.querySelector(s);
    const form = $('#bnForm');
    const preview = $('#bnPreview');
    const imageInput = $('#bnImage');
  
    let banners = JSON.parse(localStorage.getItem('ADMIN_BANNERS') || '[]');
  
    // 이미지 미리보기
    imageInput?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        preview.innerHTML = `<img src="${ev.target.result}" class="img-fluid rounded shadow-sm" style="max-width:480px;">`;
      };
      reader.readAsDataURL(file);
    });
  
    // 폼 제출
    form?.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());
      data.active = form.bnActive.checked;
  
      if (form.bnImage.files[0]) {
        data.image = URL.createObjectURL(form.bnImage.files[0]);
      }
  
      banners.push(data);
      localStorage.setItem('ADMIN_BANNERS', JSON.stringify(banners));
  
      alert('슬라이드가 등록되었습니다.');
      location.href = '/admin/banner/';
    });
  });
  