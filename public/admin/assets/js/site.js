document.addEventListener('DOMContentLoaded', () => {
    const $ = (s, r=document) => r.querySelector(s);
    const data = [
      { rank:1, domain:'google.com', visits:356, ratio:42 },
      { rank:2, domain:'naver.com', visits:228, ratio:27 },
      { rank:3, domain:'daum.net', visits:152, ratio:18 },
      { rank:4, domain:'facebook.com', visits:78, ratio:9 },
      { rank:5, domain:'etc', visits:33, ratio:4 },
    ];
  
    $('#tblReferrers').innerHTML = data.map(d => `
      <tr>
        <td>${d.rank}</td>
        <td>${d.domain}</td>
        <td>${d.visits}</td>
        <td class="text-end">${d.ratio}%</td>
      </tr>
    `).join('');
  
    const ctx = $('#chartReferrers');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.domain),
        datasets: [{
          label: '방문수',
          data: data.map(d => d.visits),
          backgroundColor: '#198754'
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
  