/* /admin/assets/js/summary.js
 * - /stat/summary/ 전용 스크립트
 * - 오늘 기준 최근 7일 라벨 자동 생성
 * - 차트(페이지뷰/방문자), 유입 사이트/검색어/탑페이지/트래픽 데모 데이터
 * - 기간별 분석 카드 & 컨텐츠 반응 카드도 자동 주입 (제목 텍스트를 찾아 삽입)
 */

(function () {
    // ===== 경로 가드: /stat/summary, /stat/summary/, /stat/summary/index.php =====
    const path = location.pathname.replace(/\/+$/, "");
    if (!/\/stat\/summary(?:\/index\.php)?$/.test(path)) return;
  
    // ===== 유틸 =====
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const fmt = (v) => (Number(v) || 0).toLocaleString("ko-KR");
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  
    function findCardBodyByTitle(title) {
      // .card 헤더 안 텍스트가 title과 정확히 일치하는 카드를 찾아 body 반환
      const cards = $$(".card");
      for (const card of cards) {
        const head =
          card.querySelector(".card-head header") ||
          card.querySelector(".card-header") ||
          card.querySelector("header");
        if (!head) continue;
        const text = head.textContent.trim();
        if (text === title) return card.querySelector(".card-body");
      }
      return null;
    }
  
    function lastNDaysLabels(n = 7, locale = "ko-KR") {
      const out = [];
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      for (let i = n - 1; i >= 0; i--) {
        const t = new Date(d);
        t.setDate(d.getDate() - i);
        // "M월 D일" 포맷
        out.push(`${t.getMonth() + 1}월 ${t.getDate()}일`);
      }
      return out;
    }
  
    function normalize(labels, arr) {
      return labels.map((_, i) => (Number.isFinite(arr?.[i]) ? arr[i] : 0));
    }
  
    // ===== 데모 데이터(오늘 기준 최근 7일, 마지막 날만 증가) =====
    const demo = (() => {
      const labels = lastNDaysLabels(7);
      const pv = Array(labels.length).fill(0);
      const uv = Array(labels.length).fill(0);
      pv[pv.length - 1] = 13;
      uv[uv.length - 1] = 2;
  
      return {
        labels,
        pv,
        uv,
        referrers: [
          { domain: "google.com", clicks: 124 },
          { domain: "naver.com", clicks: 77 },
          { domain: "daum.net", clicks: 51 },
          { domain: "facebook.com", clicks: 22 },
        ],
        keywords: [
          { q: "픽제주", clicks: 41 },
          { q: "제주 공연", clicks: 19 },
          { q: "제주 이벤트", clicks: 12 },
        ],
        topPages: [
          { title: "홈", url: "/", views: 310 },
          { title: "소개", url: "/about", views: 121 },
          { title: "블로그 글", url: "/post/hello", views: 88 },
        ],
        traffic: [
          { label: "어제", value: "1.03M(0.2%)", pct: 0.2 },
          { label: "일주일 전", value: "5.92K(0%)", pct: 0 },
          { label: "한달 전", value: "21.11M(4.12%)", pct: 4.12 },
          { label: "반년 전", value: "7.54M(1.47%)", pct: 1.47 },
        ],
        // 기간별 분석 카드용 KPI
        period: [
          { title: "세션", value: 512, delta: +12 },
          { title: "페이지뷰", value: 1213, delta: +8 },
          { title: "방문자", value: 198, delta: +5 },
          { title: "이탈률", value: "42%", delta: -3 },
        ],
        // 컨텐츠 반응 데모
        feedback: [
          { icon: "ri-thumb-up-line", label: "좋아요", value: 28 },
          { icon: "ri-chat-3-line", label: "댓글", value: 9 },
          { icon: "ri-share-forward-line", label: "공유", value: 4 },
        ],
      };
    })();
  
    // 외부에서 window.__STAT_SUMMARY 제공 시 그 값을 우선 사용
    const src =
      window.__STAT_SUMMARY && typeof window.__STAT_SUMMARY === "object"
        ? window.__STAT_SUMMARY
        : demo;
  
    // ===== 차트 빌더(단일 캔버스: PV 채움 + UV 라인) =====
    function buildCombined(ctx, { labels, pv, uv }) {
      if (ctx.__chartInstance?.destroy) ctx.__chartInstance.destroy();
  
      ctx.__chartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "페이지뷰",
              data: pv,
              tension: 0.25,
              borderWidth: 2,
              pointRadius: 3,
              fill: true,
              backgroundColor: "rgba(193,231,255,0.45)",
              borderColor: "rgba(193,231,255,1)",
              pointBackgroundColor: "rgba(193,231,255,1)",
            },
            {
              label: "방문자",
              data: uv,
              tension: 0.25,
              borderWidth: 2,
              pointRadius: 3,
              fill: false,
              borderColor: "rgba(26,109,255,1)",
              pointBackgroundColor: "rgba(26,109,255,1)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, // 길어짐 방지
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: true },
            tooltip: {
              callbacks: {
                label: (c) => ` ${fmt(c.parsed.y)}`,
              },
            },
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              ticks: { callback: (v) => fmt(v) },
            },
          },
        },
      });
    }
  
    // ===== DOM 주입들 =====
    function render() {
      const labels =
        Array.isArray(src.labels) && src.labels.length ? src.labels : demo.labels;
      const pvData = normalize(labels, Array.isArray(src.pv) ? src.pv : demo.pv);
      const uvData = normalize(labels, Array.isArray(src.uv) ? src.uv : demo.uv);
  
      // 1) 차트
      const canvas = $("#chart1") || $("#statPVChart"); // (fallback 지원)
      if (canvas?.getContext) {
        buildCombined(canvas.getContext("2d"), {
          labels,
          pv: pvData,
          uv: uvData,
        });
      }
  
      // 2) 표들
      const tbodyRef = $("#tblReferrers");
      const tbodyKey = $("#tblKeywords");
      const tbodyTop = $("#tblTopPages");
      const trafficBox = $("#trafficBody");
  
      if (tbodyRef) {
        const data = src.referrers || demo.referrers;
        tbodyRef.innerHTML = data
          .map(
            (r) =>
              `<tr><td>${r.domain}</td><td class="text-end">${fmt(
                r.clicks
              )}</td></tr>`
          )
          .join("");
      }
      if (tbodyKey) {
        const data = src.keywords || demo.keywords;
        tbodyKey.innerHTML = data
          .map(
            (k) =>
              `<tr><td>${k.q}</td><td class="text-end">${fmt(
                k.clicks
              )}</td></tr>`
          )
          .join("");
      }
      if (tbodyTop) {
        const data = src.topPages || demo.topPages;
        tbodyTop.innerHTML = data
          .map(
            (p) => `
          <tr>
            <td>${p.title}</td>
            <td class="text-truncate" style="max-width:260px;"><code>${p.url}</code></td>
            <td class="text-end">${fmt(p.views)}</td>
          </tr>`
          )
          .join("");
      }
      if (trafficBox) {
        const data = src.traffic || demo.traffic;
        trafficBox.innerHTML = data
          .map(
            (t) => `
          <div class="d-flex justify-content-between small">
            <span class="text-body-secondary">${t.label}</span>
            <span class="text-muted">${t.value}</span>
          </div>
          <div class="progress progress-thin my-1" style="height:6px;">
            <div class="progress-bar" role="progressbar" style="width:${clamp(
              t.pct,
              0,
              100
            )}%"></div>
          </div>`
          )
          .join("");
      }
  
      // 3) 기간별 분석 (제목으로 카드 찾기 → KPI 4개 주입)
      const periodBody = findCardBodyByTitle("기간별 분석");
      if (periodBody) {
        const items = src.period || demo.period;
        periodBody.innerHTML = `
          <div class="row g-3">
            ${items
              .map((it) => {
                const isUp = typeof it.delta === "number" && it.delta >= 0;
                const badge =
                  typeof it.delta === "number"
                    ? `<span class="badge ${
                        isUp ? "text-bg-success" : "text-bg-danger"
                      } ms-2">${isUp ? "▲" : "▼"} ${Math.abs(it.delta)}%</span>`
                    : "";
                return `
                  <div class="col-6 col-xl-3">
                    <div class="p-3 rounded-3 border bg-white h-100">
                      <div class="text-body-secondary small mb-1">${it.title}</div>
                      <div class="fw-semibold fs-5">${typeof it.value === "string" ? it.value : fmt(it.value)}${badge}</div>
                    </div>
                  </div>`;
              })
              .join("")}
          </div>`;
      }
  
      // 4) 컨텐츠 반응 (제목으로 카드 찾기 → 데모 지표 주입)
      const feedbackBody = findCardBodyByTitle("컨텐츠 반응");
      if (feedbackBody) {
        const items = src.feedback || demo.feedback;
        feedbackBody.innerHTML = `
          <div class="row g-3">
            ${items
              .map(
                (it) => `
              <div class="col-4">
                <div class="p-3 rounded-3 border bg-white h-100 text-center">
                  <i class="${it.icon}" style="font-size:28px; opacity:.7;"></i>
                  <div class="mt-2 small text-body-secondary">${it.label}</div>
                  <div class="fw-semibold">${fmt(it.value)}</div>
                </div>
              </div>`
              )
              .join("")}
          </div>`;
      }
    }
  
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", render);
    else render();
  })();
  