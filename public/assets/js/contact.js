/*
 * Support form image uploader and submit handling.
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#promoForm_jeju[data-apply-uploader]');
  if (!form) return;

  const input = form.querySelector('.cmt-input');
  const grid = form.querySelector('.cmt-grid');
  const textarea = form.querySelector('textarea[name="content"]');
  const agree = form.querySelector('#agree_jeju');
  const state = { items: [], maxFiles: 10, maxSize: 10 * 1024 * 1024 };

  if (!textarea || !agree) return;

  const getValue = id => {
    const el = form.querySelector(`#${id}`);
    return el ? (el.value || '').trim() : '';
  };

  const clearFiles = () => {
    state.items.forEach(item => URL.revokeObjectURL(item.url));
    state.items = [];
  };

  const renderThumbs = () => {
    if (!grid) return;
    grid.innerHTML = '';
    state.items.forEach(({ id, file, url }) => {
      const col = document.createElement('div');
      col.className = 'thum-preview';
      col.innerHTML = `
        <div class="thumb pj-u-position-relative">
          <img src="${url}" alt="${file.name}">
          <button type="button" class="remove" data-apply-remove="${id}" aria-label="첨부 이미지 삭제"></button>
        </div>`;
      grid.appendChild(col);
    });
  };

  if (input) {
    input.addEventListener('change', event => {
      const files = Array.from(event.target.files || []);
      files.forEach(file => {
        if (state.items.length >= state.maxFiles || file.size > state.maxSize) return;
        const id = `f_${Math.random().toString(36).slice(2)}`;
        const url = URL.createObjectURL(file);
        state.items.push({ id, file, url });
      });
      renderThumbs();
      input.value = '';
    });
  }

  form.addEventListener('click', event => {
    const button = event.target.closest('[data-apply-remove]');
    if (!button) return;
    const id = button.getAttribute('data-apply-remove');
    const index = state.items.findIndex(item => item.id === id);
    if (index < 0) return;
    URL.revokeObjectURL(state.items[index].url);
    state.items.splice(index, 1);
    renderThumbs();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();

    if (!agree.checked) {
      alert('개인정보 수집 및 이용에 동의해 주세요.');
      return;
    }

    const content = (textarea.value || '').trim();
    if (!content && state.items.length === 0) {
      textarea.focus();
      return;
    }

    const formData = new FormData();
    formData.append('name', getValue('userName_jeju'));
    formData.append('phone', getValue('userPhone_jeju'));
    formData.append('email', getValue('userEmail_jeju'));
    formData.append('company', getValue('companyName_jeju'));
    formData.append('title', getValue('title_jeju'));
    formData.append('content', content);
    state.items.forEach(item => formData.append('files[]', item.file));

    try {
      const endpoint = form.dataset.endpoint || '/api/promo/submit';
      const response = await fetch(endpoint, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);

      textarea.value = '';
      agree.checked = false;
      clearFiles();
      renderThumbs();
      form.reset();

      alert('문의 작성이 완료되었습니다.');
    } catch (error) {
      console.warn(error);
      alert('문의 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    }
  });
});
