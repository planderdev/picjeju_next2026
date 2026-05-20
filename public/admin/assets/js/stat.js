/* /admin/assets/js/stat.js */
(function () {
    // ✅ 트레일링 슬래시 제거 후 검사
    const path = location.pathname.replace(/\/+$/, '');
    if (!/\/stat(?:\/index\.php)?$/.test(path)) return;
  
    const $ = (s, r = document) => r.querySelector(s);
  
    // ====== 차트 데이터 (데모) ======
    const lineChartData = {
      labels: ['12월 17일','12월 18일','12월 19일','12월 20일','12월 21일','12월 22일','12월 23일'],
      datasets: [
        {
          label: '페이지뷰',
          data: [0,0,0,0,0,0,13],
          borderWidth: 2,
          tension: .3,
          fill: true,
          backgroundColor: 'rgba(193,231,255,0.7)',
          borderColor: 'rgba(193,231,255,1)',
          pointBackgroundColor: 'rgba(193,231,255,1)',
          pointBorderColor: '#fff'
        },
        {
          label: '방문자',
          data: [0,0,0,0,0,0,2],
          borderWidth: 2,
          tension: .3,
          fill: true,
          backgroundColor: 'rgba(94,206,255,0.3)',
          borderColor: 'rgba(94,206,255,1)',
          pointBackgroundColor: 'rgba(26,109,255,1)',
          pointBorderColor: '#fff'
        }
      ]
    };
  
    // ====== 외부툴팁: body/fixed (레이아웃 영향 없음) ======
    function getOrCreateTooltipEl() {
      let el = document.getElementById('chartjs-tooltip');
      if (!el) {
        el = document.createElement('div');
        el.id = 'chartjs-tooltip';
        Object.assign(el.style, {
          position: 'fixed',
          opacity: '0',
          pointerEvents: 'none',
          background: '#fff',
          border: '1px solid rgba(0,0,0,.1)',
          padding: '8px 10px',
          borderRadius: '6px',
          boxShadow: '0 2px 12px rgba(0,0,0,.08)',
          zIndex: '9999'
        });
        document.body.appendChild(el);
      }
      return el;
    }
  
    const externalTooltip = (context) => {
      const {chart, tooltip} = context;
      const el = getOrCreateTooltipEl();
  
      if (tooltip.opacity === 0) {
        el.style.opacity = '0';
        return;
      }
  
      let inner = '';
      if (tooltip.dataPoints) {
        const pts = [...tooltip.dataPoints].reverse();
        pts.forEach(dp => {
          const color = dp.dataset.borderColor || dp.dataset.backgroundColor;
          inner += `
            <div style="display:flex;align-items:center;gap:8px;margin:2px 0;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${color}"></span>
              <span>${dp.formattedValue}</span>
            </div>`;
        });
      }
      el.innerHTML = inner;
  
      // 뷰포트 기준 위치
      const rect = chart.canvas.getBoundingClientRect();
      el.style.opacity = '1';
      el.style.left = `${rect.left + (tooltip.caretX ?? 0)}px`;
      el.style.top  = `${rect.top  + (tooltip.caretY ?? 0)}px`;
      el.style.font = tooltip.options.bodyFont?.string || '12px/1.4 system-ui, sans-serif';
    };
  
    // ====== 차트 렌더 ======
    const ctx = $('#chart1');
    if (ctx && window.Chart) {
      if (ctx.__chartInstance && typeof ctx.__chartInstance.destroy === 'function') {
        ctx.__chartInstance.destroy();
      }
      ctx.__chartInstance = new Chart(ctx, {
        type: 'line',
        data: lineChartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: false,
              external: externalTooltip
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { precision: 0 } }
          }
        }
      });
    }
  
    // ====== 표/프로그레스/모달 데모 (필요 시 유지) ======
    const referrers = [
      {domain:'google.com', clicks: 124},
      {domain:'naver.com',  clicks: 77},
      {domain:'daum.net',   clicks: 51},
      {domain:'facebook.com', clicks: 22},
    ];
    const keywords = [
      {q:'진영감 쑥뜸', clicks: 41},
      {q:'쑥뜸 효과', clicks: 19},
      {q:'쑥뜸 후기', clicks: 12},
    ];
    const topPages = [
      {title:'홈', url:'/', views: 310},
      {title:'소개', url:'/about', views: 121},
      {title:'블로그 글', url:'/post/hello', views: 88},
    ];
    const traffic = [
      {label:'어제',       value:'1.03M(0.2%)',  pct:0.2},
      {label:'2025-09-16', value:'5.92K(0%)',    pct:0},
      {label:'2024-12-23', value:'21.11M(4.12%)',pct:4.12},
      {label:'2024-05-20', value:'7.54M(1.47%)', pct:1.47},
    ];
  
    const tbodyRef = $('#tblReferrers');
    const tbodyKey = $('#tblKeywords');
    const tbodyTop = $('#tblTopPages');
    const trafficBox = $('#trafficBody');
  
    if (tbodyRef) {
      tbodyRef.innerHTML = referrers.map(r => `
        <tr><td>${r.domain}</td><td class="text-end">${r.clicks.toLocaleString('ko-KR')}</td></tr>
      `).join('');
    }
    if (tbodyKey) {
      tbodyKey.innerHTML = keywords.map(k => `
        <tr><td>${k.q}</td><td class="text-end">${k.clicks.toLocaleString('ko-KR')}</td></tr>
      `).join('');
    }
    if (tbodyTop) {
      tbodyTop.innerHTML = topPages.map(p => `
        <tr>
          <td>${p.title}</td>
          <td class="text-truncate" style="max-width:260px;"><code>${p.url}</code></td>
          <td class="text-end">${p.views.toLocaleString('ko-KR')}</td>
        </tr>
      `).join('');
    }
    if (trafficBox) {
      trafficBox.innerHTML = traffic.map(t => `
        <div class="d-flex justify-content-between small">
          <span class="text-body-secondary">${t.label}</span>
          <span class="text-muted">${t.value}</span>
        </div>
        <div class="progress progress-thin my-1" style="height:6px;">
          <div class="progress-bar" role="progressbar" style="width:${t.pct}%"></div>
        </div>
      `).join('');
    }
  
    const btnDemo = $('#btnDemo');
    if (btnDemo && window.bootstrap) {
      btnDemo.addEventListener('click', () => {
        const el = document.getElementById('mdDemo');
        if (!el) return;
        const m = bootstrap.Modal.getOrCreateInstance(el);
        m.show();
      });
    }
  })();
  