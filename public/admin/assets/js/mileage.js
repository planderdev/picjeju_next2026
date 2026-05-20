/* /admin/assets/js/mileage.js
 * 통계 > 적립금 (데모)
 * - 일/월 기준으로 날짜 범위 내 가짜 데이터를 생성하여 표/합계를 출력
 * - 범위 제한: 일별 <= 90일, 월별 <= 36개월
 * - 내보내기: 현재 화면 기준 CSV 생성
 * - 참고사항/범위 제한 모달 제공
 */
(function () {
    const path = location.pathname.replace(/\/+$/, '');
    if (!/\/stat\/mileage(?:\/index\.php)?$/.test(path)) return;
  
    // ====== helpers ======
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const nf = new Intl.NumberFormat('ko-KR');
  
    // deterministic pseudo random (seeded) so same 날짜면 동일 값
    function mulberry32(seed) {
      return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const toYYMMDD = (d) => `${String(d.getFullYear()).slice(2)}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
    const toYYYYMM = (d) => `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}`;
    const daysBetweenInclusive = (a, b) => Math.floor((b - a) / 86400000) + 1;
  
    function monthDiffInclusive(a, b) {
      return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1;
    }
  
    function firstOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
    function lastOfMonth(d)  { return new Date(d.getFullYear(), d.getMonth()+1, 0); }
  
    // ====== DOM refs ======
    const form = $('#mileageForm');
    const viewModeSel = $('#viewMode');
    const startInput  = $('#startDate');
    const endInput    = $('#endDate');
    const tbody       = $('#tbodyMileage');
    const totalCount  = $('#totalCount');
  
    // ====== state for export ======
    let currentRows = []; // {label, credit, debit}
    let currentMode = 'day';
    let currentRange = { start: '', end: '' };
  
    // ====== Demo data generator ======
    function seedFromKey(key) {
      // stable 32-bit hash
      let h = 2166136261 >>> 0;
      for (let i=0;i<key.length;i++) {
        h ^= key.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    }
  
    function makeDayRow(d) {
      const key  = `d:${ymd(d)}`;
      const rnd  = mulberry32(seedFromKey(key));
      // 주문수 비슷한 수치로 지급/차감 구성
      const orders = Math.floor(rnd() * 16); // 0~15
      // 지급: 구매적립/이벤트 가중
      const credit = orders * (1000 + Math.floor(rnd()*5000)) + Math.floor(rnd()*2000);
      // 차감: 사용액 (조금 낮게)
      const debit  = Math.floor(credit * clamp(0.3 + rnd()*0.5, 0.25, 0.8));
      return { label: toYYMMDD(d), credit, debit };
    }
  
    function makeMonthRow(d) {
      const key  = `m:${d.getFullYear()}-${d.getMonth()+1}`;
      const rnd  = mulberry32(seedFromKey(key));
      const baseOrders = 200 + Math.floor(rnd()*1200);
      const credit = baseOrders * (1200 + Math.floor(rnd()*8000)) + Math.floor(rnd()*100000);
      const debit  = Math.floor(credit * clamp(0.35 + rnd()*0.35, 0.3, 0.85));
      return { label: toYYYYMM(d), credit, debit };
    }
  
    // ====== render ======
    function renderTable(rows) {
      if (!tbody) return;
      currentRows = rows.slice();
  
      // 합계 먼저
      const sumIn  = rows.reduce((a, r) => a + r.credit, 0);
      const sumOut = rows.reduce((a, r) => a + r.debit, 0);
  
      let html = `
        <tr class="table-secondary">
          <td><strong>합계</strong></td>
          <td class="text-end"><strong>${nf.format(sumIn)}원</strong></td>
          <td class="text-end"><strong>${nf.format(sumOut)}원</strong></td>
        </tr>
      `;
  
      // 일자는 최신일이 위로 보기 좋게 역순
      const iter = (currentMode === 'day') ? rows.slice().reverse() : rows.slice().reverse();
      iter.forEach(r => {
        html += `
          <tr>
            <td>${r.label}</td>
            <td class="text-end">${nf.format(r.credit)}원</td>
            <td class="text-end">${nf.format(r.debit)}원</td>
          </tr>
        `;
      });
  
      tbody.innerHTML = html;
      if (totalCount) totalCount.textContent = nf.format(rows.length);
    }
  
    // ====== range/validation ======
    function openRangeAlert(message) {
      const el = $('#mdRangeAlert');
      $('#rangeAlertMsg').textContent = message;
      bootstrap.Modal.getOrCreateInstance(el).show();
    }
  
    function validateRange(mode, startDate, endDate) {
      const s = new Date(startDate); s.setHours(0,0,0,0);
      const e = new Date(endDate);   e.setHours(0,0,0,0);
      if (isNaN(+s) || isNaN(+e) || s > e) {
        openRangeAlert('시작/종료 날짜를 다시 확인해 주세요.');
        return false;
      }
      if (mode === 'day') {
        const dcnt = daysBetweenInclusive(s, e);
        if (dcnt > 90) {
          openRangeAlert('일별 통계는 최대 90일까지 조회할 수 있어요.');
          return false;
        }
      } else {
        const ms = monthDiffInclusive(firstOfMonth(s), firstOfMonth(e));
        if (ms > 36) {
          openRangeAlert('월별 통계는 최대 36개월(3년)까지 조회할 수 있어요.');
          return false;
        }
      }
      return true;
    }
  
    // ====== build rows ======
    function buildRows(mode, startDate, endDate) {
      const s = new Date(startDate); s.setHours(0,0,0,0);
      const e = new Date(endDate);   e.setHours(0,0,0,0);
      currentMode = mode;
      currentRange = { start: ymd(s), end: ymd(e) };
  
      if (mode === 'day') {
        const rows = [];
        for (let d = new Date(s); d <= e; d.setDate(d.getDate()+1)) {
          rows.push(makeDayRow(new Date(d)));
        }
        return rows;
      } else {
        const rows = [];
        let d = firstOfMonth(s);
        const endM = firstOfMonth(e);
        while (d <= endM) {
          rows.push(makeMonthRow(new Date(d)));
          d = new Date(d.getFullYear(), d.getMonth()+1, 1);
        }
        return rows;
      }
    }
  
    // ====== events ======
    function bindForm() {
      if (!form) return;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const mode  = viewModeSel.value;
        const start = startInput.value;
        const end   = endInput.value;
  
        if (!validateRange(mode, start, end)) return;
  
        const rows = buildRows(mode, start, end);
        renderTable(rows);
      });
  
      viewModeSel.addEventListener('change', () => {
        // 월별 전환 시 기간을 최근 6개월로, 일별은 최근 7일로 자동 맞춤(데모)
        const today = new Date(); today.setHours(0,0,0,0);
        if (viewModeSel.value === 'month') {
          const sixAgo = new Date(today.getFullYear(), today.getMonth()-5, 1);
          startInput.value = ymd(sixAgo);
          endInput.value   = ymd(today);
        } else {
          const weekAgo = new Date(+today - 6*86400000);
          startInput.value = ymd(weekAgo);
          endInput.value   = ymd(today);
        }
      });
    }
  
    function bindNoteModal() {
      const btn = $('#btnNote');
      if (!btn) return;
      btn.addEventListener('click', ()=>{
        const el = $('#mdMileageNote');
        bootstrap.Modal.getOrCreateInstance(el).show();
      });
    }
  
    function csvFromRows(rows) {
      const head = ['일자','지급','차감'];
      const body = rows.map(r => [r.label, r.credit, r.debit]);
      const all  = [head, ...body];
      const csv  = all.map(cols => cols.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');
      return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    }
  
    function updateExportModal(rows) {
      const sumIn  = rows.reduce((a,r)=>a+r.credit,0);
      const sumOut = rows.reduce((a,r)=>a+r.debit,0);
      $('#expCurrency').textContent = 'KRW';
      $('#expMode').textContent     = (currentMode === 'day') ? '일별' : '월별';
      $('#expRange').textContent    = `${currentRange.start} ~ ${currentRange.end}`;
      $('#expRows').textContent     = nf.format(rows.length);
      $('#expSumIn').textContent    = nf.format(sumIn);
      $('#expSumOut').textContent   = nf.format(sumOut);
  
      const blob = csvFromRows(rows);
      const url  = URL.createObjectURL(blob);
      const a    = $('#btnDownloadCsv');
      a.href     = url;
      a.download = `mileage_${currentMode}_${currentRange.start}_${currentRange.end}.csv`;
    }
  
    function bindExport() {
      const btn = $('#btnExport');
      if (!btn) return;
      btn.addEventListener('click', () => {
        updateExportModal(currentRows);
        bootstrap.Modal.getOrCreateInstance($('#mdExport')).show();
      });
    }
  
    // ====== Initial defaults (데모) ======
    function setDefaultDates() {
      const today = new Date(); today.setHours(0,0,0,0);
      const weekAgo = new Date(+today - 6*86400000);
      if (!startInput.value) startInput.value = ymd(weekAgo);
      if (!endInput.value)   endInput.value   = ymd(today);
    }
  
    // ====== Global namespace (호환용) ======
    window.MILEAGE = {
      init() {
        setDefaultDates();
        bindForm();
        bindNoteModal();
        bindExport();
  
        // 첫 렌더(데모)
        const rows = buildRows(viewModeSel.value, startInput.value, endInput.value);
        renderTable(rows);
      },
      // 외부에서 호출 가능한 (데모) 엑셀 모달 열기 시그니처
      openModalPointExcelDownload(currency = 'KRW', mode = 'day', start = startInput.value, end = endInput.value) {
        currentMode = (mode.trim().startsWith('m')) ? 'month' : 'day';
        currentRange = { start, end };
        updateExportModal(currentRows);
        bootstrap.Modal.getOrCreateInstance($('#mdExport')).show();
      }
    };
  
    // 페이지 로드시 실행
    window.MILEAGE.init();
  })();
  