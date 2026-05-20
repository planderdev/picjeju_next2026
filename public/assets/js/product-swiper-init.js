document.addEventListener("DOMContentLoaded", function () {

    const productSwipers = document.querySelectorAll('.product-swiper');
  
    productSwipers.forEach((wrap, idx) => {
      new Swiper(wrap, {
        loop: false,
        slidesPerView: 2,
        spaceBetween: 16,
        speed: 500,
  
        pagination: {
          el: wrap.querySelector('.swiper-pagination'),
          clickable: true,
        },
  
        breakpoints: {
          576: { slidesPerView: 3, spaceBetween: 18 },
          768: { slidesPerView: 3, spaceBetween: 20 },
          1200:{ slidesPerView: 4, spaceBetween: 40 },
        },
  
        autoplay: false,
      });
    });
  
  });
  