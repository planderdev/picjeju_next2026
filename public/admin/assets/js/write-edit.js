/* /admin/assets/js/board-edit.js
 * 게시물 수정 — /admin/content/board/edit.php
 */
document.addEventListener('DOMContentLoaded', () => {
  
    const $ = (s, r = document) => r.querySelector(s);
    const KEY = 'ADMIN_BOARD_POSTS';
  
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
  
    const BOARD_CATS = {
      '제주살이 뉴스': ['청년소식', '일자리', '지원사업', '행사안내'],
      '픽제주 장터': ['재능나눔/클래스', '나눔', '판매'],
      '픽포인트 거래소': ['구해요', '팔아요', '거래완료'],
    };
  
    // 게시판 선택 시 카테고리 반영
    f.name?.addEventListener('change', () => {
      const selected = f.name.value;
      const cats = BOARD_CATS[selected] || [];
      f.category.innerHTML =
        '<option value="">카테고리 선택</option>' +
        cats.map((c) => `<option value="${c}">${c}</option>`).join('');
    });
  
    // 로컬스토리지 로드
    const load = () => {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return [];
    };
    const save = (arr) => localStorage.setItem(KEY, JSON.stringify(arr));
  
    // 수정할 게시물 ID 파라미터
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
  
    let data = null;
    if (id) {
      data = load().find((p) => p.id === id);
    }
  
    // ✅ id가 없거나 데이터가 없으면 새 글 편집 모드로 전환
    if (!data) {
      console.warn('게시물을 찾을 수 없어 새 글로 초기화됩니다.');
      data = {
        board: '',
        category: '',
        title: '',
        start: '',
        end: '',
        venue: '',
        contact: '',
        desc: '',
        url: '',
        ticket: '',
        tags: [],
        notice: false,
        visible: true,
      };
    }
  
    // 썸네일 미리보기
    const thumbFile = $('#boardThumbFile');
    const thumbPreview = $('#thumbPreview img');
    if (data.thumb) {
      thumbPreview.src = data.thumb;
      thumbPreview.parentElement.style.display = 'block';
    }
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
  
    // Toast UI 에디터
    let editorInstance = null;
    try {
      editorInstance = new toastui.Editor({
        el: document.querySelector('#boardEditor'),
        height: '400px',
        initialEditType: 'wysiwyg',
        previewStyle: 'vertical',
        initialValue: data.desc || '',
      });
    } catch {
      $('#boardEditorFallback').classList.remove('d-none');
      $('#boardEditorFallback textarea').value = data.desc || '';
    }
   
    // 저장(수정 또는 새로 저장)
    $('#boardEditForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
  
      const arr = load();
      const idx = id ? arr.findIndex((p) => p.id === id) : -1;
  
      const dto = {
        ...data,
        id: id || Date.now().toString(),
        board: f.name.value,
        category: f.category.value,
        title: f.title.value,
        start: f.start.value,
        end: f.end.value,
        venue: f.venue.value,
        contact: f.contact.value,
        desc:
          editorInstance?.getHTML() ||
          $('#boardEditorFallback textarea')?.value.trim() ||
          '',
        url: f.url.value,
        ticket: f.ticket.value,
        tags: f.tags.value.split(',').map((s) => s.trim()).filter(Boolean),
        notice: f.notice.checked,
        visible: f.visible.checked,
        updatedAt: new Date().toISOString(),
      };
  
      const file = thumbFile?.files[0];
      if (file) dto.thumb = thumbPreview.src;
  
      if (idx >= 0) arr[idx] = dto;
      else arr.push(dto);
      save(arr);
  
      alert('저장되었습니다 ✅');
      setTimeout(() => {
        location.href =
          (window.ADMIN_BASE_PATH || '/picjeju/admin') + '/content/write';
      }, 1000);
    });
  });
  // =============================
// 미리보기 버튼 이동
// =============================
document.querySelector('#boardPreview')?.addEventListener('click', (e) => {
    e.preventDefault();
    // 미리보기 페이지로 이동
    window.open('https://plandertest2.mycafe24.com/picjeju/pages/board-view', '_blank');
  });
  
