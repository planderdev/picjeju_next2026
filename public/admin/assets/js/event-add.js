/* /admin/assets/js/event-add.js
 * 공연/이벤트 추가 — /admin/event/add.php
 */

document.addEventListener('DOMContentLoaded', () => {
  
    const $ = (s, r=document)=>r.querySelector(s);
    const KEY = 'ADMIN_EVENTS';
  
    /* ------------------------------
     * 로컬스토리지
     * ------------------------------ */
    function load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) return JSON.parse(raw);
      } catch(e) {}
      return [];
    }
    function save(arr) {
      localStorage.setItem(KEY, JSON.stringify(arr));
    }
  
    /* ------------------------------
     * 필드 매핑
     * ------------------------------ */
    const f = {
      category: $('#evCategory'),
      cardSize: $('#evCardSize'),
      title: $('#evTitle'),
      start: $('#evStart'),
      end: $('#evEnd'),
      venue: $('#evVenue'),
      contact: $('#evContact'),
      desc: $('#evDesc'),
      url: $('#evUrl'),
      ticket: $('#evTicketUrl'),
      tags: $('#evTags'),
      visible: $('#evVisible')
    };
  
    /* ------------------------------
     * 썸네일 미리보기
     * ------------------------------ */
    const thumbFile = $('#evThumbFile');
    const thumbPreview = $('#thumbPreview img');
    thumbFile?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        thumbPreview.src = ev.target.result;
        thumbPreview.parentElement.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  
    /* ------------------------------
     * 주소찾기
     * ------------------------------ */
    function openDaumPostcode() {
      if (typeof daum === 'undefined' || !daum.Postcode) {
        alert('주소검색 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      new daum.Postcode({
        oncomplete: function(data) {
          f.venue.value = data.address;
        }
      }).open();
    }
    $('#btnFindAddress')?.addEventListener('click', openDaumPostcode);
  
    /* ------------------------------
     * Toast 알림
     * ------------------------------ */
    function showToast(message, type='success') {
      document.querySelector('#liveToast')?.remove();
      const toastHTML = `
        <div class="toast align-items-center text-bg-${type} border-0 position-fixed top-0 end-0 m-3"
             id="liveToast" role="alert" aria-live="assertive" aria-atomic="true" style="z-index:9999;">
          <div class="d-flex">
            <div class="toast-body fw-semibold">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto"
                    data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
        </div>`;
      document.body.insertAdjacentHTML('beforeend', toastHTML);
      const toast = new bootstrap.Toast($('#liveToast'), { delay: 1800 });
      toast.show();
    }
  
    /* ------------------------------
     * 저장 버튼
     * ------------------------------ */
    $('#evForm')?.addEventListener('submit', e => {
      e.preventDefault();
  
      const dto = {
        id: crypto.randomUUID(),
        category: f.category.value.trim(),
        cardSize: f.cardSize.value.trim(),
        title: f.title.value.trim(),
        start: f.start.value,
        end: f.end.value,
        venue: f.venue.value.trim(),
        contact: f.contact.value.trim(),
        desc: f.desc.value.trim(),
        url: f.url.value.trim(),
        ticket: f.ticket.value.trim(),
        tags: f.tags.value.split(',').map(s => s.trim()).filter(Boolean),
        visible: !!f.visible.checked,
        updatedAt: new Date().toISOString()
      };
  
      const file = thumbFile?.files[0];
      if (file) dto.thumb = file.name;
  
      if (!dto.title || !dto.start || !dto.end) {
        alert('필수값(제목, 시작/종료일)을 입력해주세요.');
        return;
      }
  
      const arr = load();
      arr.push(dto);
      save(arr);
  
      showToast('이벤트가 저장되었습니다 ✅', 'primary');
      setTimeout(() => {
        location.href = (window.ADMIN_BASE_PATH || '/picjeju/admin') + '/event';
      }, 1800);
    });
  
    /* ------------------------------
     * 미리보기
     * ------------------------------ */
    $('#evPreview')?.addEventListener('click', () => {
      window.open('https://plandertest2.mycafe24.com/picjeju/pages/event-list.html', '_blank');
    });
  });
  