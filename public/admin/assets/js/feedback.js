/* /admin/assets/js/feedback.js
 * 통계 > 컨텐츠 반응 (데모)
 * - 일/월 기준으로 날짜 범위 내 가짜 데이터를 생성하여 표/합계/차트 렌더
 * - 범위 제한: 일별 <= 90일, 월별 <= 36개월
 * - 내보내기: 현재 화면 데이터를 CSV 생성
 */
(function () {
    const path = location.pathname.replace(/\/+$/, '');
    if (!/\/stat\/feedback(?:\/index\.php)?$/.test(path)) return;
  
    // ===== helpers =====
    const $  = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const nf = new Intl.NumberFormat('ko-KR');
  
    function ymd(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
    function toYYMMDD(d){ return `${String(d.getFullYear()).slice(2)}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`; }
    function toYYYYMM(d){ return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}`; }
    function daysBetweenInclusive(a,b){ return Math.floor((b-a)/86400000)+1; }
    function firstOfMonth(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
    function monthDiffInclusive(a,b){ return (b.getFullYear()-a.getFullYear())*12 + (b.getMonth()-a.getMonth()) + 1; }
  
    // deterministic random
    function mulberry32(seed){ return function(){ let t=seed+=0x6D2B79F5; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
    function seedFrom(key){ let h=2166136261>>>0; for(let i=0;i<key.length;i++){ h^=key.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  
    // ===== DOM refs =====
    const form = $('#feedbackForm');
    const viewModeSel = $('#viewMode');
    const startInput  = $('#startDate');
    const endInput    = $('#endDate');
  
    const kpiPosts    = $('#kpiPosts');
    const kpiComments = $('#kpiComments');
    const kpiLikes    = $('#kpiLikes');
    const kpiReports  = $('#kpiReports');
  
    const tbody       = $('#tbodyFeedback');
    const totalCount  = $('#totalCount');
  
    let chart; // Chart.js instance
  
    // ===== state =====
    let currentMode = 'day';
    let currentRange = { start:'', end:'' };
    let currentRows = []; // {label, posts, comments, likes, reports, bookmarks, shares}
  
    // ===== generators =====
    function genDayRow(d){
      const key = `d:${ymd(d)}`;
      const rnd = mulberry32(seedFrom(key));
      const posts = Math.floor(rnd()*18);          // 새 글
      const comments = Math.floor(posts*(0.8 + rnd()*1.6)) + Math.floor(rnd()*5);
      const likes = Math.floor(comments*(0.9 + rnd()*0.8)) + Math.floor(posts*(0.6 + rnd()*0.8));
      const reports = Math.floor(rnd()* (posts>0 ? 2 : 1)); // 드물게
      const bookmarks = Math.floor(posts*(0.3 + rnd()*0.9));
      const shares = Math.floor(posts*(0.15 + rnd()*0.6));
      return {
        label: toYYMMDD(d),
        posts, comments, likes, reports, bookmarks, shares
      };
    }
  
    function genMonthRow(d){
      const key = `m:${d.getFullYear()}-${d.getMonth()+1}`;
      const rnd = mulberry32(seedFrom(key));
      const posts = 120 + Math.floor(rnd()*400);
      const comments = Math.floor(posts*(1.8 + rnd()*1.5)) + Math.floor(rnd()*80);
      const likes = Math.floor(comments*(0.8 + rnd()*0.7)) + Math.floor(posts*(0.5 + rnd()*0.6));
      const reports = Math.floor(rnd()*Math.max(2, posts*0.02));
      const bookmarks = Math.floor(posts*(0.35 + rnd()*0.7));
      const shares = Math.floor(posts*(0.2 + rnd()*0.5));
      return {
        label: toYYYYMM(d),
        posts, comments, likes, reports, bookmarks, shares
      };
    }
  
    function buildRows(mode, startDate, endDate){
      const s = new Date(startDate); s.setHours(0,0,0,0);
      const e = new Date(endDate);   e.setHours(0,0,0,0);
      currentMode = mode;
      currentRange = { start: ymd(s), end: ymd(e) };
  
      if(mode==='day'){
        const rows=[];
        for(let d=new Date(s); d<=e; d.setDate(d.getDate()+1)){
          rows.push(genDayRow(new Date(d)));
        }
        return rows;
      } else {
        const rows=[];
        for(let d=firstOfMonth(s), endM=firstOfMonth(e); d<=endM; d=new Date(d.getFullYear(), d.getMonth()+1, 1)){
          rows.push(genMonthRow(new Date(d)));
        }
        return rows;
      }
    }
  
    // ===== render =====
    function renderTable(rows){
      currentRows = rows.slice();
      const sum = rows.reduce((a,r)=>({
        posts:a.posts+r.posts,
        comments:a.comments+r.comments,
        likes:a.likes+r.likes,
        reports:a.reports+r.reports,
        bookmarks:a.bookmarks+r.bookmarks,
        shares:a.shares+r.shares
      }), {posts:0,comments:0,likes:0,reports:0,bookmarks:0,shares:0});
  
      let html = `
        <tr class="table-secondary">
          <td><strong>합계</strong></td>
          <td class="text-end"><strong>${nf.format(sum.posts)}</strong></td>
          <td class="text-end"><strong>${nf.format(sum.comments)}</strong></td>
          <td class="text-end"><strong>${nf.format(sum.likes)}</strong></td>
          <td class="text-end"><strong>${nf.format(sum.reports)}</strong></td>
          <td class="text-end"><strong>${nf.format(sum.bookmarks)}</strong></td>
          <td class="text-end"><strong>${nf.format(sum.shares)}</strong></td>
        </tr>
      `;
  
      const iter = rows.slice().reverse(); // 최신일자 위쪽
      iter.forEach(r=>{
        html += `
          <tr>
            <td>${r.label}</td>
            <td class="text-end">${nf.format(r.posts)}</td>
            <td class="text-end">${nf.format(r.comments)}</td>
            <td class="text-end">${nf.format(r.likes)}</td>
            <td class="text-end">${nf.format(r.reports)}</td>
            <td class="text-end">${nf.format(r.bookmarks)}</td>
            <td class="text-end">${nf.format(r.shares)}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
      totalCount.textContent = nf.format(rows.length);
  
      // 오늘자 KPI(기간 끝 기준)
      const todayRow = rows[rows.length-1] || {posts:0,comments:0,likes:0,reports:0};
      kpiPosts.textContent    = nf.format(todayRow.posts);
      kpiComments.textContent = nf.format(todayRow.comments);
      kpiLikes.textContent    = nf.format(todayRow.likes);
      kpiReports.textContent  = nf.format(todayRow.reports);
  
      // Export modal numbers
      $('#sumPosts').textContent    = nf.format(sum.posts);
      $('#sumComments').textContent = nf.format(sum.comments);
      $('#sumLikes').textContent    = nf.format(sum.likes);
      $('#sumReports').textContent  = nf.format(sum.reports);
      $('#expRows').textContent     = nf.format(rows.length);
      $('#expMode').textContent     = (currentMode === 'day') ? '일별' : '월별';
      $('#expRange').textContent    = `${currentRange.start} ~ ${currentRange.end}`;
    }
  
    function renderChart(rows){
      const ctx = $('#chartFeedback');
      const labels = rows.map(r=>r.label);
      const posts  = rows.map(r=>r.posts);
      const comments = rows.map(r=>r.comments);
  
      if(chart){ chart.destroy(); }
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label:'새 글', data:posts, borderWidth:2, fill:false, tension:0.3 },
            { label:'댓글', data:comments, borderWidth:2, fill:false, tension:0.3 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode:'index', intersect:false },
          plugins: {
            legend: { position: 'top' },
            tooltip: { callbacks:{
              label: (ctx)=> `${ctx.dataset.label}: ${nf.format(ctx.parsed.y)}`
            }}
          },
          scales: {
            y: { beginAtZero:true, ticks:{ callback:(v)=> nf.format(v) } }
          }
        }
      });
    }
  
    // ===== CSV =====
    function csvFromRows(rows){
      const head = ['일자','새 글','댓글','좋아요','신고','북마크','공유'];
      const body = rows.map(r => [r.label,r.posts,r.comments,r.likes,r.reports,r.bookmarks,r.shares]);
      const all = [head, ...body];
      const csv = all.map(cols => cols.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');
      return new Blob([csv], { type:'text/csv;charset=utf-8;' });
    }
  
    function openExport(){
      const blob = csvFromRows(currentRows);
      const url = URL.createObjectURL(blob);
      const a = $('#btnDownloadCsv');
      a.href = url;
      a.download = `content_feedback_${currentMode}_${currentRange.start}_${currentRange.end}.csv`;
      bootstrap.Modal.getOrCreateInstance($('#mdExport')).show();
    }
  
    // ===== validations =====
    function openRangeAlert(msg){
      $('#rangeAlertMsg').textContent = msg;
      bootstrap.Modal.getOrCreateInstance($('#mdRangeAlert')).show();
    }
  
    function validateRange(mode, startDate, endDate){
      const s = new Date(startDate); s.setHours(0,0,0,0);
      const e = new Date(endDate);   e.setHours(0,0,0,0);
      if(isNaN(+s) || isNaN(+e) || s>e){ openRangeAlert('시작/종료 날짜를 다시 확인해 주세요.'); return false; }
      if(mode==='day'){
        if(daysBetweenInclusive(s,e) > 90){ openRangeAlert('일별 통계는 최대 90일까지 조회할 수 있어요.'); return false; }
      } else {
        if(monthDiffInclusive(firstOfMonth(s), firstOfMonth(e)) > 36){ openRangeAlert('월별 통계는 최대 36개월(3년)까지 조회할 수 있어요.'); return false; }
      }
      return true;
    }
  
    // ===== events =====
    function bindForm(){
      form.addEventListener('submit', (e)=>{
        e.preventDefault();
        const mode  = viewModeSel.value;
        const start = startInput.value;
        const end   = endInput.value;
        if(!validateRange(mode, start, end)) return;
  
        const rows = buildRows(mode, start, end);
        renderTable(rows);
        renderChart(rows);
      });
  
      viewModeSel.addEventListener('change', ()=>{
        const today = new Date(); today.setHours(0,0,0,0);
        if(viewModeSel.value==='month'){
          const sixAgo = new Date(today.getFullYear(), today.getMonth()-5, 1);
          startInput.value = ymd(sixAgo);
          endInput.value   = ymd(today);
        } else {
          const fourteenAgo = new Date(+today - 13*86400000);
          startInput.value = ymd(fourteenAgo);
          endInput.value   = ymd(today);
        }
      });
    }
  
    function bindNote(){
      $('#btnNote')?.addEventListener('click', ()=>{
        bootstrap.Modal.getOrCreateInstance($('#mdFeedbackNote')).show();
      });
    }
  
    function bindExport(){
      $('#btnExport')?.addEventListener('click', openExport);
    }
  
    // ===== defaults =====
    function setDefaultDates(){
      const today = new Date(); today.setHours(0,0,0,0);
      const fourteenAgo = new Date(+today - 13*86400000);
      if(!startInput.value) startInput.value = ymd(fourteenAgo);
      if(!endInput.value)   endInput.value   = ymd(today);
    }
  
    // ===== init =====
    window.FEEDBACK = {
      init(){
        setDefaultDates();
        bindForm();
        bindNote();
        bindExport();
  
        const rows = buildRows(viewModeSel.value, startInput.value, endInput.value);
        renderTable(rows);
        renderChart(rows);
      }
    };
  
    window.FEEDBACK.init();
  })();
  