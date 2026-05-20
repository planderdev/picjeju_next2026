/*
 * Mypage 1:1 inquiry image uploader and submit handling.
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#inquiryForm_jeju[data-inquiry-uploader]');
  if (!form) return;

  const fileInput = form.querySelector('.cmt-input');
  const grid = form.querySelector('.cmt-grid');
  const textarea = form.querySelector("textarea[name='content']");
  const titleInput = form.querySelector('#title_jeju');
  const agree = form.querySelector('#agree_jeju');
  const state = { items: [], maxFiles: 10, maxSize: 10 * 1024 * 1024 };

  if (!textarea || !titleInput || !agree) return;

  const clearFiles = () => {
    state.items.forEach(item => URL.revokeObjectURL(item.url));
    state.items = [];
  };

  const renderThumbs = () => {
    if (!grid) return;
    grid.innerHTML = '';
    state.items.forEach(({ id, url, file }) => {
      const div = document.createElement('div');
      div.className = 'thum-preview';
      div.innerHTML = `
        <div class="thumb pj-u-position-relative">
          <img src="${url}" alt="${file.name}">
          <button type="button" class="remove" data-apply-remove="${id}" aria-label="첨부 이미지 삭제"></button>
        </div>`;
      grid.appendChild(div);
    });
  };

  if (fileInput) {
    fileInput.addEventListener('change', event => {
      const files = Array.from(event.target.files || []);
      files.forEach(file => {
        if (state.items.length >= state.maxFiles || file.size > state.maxSize) return;
        const id = `f_${Math.random().toString(36).slice(2)}`;
        const url = URL.createObjectURL(file);
        state.items.push({ id, file, url });
      });
      renderThumbs();
      fileInput.value = '';
    });
  }

  form.addEventListener('click', event => {
    const button = event.target.closest('[data-apply-remove]');
    if (!button) return;
    const id = button.dataset.applyRemove;
    const index = state.items.findIndex(file => file.id === id);
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

    const content = textarea.value.trim();
    if (!content && state.items.length === 0) {
      textarea.focus();
      return;
    }

    const formData = new FormData();
    formData.append('title', titleInput.value.trim());
    formData.append('content', content);
    state.items.forEach(item => formData.append('files[]', item.file));

    try {
      const endpoint = form.dataset.endpoint || '/api/mypage/inquiry';
      const response = await fetch(endpoint, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);

      form.reset();
      clearFiles();
      renderThumbs();

      alert('문의가 등록되었습니다.');
    } catch (error) {
      console.warn(error);
      alert('전송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    }
  });
});
