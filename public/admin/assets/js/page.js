document.addEventListener('DOMContentLoaded', () => {
    const $ = (s, r=document) => r.querySelector(s);
  
    const data = [
      { rank:1, title:'메인페이지', url:'/', views:842 },
      { rank:2, title:'스토어 상세', url:'/store/123', views:534 },
      { rank:3, title:'이벤트 소개', url:'/event/summer', views:284 },
      { rank:4, title:'회원가입', url:'/register', views:166 },
      { rank:5, title:'공지사항', url:'/notice/7', views:91 },
    ];
  
    // 테이블 채우기
    $('#tblTopPages').innerHTML = data.map(d => `
      <tr>
        <td>${d.rank}</td>
        <td>${d.title}</td>
        <td>${d.url}</td>
        <td class="text-end">${d.views}</td>
      </tr>
    `).join('');
  
    // 막대 차트
    const ctx = $('#chartTopPages');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.title),
        datasets: [{
          label: '조회수',
          data: data.map(d => d.views),
          backgroundColor: '#ff6633'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  });
  
