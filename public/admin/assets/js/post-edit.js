/* /admin/assets/js/post-edit.js
 * 포스트 수정 — Toast UI Editor + 삭제 버튼 (프론트 시연용)
 */

document.addEventListener('DOMContentLoaded', () => {
  
    const $ = (s, r = document) => r.querySelector(s);
  
    /* ------------------------------
     * 썸네일 미리보기
     * ------------------------------ */
    const thumbFile = $('#postThumbFile');
    const thumbPreview = $('#thumbPreview img');
    thumbFile?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        thumbPreview.src = ev.target.result;
        thumbPreview.parentElement.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  
    /* ------------------------------
     * 주소찾기 (Daum 우편번호)
     * ------------------------------ */
    function openDaumPostcode() {
      if (typeof daum === 'undefined' || !daum.Postcode) {
        alert('주소검색 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      new daum.Postcode({
        oncomplete: function (data) {
          $('#postVenue').value = data.address;
        },
      }).open();
    }
    $('#btnFindAddress')?.addEventListener('click', openDaumPostcode);
  
    /* ------------------------------
     * Toast UI Editor 초기화
     * ------------------------------ */
    const editorEl = $('#postEditor');
    const fallback = $('#postEditorFallback');
    let editor = null;
  
    try {
      editor = new toastui.Editor({
        el: editorEl,
        height: '400px',
        initialEditType: 'wysiwyg',
        previewStyle: 'vertical',
        initialValue: fallback?.querySelector('textarea')?.value || '',
      });
      fallback.classList.add('d-none');
    } catch (err) {
      console.warn('에디터 로딩 실패 → 폴백 textarea 사용');
      fallback.classList.remove('d-none');
    }
  
    /* ------------------------------
     * 미리보기
     * ------------------------------ */
    $('#postPreview')?.addEventListener('click', () => {
      window.open('https://plandertest2.mycafe24.com/picjeju/pages/single-view', '_blank');
    });
  
    /* ------------------------------
     * 수정하기
     * ------------------------------ */
    $('#postEditForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
  
      const data = {
        category: $('#postCategory').value,
        cardSize: $('#postCardSize').value,
        title: $('#postTitle').value,
        start: $('#postStart').value,
        end: $('#postEnd').value,
        venue: $('#postVenue').value,
        contact: $('#postContact').value,
        url: $('#postUrl').value,
        ticket: $('#postTicketUrl').value,
        tags: $('#postTags').value,
        visible: $('#postVisible').checked,
        desc: editor ? editor.getHTML() : fallback.querySelector('textarea')?.value || '',
      };
  
      alert('포스트가 수정되었습니다 ✅');
      location.href = (window.ADMIN_BASE_PATH || '/picjeju/admin') + '/content/post';
    });
  
    /* ------------------------------
     * 삭제하기
     * ------------------------------ */
    $('#postDelete')?.addEventListener('click', () => {
      if (confirm('정말 이 포스트를 삭제하시겠습니까?')) {
        alert('삭제가 완료되었습니다 🗑️');
        location.href = (window.ADMIN_BASE_PATH || '/picjeju/admin') + '/content/post';
      }
    });
  });
  