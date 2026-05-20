new Swiper('.store-hero-swiper',{
    loop:true,
    autoplay:{ delay:3500, disableOnInteraction:false },
    navigation:{
      nextEl:'.store-hero-swiper .swiper-button-next',
      prevEl:'.store-hero-swiper .swiper-button-prev'
    },
    pagination:{
      el:'.store-hero-swiper .fraction',
      type:'fraction'
    },
    speed:600
  });
  