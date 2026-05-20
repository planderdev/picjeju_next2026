/* =======================
   SVG ICONS (전역 선언)
======================= */
const ICON_UP = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.97024 15.2931C2.56526 15.6837 2.56526 16.3167 2.97024 16.7072C3.37523 17.0977 4.03168 17.0977 4.43667 16.7072L11.9997 9.41423L19.5627 16.7072C19.9677 17.0977 20.6242 17.0977 21.0291 16.7072C21.4341 16.3167 21.4341 15.6837 21.0291 15.2931L12.7329 7.29314C12.3279 6.90261 11.6715 6.90261 11.2665 7.29314L2.97024 15.2931Z" fill="#222222"/>
</svg>`;

const ICON_DOWN = `
<svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M28.0394 11.6093C28.5793 11.0886 28.5793 10.2446 28.0394 9.7239C27.4994 9.2032 26.6241 9.2032 26.0841 9.7239L16.0001 19.4479L5.91604 9.7239C5.37606 9.2032 4.50079 9.2032 3.96081 9.7239C3.42083 10.2446 3.42083 11.0886 3.96081 11.6093L15.0225 22.276C15.5624 22.7967 16.4377 22.7967 16.9777 22.276L28.0394 11.6093Z" fill="#222222"/>
</svg>`;



/* =======================
   주문상품 접기/펼치기
======================= */
(function() {
    const toggleBtn = document.querySelector('.pj-u-order-items-toggle');
    const wrap = document.querySelector('.pj-u-order-items-wrap');

    if (!toggleBtn || !wrap) return;

    let opened = true;
    wrap.style.height = wrap.scrollHeight + 'px';
    toggleBtn.innerHTML = ICON_DOWN; // 초기: 닫힘 표시

    toggleBtn.addEventListener('click', () => {
        opened = !opened;

        if (!opened) {
            // 닫기
            wrap.style.height = wrap.scrollHeight + 'px';
            requestAnimationFrame(() => {
              wrap.style.height = '0px';
              wrap.style.opacity = '0';
              wrap.style.overflow = 'hidden';
            });
            toggleBtn.innerHTML = ICON_UP;
        } else {
            // 열기
            wrap.style.height = 'auto';
            const h = wrap.scrollHeight;
            wrap.style.height = '0px';
            wrap.style.opacity = '1';
            wrap.style.overflow = 'hidden';
            requestAnimationFrame(() => {
              wrap.style.height = h + 'px';
            });
            toggleBtn.innerHTML = ICON_DOWN;
        }
    });
})();


/* =======================
   포인트 전액사용
======================= */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.pj-u-order-point-all-btn');
  const input = document.querySelector('.pj-u-order-point-input');
  const available = document.querySelector('.js-point-available');

  if (!btn || !input || !available) return;

  btn.addEventListener('click', () => {
    const n = available.textContent.replace(/[^0-9]/g,'');
    input.value = n;
  });
});
