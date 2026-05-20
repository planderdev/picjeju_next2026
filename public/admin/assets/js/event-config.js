/* /admin/assets/js/event-config.js */
(function(){
    const $=(s,r=document)=>r.querySelector(s);
    const KEY='ADMIN_EVENT_CONFIG';
    const DEFAULTS={ sort:'-start', cardStyle:'grid', pageSize:12, defaultCat:'', showEnded:false };
  
    function load(){ try{const raw=localStorage.getItem(KEY); if(raw) return {...DEFAULTS, ...JSON.parse(raw)};}catch(e){} return {...DEFAULTS}; }
    function save(cfg){ localStorage.setItem(KEY, JSON.stringify(cfg)); }
  
    const cfg=load();
    $('#cfgSort').value=cfg.sort;
    $('#cfgCardStyle').value=cfg.cardStyle;
    $('#cfgPageSize').value=cfg.pageSize;
    $('#cfgDefaultCat').value=cfg.defaultCat||'';
    $('#cfgShowEnded').checked=!!cfg.showEnded;
  
    $('#cfgReset')?.addEventListener('click',()=>{
      if(!confirm('기본값으로 되돌릴까요?')) return;
      Object.assign(cfg, DEFAULTS); save(cfg); location.reload();
    });
  
    $('#evCfgForm')?.addEventListener('submit',e=>{
      e.preventDefault();
      cfg.sort = $('#cfgSort').value;
      cfg.cardStyle = $('#cfgCardStyle').value;
      cfg.pageSize = Math.max(1, Math.min(60, parseInt($('#cfgPageSize').value||'12',10)));
      cfg.defaultCat = $('#cfgDefaultCat').value.trim();
      cfg.showEnded = !!$('#cfgShowEnded').checked;
      save(cfg);
      alert('저장되었습니다.');
    });
  })();