document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modalExchange");
  const form = modal?.querySelector("[data-exchange-form]");
  const list = document.querySelector("[data-exchange-list]");
  const empty = document.querySelector("[data-exchange-empty]");
  const count = document.querySelector("[data-exchange-count]");

  if (!modal || !form || !list) return;

  const escapeHTML = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const getNow = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const updateCount = () => {
    const total = list.querySelectorAll(".exchange-request-item").length;
    if (count) count.textContent = `${total}건`;
    if (empty) empty.hidden = total > 0;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const type = data.get("exchange_type");
    const orderNo = data.get("order_no");
    const reason = data.get("reason");
    const phone = data.get("phone");
    const content = data.get("content");
    const files = form.querySelector('input[name="evidence"]')?.files?.length || 0;

    const item = document.createElement("div");
    item.className = "exchange-request-item";
    item.innerHTML = `
      <div class="exchange-request-top">
        <span class="exchange-badge">접수 완료</span>
        <strong>${escapeHTML(type)} 신청</strong>
      </div>
      <div class="exchange-request-text">${escapeHTML(reason)} · ${escapeHTML(content)}</div>
      <div class="exchange-request-meta">
        주문번호 ${escapeHTML(orderNo)} | ${escapeHTML(phone)} | ${getNow()}${files ? ` | 첨부 ${files}개` : ""}
      </div>
    `;

    list.prepend(item);
    updateCount();
    form.reset();
    window.picjejuUI?.Modal?.getOrCreateInstance(modal)?.hide();
  });

  updateCount();
});
