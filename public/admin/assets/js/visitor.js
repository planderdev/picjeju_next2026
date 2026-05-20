/* /admin/assets/js/stat_visitor.js
 * 방문자 상세 통계 — /admin/stat/visitor/
 * Chart.js + Table Render
 */

document.addEventListener('DOMContentLoaded', () => {
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

    /* ------------------------------
     * 더미 데이터 (데모용)
     * ------------------------------ */
    const visitorTrend = {
        labels: ['11/4', '11/5', '11/6', '11/7', '11/8', '11/9', '11/10'],
        pv: [0, 0, 2, 3, 4, 6, 14],
        uv: [0, 0, 1, 1, 1, 2, 8],
    };

    const referrers = [
        { domain: 'google.com', clicks: 124, ratio: 42 },
        { domain: 'naver.com', clicks: 77, ratio: 26 },
        { domain: 'daum.net', clicks: 51, ratio: 17 },
        { domain: 'facebook.com', clicks: 22, ratio: 7 },
        { domain: 'etc', clicks: 19, ratio: 8 },
    ];

    const deviceData = [
        { label: 'PC', value: 58, color: '#ff6633' },
        { label: '모바일', value: 38, color: '#198754' },
        { label: '태블릿', value: 4, color: '#ffc107' },
    ];

    const regionData = [
        { region: '서울특별시', visitors: 82, ratio: 41 },
        { region: '경기도', visitors: 53, ratio: 26 },
        { region: '부산광역시', visitors: 22, ratio: 11 },
        { region: '제주특별자치도', visitors: 14, ratio: 7 },
        { region: '기타', visitors: 27, ratio: 13 },
    ];

    /* ------------------------------
     * 방문자 추이 차트 (Line)
     * ------------------------------ */
    const ctx1 = $('#chartVisitorTrend');
    if (ctx1) {
        new Chart(ctx1, {
            type: 'line',
            data: {
                labels: visitorTrend.labels,
                datasets: [
                    {
                        label: '페이지뷰',
                        data: visitorTrend.pv,
                        borderColor: '#ff6633',
                        backgroundColor: 'rgba(13,110,253,0.1)',
                        tension: 0.3,
                        fill: true,
                    },
                    {
                        label: '방문자',
                        data: visitorTrend.uv,
                        borderColor: '#ffc107',
                        backgroundColor: 'rgba(255,193,7,0.15)',
                        tension: 0.3,
                        fill: true,
                    },
                ],
            },
            options: {
                plugins: {
                    legend: { display: true }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        suggestedMax: 15,  // ✅ 세로축 최대값을 고정하거나 조정
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        },
                        ticks: {
                            stepSize: 2  // ✅ 눈금 간격
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /* ------------------------------
     * 디바이스 비율 차트 (Doughnut)
     * ------------------------------ */
    const ctx2 = document.getElementById('chartDevice');
    if (ctx2) {
        // CSS로 높이 지정 (HTML에 height 속성 있으면 삭제!)
        ctx2.style.height = '400px';
        ctx2.style.width = '100%';

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
                responsive: true,           // ✅ 브라우저 크기 변경 반응
                maintainAspectRatio: false, // ✅ CSS 높이 그대로 반영
                plugins: {
                    legend: { display: false }
                },
                cutout: '70%',
            }
        });

        // 범례 출력
        const legend = $('#deviceLegend');
        if (legend) {
            legend.innerHTML = deviceData
                .map(
                    d => `
        <li>
          <i class="ri-checkbox-blank-circle-fill me-1" style="color:${d.color}"></i>
          ${d.label} — ${d.value}%
        </li>`
                )
                .join('');
        }
    }

    /* ------------------------------
     * 유입 경로 테이블
     * ------------------------------ */
    const tblRef = $('#tblReferrers');
    if (tblRef) {
        tblRef.innerHTML = referrers
            .map(
                (r) => `
        <tr>
          <td>${r.domain}</td>
          <td class="text-end">${r.clicks}</td>
          <td class="text-end">${r.ratio}%</td>
        </tr>`
            )
            .join('');
    }

    /* ------------------------------
     * 지역별 방문 테이블
     * ------------------------------ */
    const tblRegion = $('#tblRegion');
    if (tblRegion) {
        tblRegion.innerHTML = regionData
            .map(
                (r) => `
        <tr>
          <td>${r.region}</td>
          <td class="text-end">${r.visitors}</td>
          <td class="text-end">${r.ratio}%</td>
        </tr>`
            )
            .join('');
    }

    /* ------------------------------
     * 조회 버튼 이벤트 (데모)
     * ------------------------------ */
    const btnSearch = $('#btnSearch');
    if (btnSearch) {
        btnSearch.addEventListener('click', () => {
            const s = $('#startDate').value;
            const e = $('#endDate').value;
            alert(`조회 기간: ${s} ~ ${e}\n(데모: 실제 필터링은 구현 전입니다)`);
        });
    }
});
