// detail.js (통합/최종버전 — 조합형옵션 A + data-price + 합산 + 중복시 qty+1)
document.addEventListener('DOMContentLoaded', () => {

    const $  = (q,ctx=document)=>ctx.querySelector(q);
    const $$ = (q,ctx=document)=>[...ctx.querySelectorAll(q)];
  
    /* ------------------ 1) 옵션/수량/합계 (조합형) ------------------ */
    $$('.buybox-desktop, .buybox-mobile').forEach(box => {
  
      const optSelects   = $$('.buybox-options select', box);
      const selectedWrap = $('.buybox-selected', box);
      const totalEl      = $('.buybox-total .number', box);
      if (!optSelects.length || !selectedWrap || !totalEl) return;
  
      // 총합 재계산
      const recalcTotal = () => {
        let total = 0;
        $$('.selected-item .sum', selectedWrap).forEach(sumEl=>{
          total += parseInt(sumEl.textContent.replace(/[^0-9]/g,''))||0;
        });
        totalEl.textContent = total.toLocaleString() + '원';
      };
  
      // 동일 조합 찾기
      const findSameCombo = (label) =>
        $$('.selected-item .label', selectedWrap).find(l=>l.textContent===label)?.closest('.selected-item');
  
      // 행 추가
      const addSelectedRow = (label, price) => {
        const div = document.createElement('div');
        div.className='selected-item';
        div.innerHTML=`
          <div class="label">${label}</div>
          <button type="button" class="remove"></button>
          <div class="selected-bottom">
            <div class="qty-control">
              <button class="dec"></button>
              <input type="number" class="qty" value="1" min="1">
              <button class="inc"></button>
            </div>
            <div class="sum">${price.toLocaleString()}원</div>
          </div>`;
        selectedWrap.appendChild(div);
        recalcTotal();
      };
  
      // 옵션 선택 완료 이벤트
      optSelects.forEach(sel=>{
        sel.addEventListener('change',()=>{
          const vals = optSelects.map(s=>s.value).filter(v=>v && v!=='색상' && v!=='사이즈');
          if(vals.length===optSelects.length){
            // 조합 라벨
            const label = vals.join(' / ');
            // 가격 합산 (data-price 모두 더함)
            const price = optSelects.reduce((acc,s)=>{
              const o = s.options[s.selectedIndex];
              const p = parseInt(o.dataset.price)||0;
              return acc+p;
            },0);
  
            const same = findSameCombo(label);
            if(same){
              const qtyEl = same.querySelector('.qty');
              const sumEl = same.querySelector('.sum');
              let q = (parseInt(qtyEl.value)||1)+1;
              qtyEl.value = q;
              sumEl.textContent = (q*price).toLocaleString()+'원';
              recalcTotal();
            } else {
              addSelectedRow(label, price);
            }
            optSelects.forEach(s=>s.selectedIndex=0);
          }
        });
      });
  
      // 삭제/증감
      selectedWrap.addEventListener('click',e=>{
        const item = e.target.closest('.selected-item');
        if(!item)return;
        if(e.target.classList.contains('remove')){
          item.remove(); recalcTotal();return;
        }
        const label = item.querySelector('.label').textContent;
        const basePrice = optSelects.reduce((acc,_,i)=>{
          // label 분리로 price 재계산 (레이블은 동일조합이니 옵션조합 그대로)
          return acc; // 여기서는 이미 sum/qty 보유하므로 basePrice 필요 없음 (sum = qty*price 이미 반영)
        },0);
  
        const sumEl = item.querySelector('.sum');
        const qtyEl = item.querySelector('.qty');
        let pricePer = parseInt(sumEl.textContent.replace(/[^0-9]/g,'')) / (parseInt(qtyEl.value)||1);
  
        let q = parseInt(qtyEl.value)||1;
        if(e.target.classList.contains('dec') && q>1){ q--; }
        if(e.target.classList.contains('inc')){ q++; }
        qtyEl.value=q;
        sumEl.textContent=(q*pricePer).toLocaleString()+'원';
        recalcTotal();
      });
  
      // 직접입력
      selectedWrap.addEventListener('input',e=>{
        if(!e.target.classList.contains('qty'))return;
        let q = parseInt(e.target.value);
        if(isNaN(q)||q<1) q=1;
        e.target.value=q;
        const item = e.target.closest('.selected-item');
        const sumEl = item.querySelector('.sum');
        let pricePer = parseInt(sumEl.textContent.replace(/[^0-9]/g,'')) / (q||1);
        sumEl.textContent=(q*pricePer).toLocaleString()+'원';
        recalcTotal();
      });
  
    });
  
    /* -------------------- 2) Popover -------------------- */
    if(window.picjejuUI?.Popover){
      $$('[data-pj-toggle="popover"]').forEach(el=>new picjejuUI.Popover(el));
    }
  
    /* -------------------- 3) Swiper -------------------- */
    if(window.Swiper && $('#swiperMain')){
      const thumbs = $$('.thumb-grid img');
      const hi=(i)=>thumbs.forEach((img,idx)=>img.classList.toggle('active',idx===i));
      const ind = $('.page-indicator');
      const main = new Swiper('#swiperMain',{
        slidesPerView:1,
        loop:false,
        on:{
          init:sw=>{ if(ind) ind.textContent=`${sw.realIndex+1}/${sw.slides.length}`; hi(sw.realIndex); },
          slideChange:sw=>{ if(ind) ind.textContent=`${sw.realIndex+1}/${sw.slides.length}`; hi(sw.realIndex); }
        }
      });
      $('.thumb-grid')?.addEventListener('click',e=>{
        const img=e.target.closest('img[data-i]'); if(!img)return;
        const i=+img.dataset.i; main.slideTo(i); hi(i);
      });
    }
  
    /* -------------------- 4) 상세 펼치기 -------------------- */
    $('#detailBtn')?.addEventListener('click',()=>{
      $('#detailWrap')?.classList.add('open');
      $('#detailBtn').style.display='none';
    });
  
    /* -------------------- 5) 구매 버튼 이동 -------------------- */
    $$('.buybox-desktop .pj-button--buy').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const sheet=$('#buySheet');
        const offc=sheet?picjejuUI.Offcanvas.getInstance(sheet):null;
        if(offc){
          sheet.addEventListener('hidden.ui.offcanvas',function once(){
            sheet.removeEventListener('hidden.ui.offcanvas',once);
            location.href = window.picjejuPage
              ? window.picjejuPage('order.html')
              : 'order.html';
          });
          offc.hide();
        }else{
          location.href = window.picjejuPage
            ? window.picjejuPage('order.html')
            : 'order.html';
        }
      });
    });

    const toast = (message) => {
      if (window.picjejuToast) window.picjejuToast(message);
      else window.alert(message);
    };

    const copyToClipboard = async (text) => {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
      }

      const helper = document.createElement('textarea');
      helper.value = text;
      helper.setAttribute('readonly', '');
      helper.style.position = 'fixed';
      helper.style.left = '-9999px';
      helper.style.top = '0';
      document.body.appendChild(helper);
      helper.select();
      document.execCommand('copy');
      helper.remove();
    };

    const getShareData = () => {
      const url = new URL(window.location.href);
      url.hash = '';

      return {
        title: document.querySelector('.buybox-desktop .title, .buybox-mobile .title')?.textContent.trim() || document.title,
        text: '픽제주에서 이 상품을 확인해 보세요.',
        url: url.href
      };
    };

    Array.from(new Set($$('.buybox .share, [data-pj-share-product]'))).forEach(btn => {
      btn.addEventListener('click', async (event) => {
        event.preventDefault();

        const shareData = getShareData();

        try {
          if (navigator.share) {
            await navigator.share(shareData);
            return;
          }

          await copyToClipboard(shareData.url);
          toast('상품 링크가 복사되었습니다.');
        } catch (error) {
          if (error?.name === 'AbortError') return;

          try {
            await copyToClipboard(shareData.url);
            toast('상품 링크가 복사되었습니다.');
          } catch {
            toast('공유 링크를 복사하지 못했습니다.');
          }
        }
      });
    });
  
  });
  
