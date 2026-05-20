/* /admin/assets/js/analytics.js
 * 기간별 분석 (데모)
 * - 오늘 자 현황 카드 자동 생성
 * - 누적 데이터: 일별(이번 달 1일~오늘), 월별(최근 6개월) 표 자동 생성
 * - 탭 전환/새로고침/참고사항 모달
 */
(function () {
    const path = location.pathname.replace(/\/+$/, '');
    if (!/\/stat\/analytics(?:\/index\.php)?$/.test(path)) return;
  
    const $  = (s, r=document) => r.querySelector(s);
    const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
    const nf = new Intl.NumberFormat('ko-KR');
  
    const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const pct = (v) => `${v.toFixed(2)}%`;
  
    // ===== 오늘 자 현황(데모) =====
    function fillToday() {
      const orders    = rnd(0, 35);
      const revenue   = orders ? rnd(10_000, 80_000) * orders : 0;
      const aov       = orders ? Math.round(revenue / orders) : 0;
      const visitors  = rnd(50, 600);
      const signups   = rnd(0, Math.max(1, Math.round(visitors * 0.03)));
      const inquiries = rnd(0, 8);
  
      const set = (id, val) => { const el = $(id); if (el) el.textContent = nf.format(val); };
      set('#todayOrders', orders);
      set('#todayRevenue', revenue);
      set('#todayAOV', aov);
      set('#todayVisitors', visitors);
      set('#todaySignups', signups);
      set('#todayInquiries', inquiries);
    }
  
    // ===== 일별 데이터(이번 달 1일 ~ 오늘) =====
    function getMonthDates() {
      const today = new Date(); today.setHours(0,0,0,0);
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      const list = [];
      for (let d = new Date(first); d <= today; d.setDate(d.getDate()+1)) {
        list.push(new Date(d));
      }
      return list;
    }
  
    function fmtDateYYMMDD(d) {
      const yy = String(d.getFullYear()).slice(2);
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const dd = String(d.getDate()).padStart(2,'0');
      return `${yy}.${mm}.${dd}`;
    }
  
    function buildDailyRow(d) {
      // 데모 로직: 주말/평일 등 약간의 변주
      const isWeekend = [0,6].includes(d.getDay());
      const visitors  = isWeekend ? rnd(80, 400) : rnd(120, 700);
      const pageviews = Math.max(visitors * rnd(2,5), visitors);
      const orders    = Math.round(visitors * (isWeekend ? 0.025 : 0.02)) + rnd(0,2);
      const revenue   = orders ? orders * rnd(15_000, 55_000) : 0;
      const aov       = orders ? Math.round(revenue / orders) : 0;
      const conv      = visitors ? (orders / visitors) * 100 : 0;
  
      const signups   = rnd(0, Math.round(visitors * 0.03));
      const inquiries = rnd(0, 10);
      const reviews   = rnd(0, 7);
      const posts     = rnd(0, 6);
      const comments  = rnd(0, 10);
      const sms       = rnd(0, 5);
      const couponUse = rnd(0, orders);
      const rewardIn  = rnd(0, 50_000);
      const rewardOut = rnd(0, 40_000);
  
      return {
        date: fmtDateYYMMDD(d),
        orders, revenue, conv, pageviews, visitors, aov,
        signups, inquiries, reviews, posts, comments, sms, couponUse, rewardIn, rewardOut
      };
    }
  
    function renderDaily() {
      const tbody = $('#tbodyDaily');
      if (!tbody) return;
  
      const dates = getMonthDates();
      const rows  = dates.map(buildDailyRow);
  
      // 합계 행
      const sum = rows.reduce((acc, r) => {
        acc.orders    += r.orders;
        acc.revenue   += r.revenue;
        acc.pageviews += r.pageviews;
        acc.visitors  += r.visitors;
        acc.aov       += r.aov;        // 평균의 합(참고용), 실제 평균은 별도로 계산 가능
        acc.signups   += r.signups;
        acc.inquiries += r.inquiries;
        acc.reviews   += r.reviews;
        acc.posts     += r.posts;
        acc.comments  += r.comments;
        acc.sms       += r.sms;
        acc.couponUse += r.couponUse;
        acc.rewardIn  += r.rewardIn;
        acc.rewardOut += r.rewardOut;
        return acc;
      }, {
        orders:0, revenue:0, pageviews:0, visitors:0, aov:0,
        signups:0, inquiries:0, reviews:0, posts:0, comments:0, sms:0, couponUse:0, rewardIn:0, rewardOut:0
      });
  
      // 합계 행 먼저
      const totalConv = sum.visitors ? (sum.orders / sum.visitors) * 100 : 0;
      const totalAov  = sum.orders ? Math.round(sum.revenue / sum.orders) : 0;
  
      let html = `
        <tr class="table-secondary">
          <td><strong>합계</strong></td>
          <td class="text-end"><strong>${nf.format(sum.orders)}</strong></td>
          <td class="text-end"><strong>${nf.format(sum.revenue)}원</strong></td>
          <td class="text-end"><strong>${pct(totalConv)}</strong></td>
          <td class="text-end"><strong>${nf.format(sum.pageviews)}</strong></td>
          <td class="text-end"><strong>${nf.format(sum.visitors)}명</strong></td>
          <td class="text-end"><strong>${nf.format(totalAov)}원</strong></td>
          <td class="text-end"><strong>${nf.format(sum.signups)}명</strong></td>
          <td class="text-end"><strong>${nf.format(sum.inquiries)}</strong></td>
          <td class="text-end"><strong>${nf.format(sum.reviews)}</strong></td>
          <td class="text-end"><strong>${nf.format(sum.posts)}</strong></td>
          <td class="text-end"><strong>${nf.format(sum.comments)}</strong></td>
          <td class="text-end"><strong>${nf.format(sum.sms)}</strong></td>
          <td class="text-end"><strong>${nf.format(sum.couponUse)}</strong></td>
          <td class="text-end"><strong>${nf.format(sum.rewardIn)}원</strong></td>
          <td class="text-end"><strong>${nf.format(sum.rewardOut)}원</strong></td>
        </tr>
      `;
  
      // 일자 행 (최신일이 위로 오도록 역순 정렬은 원하면 바꿔도 됩니다)
      rows.reverse().forEach(r => {
        html += `
          <tr>
            <td>${r.date}</td>
            <td class="text-end">${nf.format(r.orders)}</td>
            <td class="text-end">${nf.format(r.revenue)}원</td>
            <td class="text-end">${pct(r.conv)}</td>
            <td class="text-end">${nf.format(r.pageviews)}</td>
            <td class="text-end">${nf.format(r.visitors)}명</td>
            <td class="text-end">${nf.format(r.aov)}원</td>
            <td class="text-end">${nf.format(r.signups)}명</td>
            <td class="text-end">${nf.format(r.inquiries)}</td>
            <td class="text-end">${nf.format(r.reviews)}</td>
            <td class="text-end">${nf.format(r.posts)}</td>
            <td class="text-end">${nf.format(r.comments)}</td>
            <td class="text-end">${nf.format(r.sms)}</td>
            <td class="text-end">${nf.format(r.couponUse)}</td>
            <td class="text-end">${nf.format(r.rewardIn)}원</td>
            <td class="text-end">${nf.format(r.rewardOut)}원</td>
          </tr>
        `;
      });
  
      tbody.innerHTML = html;
  
      // 연/월 표시 텍스트 (비활성 데모)
      const today = new Date();
      const year  = today.getFullYear();
      const month = today.getMonth()+1;
      const selYear = $('#selYearText'); if (selYear) selYear.textContent = `${year}년`;
      const selMonth= $('#selMonthText'); if (selMonth) selMonth.textContent= `${month}월`;
    }
  
    // ===== 월별 데이터(최근 6개월) =====
    function getLastMonths(n=6) {
      const base = new Date();
      base.setDate(1);
      const arr = [];
      for (let i=0; i<n; i++) {
        const d = new Date(base.getFullYear(), base.getMonth()-i, 1);
        arr.push(d);
      }
      return arr;
    }
    function fmtMonthYYYYMM(d) {
      return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}`;
    }
    function renderMonthly() {
      const tbody = $('#tbodyMonthly');
      if (!tbody) return;
  
      const months = getLastMonths(6);
      let html = '';
      months.forEach(d => {
        const visitors  = rnd(1500, 12000);
        const pageviews = visitors * rnd(2,5);
        const orders    = Math.round(visitors * rnd(15,30) / 100); // 15~30% * 0.1 (느슨)
        const revenue   = orders * rnd(18_000, 48_000);
        const aov       = orders ? Math.round(revenue / orders) : 0;
        const conv      = visitors ? (orders / visitors) * 100 : 0;
  
        const signups   = rnd(Math.round(visitors*0.01), Math.round(visitors*0.04));
        const inquiries = rnd(10, 120);
        const reviews   = rnd(8, 100);
        const posts     = rnd(5, 80);
        const comments  = rnd(20, 200);
        const sms       = rnd(0, 150);
        const couponUse = rnd(Math.round(orders*0.1), Math.round(orders*0.5));
        const rewardIn  = rnd(50_000, 500_000);
        const rewardOut = rnd(40_000, 400_000);
  
        html += `
          <tr>
            <td>${fmtMonthYYYYMM(d)}</td>
            <td class="text-end">${nf.format(orders)}</td>
            <td class="text-end">${nf.format(revenue)}원</td>
            <td class="text-end">${pct(conv)}</td>
            <td class="text-end">${nf.format(pageviews)}</td>
            <td class="text-end">${nf.format(visitors)}명</td>
            <td class="text-end">${nf.format(aov)}원</td>
            <td class="text-end">${nf.format(signups)}명</td>
            <td class="text-end">${nf.format(inquiries)}</td>
            <td class="text-end">${nf.format(reviews)}</td>
            <td class="text-end">${nf.format(posts)}</td>
            <td class="text-end">${nf.format(comments)}</td>
            <td class="text-end">${nf.format(sms)}</td>
            <td class="text-end">${nf.format(couponUse)}</td>
            <td class="text-end">${nf.format(rewardIn)}원</td>
            <td class="text-end">${nf.format(rewardOut)}원</td>
          </tr>
        `;
      });
  
      tbody.innerHTML = html;
    }
  
    // ===== 탭 전환 =====
    function bindTabs() {
      $$('.btn-group [data-target]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          $$('.btn-group [data-target]').forEach(b=>b.classList.remove('active'));
          btn.classList.add('active');
          const target = btn.getAttribute('data-target');
          $$('.tab-pane').forEach(p=>{
            if ('#'+p.id === target) { p.hidden = false; p.classList.add('active'); }
            else { p.hidden = true; p.classList.remove('active'); }
          });
        });
      });
    }
  
    // ===== 참고사항 모달 =====
    function bindNoteModal() {
      const btn = $('#btnNote');
      if (!btn) return;
      btn.addEventListener('click', ()=>{
        const el = document.getElementById('mdNote');
        if (!el) return;
        const m = bootstrap.Modal.getOrCreateInstance(el);
        m.show();
      });
    }
  
    // ===== 새로고침(데모 재생성) =====
    function bindRefresh() {
      const btn = $('#btnTodayRefresh');
      if (!btn) return;
      btn.addEventListener('click', ()=>{
        fillToday();
        renderDaily();
        // 월별은 그대로 두거나 재생성 원하면 다음 줄 주석 해제
        // renderMonthly();
      });
    }
  
    // ===== 초기 실행 =====
    fillToday();
    renderDaily();
    renderMonthly();
    bindTabs();
    bindNoteModal();
    bindRefresh();
  })();
  