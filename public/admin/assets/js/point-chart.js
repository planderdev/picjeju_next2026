/* /admin/assets/js/point-stats.js — 픽포인트 통계 */
(() => {
    const $  = (s,r=document)=>r.querySelector(s);
    const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
    const fmt = n => n.toLocaleString('ko-KR');
  
    const el = {
      tbody: $('#tbodyOrder'),
      checkAll: $('#checkAll'),
      selCount: $('#selCount'),
      orderTabs: $('#orderTabs'),
      btnSort: $('#btnSort'),
      btnDownload: $('#btnDownload'),
      emptyList: $('#emptyList'),
      statPlus: $('#statPlus'),
      statMinus: $('#statMinus'),
      statTotal: $('#statTotal'),
      statRows: $('#statRows'),
    };
  
    let mode = 'daily';
    let order = 'desc';
  
    const dataDaily = [
      {date:'25.10.14', plus:1500, minus:500, total:1000, userAmt:1000, userCnt:2, adminAmt:5000, adminCnt:12},
      {date:'25.10.13', plus:2000, minus:700, total:1300, userAmt:800,  userCnt:3, adminAmt:4000, adminCnt:9},
    ];
    const dataMonthly = [
      {date:'2025.09', plus:12000, minus:5000, total:7000, userAmt:6000, userCnt:14, adminAmt:15000, adminCnt:32},
      {date:'2025.08', plus:9000,  minus:3000, total:6000, userAmt:4500, userCnt:11, adminAmt:9000, adminCnt:27},
    ];
  
    function renderStats(list) {
      const plus = list.reduce((sum, item) => sum + item.plus, 0);
      const minus = list.reduce((sum, item) => sum + item.minus, 0);
      const total = list.reduce((sum, item) => sum + item.total, 0);
      if (el.statPlus) el.statPlus.textContent = fmt(plus);
      if (el.statMinus) el.statMinus.textContent = fmt(minus);
      if (el.statTotal) el.statTotal.textContent = fmt(total);
      if (el.statRows) el.statRows.textContent = fmt(list.length);
    }

    function render(list){
      renderStats(list);
      if(!list.length){
        el.emptyList.classList.remove('d-none');
        el.tbody.innerHTML='';
        return;
      }
      el.emptyList.classList.add('d-none');
      el.tbody.innerHTML = list.map(o=>`
        <tr>
          <td><input type="checkbox" class="form-check-input rowchk"></td>
          <td>${o.date}</td>
          <td class="text-end">${fmt(o.plus)}</td>
          <td class="text-end">${fmt(o.minus)}</td>
          <td class="text-end fw-semibold">${fmt(o.total)}</td>
          <td class="text-end">${fmt(o.userAmt)} / ${o.userCnt}회</td>
          <td class="text-end">${fmt(o.adminAmt)} / ${o.adminCnt}회</td>
        
        </tr>
      `).join('');
  
      // 선택 이벤트
      $$('.rowchk').forEach(chk=>{
        chk.addEventListener('change',()=>{
          const checkedCount = $$('.rowchk').filter(c=>c.checked).length;
          el.selCount.textContent = checkedCount;
          el.checkAll.checked = checkedCount && checkedCount === $$('.rowchk').length;
        });
      });
    }
  
    // 전체 선택
    el.checkAll?.addEventListener('change',()=>{
      const checked = el.checkAll.checked;
      $$('.rowchk').forEach(c=>c.checked = checked);
      el.selCount.textContent = checked ? $$('.rowchk').length : 0;
    });
  
    // 탭 전환
    $$('#orderTabs button').forEach(btn=>{
      btn.addEventListener('click',()=>{
        $$('#orderTabs .nav-link').forEach(l=>l.classList.remove('active'));
        btn.classList.add('active');
        mode = btn.dataset.mode;
        render(mode==='daily'?dataDaily:dataMonthly);
      });
    });
  
    // 정렬 토글
    el.btnSort?.addEventListener('click',()=>{
      order = (order==='desc')?'asc':'desc';
      el.btnSort.innerHTML = `<i class="ri-sort-${order==='desc'?'desc':'asc'}"></i>`;
      const list = mode==='daily'?dataDaily:dataMonthly;
      list.reverse();
      render(list);
    });
  
    // 다운로드
    el.btnDownload?.addEventListener('click',()=>{
      const list = mode==='daily'?dataDaily:dataMonthly;
      const csv = ['일자,지급,차감,합계,유저전송,관리자전송']
        .concat(list.map(o=>`${o.date},${o.plus},${o.minus},${o.total},${o.userAmt}/${o.userCnt},${o.adminAmt}/${o.adminCnt}`))
        .join('\n');
      const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
      const url = URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url; a.download='point_stats.csv';
      a.click(); URL.revokeObjectURL(url);
    });
  
    render(dataDaily);
  })();
  
