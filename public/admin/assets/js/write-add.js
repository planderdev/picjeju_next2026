/* /admin/assets/js/board-add.js
 * 새 게시물 작성 — /admin/content/board/add.php
 */
document.addEventListener('DOMContentLoaded', () => {
  
    const $ = (s, r = document) => r.querySelector(s);
    const KEY = 'ADMIN_BOARD_POSTS';
  
    /* ------------------------------
     * 로컬스토리지
     * ------------------------------ */
    const load = () => {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return [];
    };
    const save = (arr) => localStorage.setItem(KEY, JSON.stringify(arr));
  
    /* ------------------------------
     * 필드 매핑
     * ------------------------------ */
    const f = {
      name: $('#boardName'),
      category: $('#boardCategory'),
      title: $('#boardTitle'),
      start: $('#boardStart'),
      end: $('#boardEnd'),
      venue: $('#boardVenue'),
      contact: $('#boardContact'),
      url: $('#boardUrl'),
      ticket: $('#boardTicketUrl'),
      tags: $('#boardTags'),
      notice: $('#boardNotice'),
      visible: $('#boardVisible'),
    };
  
    /* ------------------------------
     * 게시판별 카테고리 목록
     * ------------------------------ */
    const BOARD_CATS = {
      '제주살이 뉴스': ['청년소식', '일자리', '지원사업', '행사안내'],
      '픽제주 장터': ['재능나눔/클래스', '나눔', '판매'],
      '픽포인트 거래소': ['구해요', '팔아요', '거래완료'],
    };
  
    f.name?.addEventListener('change', () => {
      const selected = f.name.value;
      const cats = BOARD_CATS[selected] || [];
      f.category.innerHTML = cats.length
        ? cats.map((c) => `<option value="${c}">${c}</option>`).join('')
        : '<option value="">선택하세요</option>';
    });
  
    /* ------------------------------
     * 썸네일 미리보기
     * ------------------------------ */
    const thumbFile = $('#boardThumbFile');
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
     * 주소찾기 (다음 우편번호)
     * ------------------------------ */
    function openDaumPostcode() {
      if (typeof daum === 'undefined' || !daum.Postcode) {
        alert('주소검색 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      new daum.Postcode({
        oncomplete: function (data) {
          f.venue.value = data.address;
        },
      }).open();
    }
    $('#btnFindAddress')?.addEventListener('click', openDaumPostcode);
  
    /* ------------------------------
     * Toast UI Editor 초기화
     * ------------------------------ */
    const editorEl = document.querySelector('#boardEditor');
    const fallback = document.querySelector('#boardEditorFallback');
    let editorInstance = null;
  
    try {
      editorInstance = new toastui.Editor({
        el: editorEl,
        height: '400px',
        initialEditType: 'wysiwyg',
        previewStyle: 'vertical',
        placeholder: '',
      });
    } catch (err) {
      console.warn('에디터 로딩 실패 → 폴백 textarea 사용');
      fallback?.classList.remove('d-none');
    }
  
    /* ------------------------------
     * 저장 버튼
     * ------------------------------ */
    $('#boardForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
  
      const dto = {
        id: crypto.randomUUID(),
        board: f.name.value.trim(),
        category: f.category.value.trim(),
        title: f.title.value.trim(),
        start: f.start.value,
        end: f.end.value,
        venue: f.venue.value.trim(),
        contact: f.contact.value.trim(),
        desc:
          editorInstance?.getHTML() ||
          $('#boardEditorFallback textarea')?.value.trim() ||
          '',
        url: f.url.value.trim(),
        ticket: f.ticket.value.trim(),
        tags: f.tags.value.split(',').map((s) => s.trim()).filter(Boolean),
        notice: !!f.notice.checked,
        visible: !!f.visible.checked,
        updatedAt: new Date().toISOString(),
      };
  
      if (!dto.board || !dto.category || !dto.title || !dto.start || !dto.end) {
        alert('필수값(게시판, 카테고리, 제목, 시작/종료일)을 입력해주세요.');
        return;
      }
  
      const arr = load();
      arr.push(dto);
      save(arr);
  
      alert('게시물이 저장되었습니다 ✅');
      setTimeout(() => {
        location.href = (window.ADMIN_BASE_PATH || '/picjeju/admin') + '/content/write';
      }, 1500);
    });
  
    /* ------------------------------
     * 미리보기
     * ------------------------------ */
    $('#boardPreview')?.addEventListener('click', () => {
      window.open('https://plandertest2.mycafe24.com/picjeju/pages/board-view', '_blank');
    });
  });
  
