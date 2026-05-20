// /admin/assets/js/dashboard.js
// Static dashboard seed now, API-ready via window.AdminDashboardData later.
document.addEventListener("DOMContentLoaded", () => {
  const seed = window.AdminDashboardData || {
    visitors7: {
      labels: ["09-10", "09-11", "09-12", "09-13", "09-14", "09-15", "09-16"],
      values: [120, 140, 130, 110, 180, 160, 190]
    },
    visitors30: {
      labels: Array.from({ length: 30 }, (_, index) => `D${index + 1}`),
      values: [
        124, 132, 141, 138, 150, 148, 160, 156, 162, 171,
        168, 176, 181, 174, 188, 192, 185, 198, 205, 211,
        204, 216, 220, 214, 226, 231, 224, 236, 242, 239
      ]
    },
    periodRows: [
      ["2025-09-16", 21, "17.8 만원", 202, 0, 1],
      ["2025-09-15", 23, "145.3 만원", 239, 7, 4],
      ["2025-09-14", 8, "228.7 만원", 287, 5, 3],
      ["2025-09-13", 6, "451.6 만원", 147, 9, 3],
      ["2025-09-12", 0, "303.0 만원", 242, 8, 2],
      ["2025-09-11", 1, "212.8 만원", 145, 1, 4],
      ["2025-09-10", 25, "471.6 만원", 190, 3, 5]
    ]
  };

  const ctx = document.getElementById("visitorsChart");
  const makeFallback = (source) => {
    const max = Math.max(...source.values, 1);
    return `
      <div class="dashboard-chart-fallback">
        ${source.values.map((value, index) => `
          <span style="height:${Math.max(12, (value / max) * 100)}%" title="${source.labels[index]} ${value}명"></span>
        `).join("")}
      </div>
    `;
  };

  let chart = null;
  const renderFallback = (source) => {
    const parent = ctx?.parentElement;
    if (!parent) return;
    ctx.hidden = true;
    let fallback = parent.querySelector(".dashboard-chart-fallback-wrap");
    if (!fallback) {
      fallback = document.createElement("div");
      fallback.className = "dashboard-chart-fallback-wrap";
      parent.appendChild(fallback);
    }
    fallback.innerHTML = makeFallback(source);
  };

  if (ctx && window.Chart) {
    const makeData = (source) => ({
      labels: source.labels,
      datasets: [{
        label: "방문자",
        data: source.values,
        borderColor: "#3ba3ff",
        backgroundColor: "rgba(59, 163, 255, .12)",
        pointBackgroundColor: "#3ba3ff",
        pointBorderColor: "#3ba3ff",
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 3,
        fill: false,
        tension: .38
      }]
    });

    chart = new Chart(ctx, {
      type: "line",
      data: makeData(seed.visitors7),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(17, 24, 39, .92)",
            padding: 12,
            cornerRadius: 10
          }
        },
        scales: {
          x: { grid: { color: "rgba(15, 23, 42, .06)" }, ticks: { color: "#6b7280" } },
          y: { grid: { color: "rgba(15, 23, 42, .08)" }, ticks: { color: "#6b7280" } }
        }
      }
    });

  } else if (ctx) {
    renderFallback(seed.visitors7);
  }

  document.querySelectorAll("[data-range]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-range]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      const source = button.dataset.range === "30d" ? seed.visitors30 : seed.visitors7;
      if (chart) {
        chart.data = {
          labels: source.labels,
          datasets: [{ ...chart.data.datasets[0], data: source.values }]
        };
        chart.update();
      } else {
        renderFallback(source);
      }
    });
  });

  const tbody = document.getElementById("statTableBody");
  if (tbody) {
    tbody.innerHTML = seed.periodRows.map((row) => `
      <tr>
        <td>${row[0]}</td>
        <td>${row[1]}</td>
        <td>${row[2]}</td>
        <td>${row[3]}</td>
        <td>${row[4]}</td>
        <td>${row[5]}</td>
      </tr>
    `).join("");
  }
});
