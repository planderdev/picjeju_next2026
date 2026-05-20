/* /admin/assets/js/stat_traffic.js
 * 트래픽 통계 — /admin/stat/traffic/
 */
document.addEventListener('DOMContentLoaded', () => {
    const $ = (s, r=document) => r.querySelector(s);
  
    /* ------------------------------
     * 1️⃣ 시간대별 트래픽 (Bar)
     * ------------------------------ */
    const hourlyData = {
      labels: ['0시','2시','4시','6시','8시','10시','12시','14시','16시','18시','20시','22시'],
      values: [18, 14, 9, 20, 42, 67, 95, 102, 84, 76, 51, 33],
    };
  
    const ctx1 = $('#chartTrafficHourly');
    new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: hourlyData.labels,
        datasets: [{
          label: '방문수',
          data: hourlyData.values,
          backgroundColor: '#ff6633'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: false } }
      }
    });
  
    /* ------------------------------
     * 2️⃣ 디바이스별 트래픽 (Doughnut)
     * ------------------------------ */
    const deviceData = [
      { label: 'PC', value: 57, color: '#ff6633' },
      { label: '모바일', value: 38, color: '#198754' },
      { label: '태블릿', value: 5, color: '#ffc107' },
    ];
  
    const ctx2 = $('#chartTrafficDevice');
    new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: deviceData.map(d => d.label),
        datasets: [{
          data: deviceData.map(d => d.value),
          backgroundColor: deviceData.map(d => d.color)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: { legend: { display: false } }
      }
    });
  
    // 범례
    const legend = $('#deviceLegend');
    legend.innerHTML = deviceData.map(
      d => `<li><i class="ri-checkbox-blank-circle-fill me-1" style="color:${d.color}"></i>${d.label} — ${d.value}%</li>`
    ).join('');
  
    /* ------------------------------
     * 3️⃣ 브라우저/OS 테이블
     * ------------------------------ */
    const osData = [
      { rank:1, browser:'Chrome', os:'Windows', visits:134, ratio:41 },
      { rank:2, browser:'Safari', os:'iOS', visits:96, ratio:29 },
      { rank:3, browser:'Chrome', os:'Android', visits:62, ratio:19 },
      { rank:4, browser:'Edge', os:'Windows', visits:19, ratio:6 },
      { rank:5, browser:'기타', os:'기타', visits:12, ratio:5 },
    ];
    $('#tblTrafficOS').innerHTML = osData.map(
      d => `
      <tr>
        <td>${d.rank}</td>
        <td>${d.browser}</td>
        <td>${d.os}</td>
        <td>${d.visits}</td>
        <td class="text-end">${d.ratio}%</td>
      </tr>`
    ).join('');
  });
  
