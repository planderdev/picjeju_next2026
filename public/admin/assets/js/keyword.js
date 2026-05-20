document.addEventListener('DOMContentLoaded', () => {
    const $ = (s, r=document) => r.querySelector(s);
    const data = [
      { rank:1, keyword:'제주 맛집', count:212, ratio:28 },
      { rank:2, keyword:'픽제주', count:184, ratio:24 },
      { rank:3, keyword:'제주 숙소', count:133, ratio:18 },
      { rank:4, keyword:'카페추천', count:98, ratio:13 },
      { rank:5, keyword:'도시숲', count:61, ratio:8 },
    ];
  
    $('#tblKeywords').innerHTML = data.map(d => `
      <tr>
        <td>${d.rank}</td>
        <td>${d.keyword}</td>
        <td>${d.count}</td>
        <td class="text-end">${d.ratio}%</td>
      </tr>
    `).join('');
  
    const ctx = $('#chartKeywords');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.keyword),
        datasets: [{
          label: '유입수',
          data: data.map(d => d.count),
          backgroundColor: '#ffc107'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true }
        },
        plugins: { legend: { display: false } }
      }
    });
  });
  