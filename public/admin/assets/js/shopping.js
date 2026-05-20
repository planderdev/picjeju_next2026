/* /admin/assets/js/shopping.js
 * 매출 통계(데모) — 기간별/상품별/환경별 + 차트 + 가이드 모달
 * - 오늘 기준 최근 7일 라벨 자동
 * - Remix Icon 사용
 */
(function () {
    // 경로 가드: /stat/shopping, /stat/shopping/, /stat/shopping/index.php
    const path = location.pathname.replace(/\/+$/, '');
    if (!/\/stat\/shopping(?:\/index\.php)?$/.test(path)) return;
  
    const $  = (s, r=document) => r.querySelector(s);
    const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
    const fmt = (v) => (Number(v)||0).toLocaleString('ko-KR');
    const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
  
    // ===== 날짜/라벨 =====
    function lastNDaysLabels(n=7) {
      const out = [];
      const d = new Date();
      d.setHours(0,0,0,0);
      for (let i=n-1; i>=0; i--) {
        const t = new Date(d);
        t.setDate(d.getDate() - i);
        out.push(`${t.getMonth()+1}월 ${t.getDate()}일`);
      }
      return out;
    }
    function formatUpdatedKST(date=new Date()) {
      const y = date.getFullYear();
      const m = date.getMonth()+1;
      const d = date.getDate();
      let h = date.getHours();
      const ampm = (h<12) ? '오전' : '오후';
      h = (h%12)||12;
      return `${y}년 ${m}월 ${d}일 ${ampm} ${h}시까지의 데이터에요.`;
    }
    function formatRangeKST(days=6) {
      const end = new Date(); end.setHours(0,0,0,0);
      const start = new Date(end); start.setDate(end.getDate() - days);
      const to2 = (n)=>String(n).padStart(2,'0');
      return `${String(start.getFullYear()).slice(2)}.${to2(start.getMonth()+1)}.${to2(start.getDate())} ~ ${String(end.getFullYear()).slice(2)}.${to2(end.getMonth()+1)}.${to2(end.getDate())}`;
    }
  
    // ===== 데모 데이터 =====
    const labels = lastNDaysLabels(7);
    const demo = {
      chart: {
        sales:   [0,0,0,0,0,0,1310000], // 매출(결제-환불)
        refunds: [0,0,0,0,0,0,110000],  // 환불 금액
      },
      kpis: [
        { title:'주문건수',  value: 57,  delta:+12 },
        { title:'품목건수',  value: 132, delta:+8  },
        { title:'상품금액',  value: 1730000, delta:+6 },
        { title:'배송비',    value: 52000,   delta:+1 },
        { title:'할인금액',  value: 125000,  delta:-2 },
        { title:'결제금액',  value: 1652000, delta:+7 },
        { title:'환불금액',  value: 110000,  delta:+1 },
        { title:'매출',      value: 1542000, delta:+6 },
      ],
      topProducts: [
        { name:'쑥뜸 패치 10매', qty: 48, amount: 384000 },
        { name:'뜸기 세트 A',    qty: 23, amount: 575000 },
        { name:'쑥향 로션',      qty: 36, amount: 216000 },
      ],
      channels: [
        { label:'PC',       value:'952,000원 (62%)', pct: 62 },
        { label:'모바일웹', value:'423,000원 (28%)', pct: 28 },
        { label:'앱',       value:'168,000원 (10%)', pct: 10 },
      ],
      byProduct: [
        { name:'쑥뜸 패치 10매', avg:8000,  sold:48, cancels:2, rate:'4.2%', saleAmt:384000, cancelAmt:16000, net:368000 },
        { name:'뜸기 세트 A',    avg:25000, sold:23, cancels:1, rate:'4.3%', saleAmt:575000, cancelAmt:25000, net:550000 },
        { name:'쑥향 로션',      avg:6000,  sold:36, cancels:0, rate:'0%',   saleAmt:216000, cancelAmt:0,     net:216000 },
      ],
      byEnv: [
        { env:'PC',       paid: 952000, refund: 55000, revenue: 897000 },
        { env:'모바일웹', paid: 423000, refund: 35000, revenue: 388000 },
        { env:'앱',       paid: 168000, refund: 20000, revenue: 148000 },
      ]
    };
  
    // ===== 상단 텍스트/기간 =====
    const t1 = $('#shoppingUpdatedText'); if (t1) t1.textContent = formatUpdatedKST(new Date());
    const t2 = $('#shoppingRangeText');   if (t2) t2.textContent = formatRangeKST(6);
  
    // ===== KPI 주입 =====
    const kpiWrap = $('#shoppingKpiWrap');
    if (kpiWrap) {
      kpiWrap.innerHTML = demo.kpis.map(it=>{
        const up = typeof it.delta==='number' && it.delta>=0;
        const badge = (typeof it.delta==='number')
          ? `<span class="badge ${up?'text-bg-success':'text-bg-danger'} ms-2">${up?'▲':'▼'} ${Math.abs(it.delta)}%</span>`
          : '';
        return `
          <div class="col-6 col-xl-3">
            <div class="p-3 rounded-3 border bg-white h-100">
              <div class="text-body-secondary small mb-1">${it.title}</div>
              <div class="fw-semibold fs-5">${fmt(it.value)}${badge}</div>
            </div>
          </div>`;
      }).join('');
    }
  
    // ===== 차트 =====
    const canvas = $('#shoppingChart');
    if (canvas?.getContext && window.Chart) {
      // width:100% 보장
      canvas.style.width = '100%';
      const ctx = canvas.getContext('2d');
      if (canvas.__chartInstance?.destroy) canvas.__chartInstance.destroy();
  
      canvas.__chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: '매출',
              data: demo.chart.sales,
              tension: 0.25,
              borderWidth: 2,
              pointRadius: 3,
              fill: true,
              backgroundColor: 'rgba(94,206,255,0.25)',
              borderColor: 'rgba(26,109,255,1)',
              pointBackgroundColor: 'rgba(26,109,255,1)'
            },
            {
              label: '환불',
              data: demo.chart.refunds,
              tension: 0.25,
              borderWidth: 2,
              pointRadius: 3,
              fill: false,
              borderColor: 'rgba(193,231,255,1)',
              pointBackgroundColor: 'rgba(193,231,255,1)'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: true },
            tooltip: { callbacks: { label: c => ` ${fmt(c.parsed.y)}원` } }
          },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { callback: v=>`${fmt(v)}원` } }
          }
        }
      });
    }
  
    // ===== 많이 판매된 상품 =====
    const tbodyTopProducts = $('#tblTopProducts');
    if (tbodyTopProducts) {
      tbodyTopProducts.innerHTML = demo.topProducts.map(p=>`
        <tr>
          <td>${p.name}</td>
          <td class="text-end">${fmt(p.qty)}</td>
          <td class="text-end">${fmt(p.amount)}원</td>
        </tr>
      `).join('');
    }
  
    // ===== 채널(환경) 프로그레스 =====
    const channelBody = $('#channelBody');
    if (channelBody) {
      channelBody.innerHTML = demo.channels.map(ch=>`
        <div class="d-flex justify-content-between small">
          <span class="text-body-secondary">${ch.label}</span>
          <span class="text-muted">${ch.value}</span>
        </div>
        <div class="progress progress-thin my-1" style="height:6px;">
          <div class="progress-bar" role="progressbar" style="width:${clamp(ch.pct,0,100)}%"></div>
        </div>
      `).join('');
    }
  
    // ===== 상품별 표 =====
    const tblProductStats = $('#tblProductStats');
    if (tblProductStats) {
      tblProductStats.innerHTML = demo.byProduct.map(p=>`
        <tr>
          <td>${p.name}</td>
          <td class="text-end">${fmt(p.avg)}원</td>
          <td class="text-end">${fmt(p.sold)}</td>
          <td class="text-end">${fmt(p.cancels)}</td>
          <td class="text-end">${p.rate}</td>
          <td class="text-end">${fmt(p.saleAmt)}원</td>
          <td class="text-end">${fmt(p.cancelAmt)}원</td>
          <td class="text-end">${fmt(p.net)}원</td>
        </tr>
      `).join('');
    }
  
    // ===== 환경별 표 =====
    const tblEnvStats = $('#tblEnvStats');
    if (tblEnvStats) {
      tblEnvStats.innerHTML = demo.byEnv.map(e=>`
        <tr>
          <td>${e.env}</td>
          <td class="text-end">${fmt(e.paid)}원</td>
          <td class="text-end">${fmt(e.refund)}원</td>
          <td class="text-end">${fmt(e.revenue)}원</td>
        </tr>
      `).join('');
    }
  
    // ===== 탭 스위칭 =====
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
  
    // ===== 가이드 모달 =====
    const openBtn = $('#btnShoppingGuide');
    if (openBtn) {
      openBtn.addEventListener('click', ()=>{
        const el = document.getElementById('mdShoppingGuide');
        if (!el) return;
        const m = bootstrap.Modal.getOrCreateInstance(el);
        m.show();
      });
    }
  })();
  