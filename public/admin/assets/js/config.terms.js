// /assets/js/config.terms.js
// 약관 설정 페이지 전용 스크립트 (Bootstrap 5 가정)
// - 표준약관 적용 / 쇼핑몰 표준약관 적용
// - 변경 감지 -> 저장 버튼 활성화
// - 저장: 정적 HTML 전환 기준 localStorage 사용

(function(){
    const $ = (sel, root=document)=>root.querySelector(sel);
    const $$ = (sel, root=document)=>Array.from(root.querySelectorAll(sel));
  
    const saveBtns = [$('#btnSave'), $('#btnSaveMobile')].filter(Boolean);
    const enableSave = (on=true)=> saveBtns.forEach(b=> b.disabled = !on);
  
    // 표준 서식 (공정위 권고안 기반 샘플) -------------------------------
    const STD_TEMPLATES = {
      policy: `제1조 목적
  
  본 이용약관은 “사이트명”(이하 "사이트")의 서비스의 이용조건과 운영에 관한 제반 사항을 규정함을 목적으로 합니다.
  
  제2조 용어의 정의
  
  ① 회원 : 사이트의 약관에 동의하고 개인정보를 제공하여 회원등록을 한 자
  ② 이용계약 : 사이트와 회원 간에 체결하는 서비스 이용에 관한 계약
  ③ 아이디(ID) : 회원 식별과 서비스 이용을 위하여 회원이 정한 문자와 숫자의 조합
  ④ 비밀번호 : 회원의 권익 보호를 위하여 회원이 정한 문자와 숫자의 조합
  ⑤ 해지 : 회원이 이용계약을 해약하는 것
  
  제3조 약관 외 준칙
  운영자는 필요한 경우 별도로 운영정책을 공지할 수 있으며, 본 약관과 운영정책이 중첩될 경우 운영정책이 우선합니다.
  
  제4조 이용계약의 성립
  회원 가입 신청에 대해 운영자의 승낙으로 성립합니다.
  
  제5조 개인정보처리방침
  개인정보의 수집·이용·보관 및 파기에 관하여는 개인정보처리방침을 따릅니다.
  
  제6조 회원의 의무
  법령과 본 약관 및 운영정책을 준수하여야 합니다.
  
  제7조 서비스 이용 제한
  회원이 법령 또는 본 약관을 위반한 경우 서비스 이용을 제한할 수 있습니다.
  
  제8조 게시물 관리
  불법·유해 게시물은 삭제될 수 있으며 관련 법령에 따릅니다.
  
  제9조 손해배상 및 면책
  불가항력 등 운영자에게 귀책사유가 없는 경우 책임을 지지 않습니다.
  
  부칙
  본 약관은 <사이트 개설일>부터 시행합니다.`,
      privacy: `회사명(이하 ‘회사’)은 개인정보 보호법 제30조에 따라 정보주체의 개인정보를 보호하기 위하여 다음과 같은 개인정보 처리방침을 수립·공개합니다.
  
  제1조 (처리목적) 홈페이지 회원가입 및 관리, 서비스 제공, 민원처리 등
  제2조 (처리 및 보유기간) 동의 받은 기간 또는 관련 법령에 따른 기간
  제3조 (제3자 제공) 법률 근거 또는 정보주체의 동의가 있는 경우에 한함
  제4조 (처리위탁) 수탁사, 위탁업무, 보유·이용기간 등을 공개
  제5조 (정보주체의 권리) 열람·정정·삭제·처리정지 요구 등
  제6조 (처리항목) 가입·이용·결제에 필요한 최소한의 정보
  제7조 (파기) 보유기간 경과, 처리목적 달성 시 지체 없이 파기
  제8조 (안전성 확보조치) 관리적·기술적·물리적 보호조치
  제9조 (쿠키) 맞춤서비스 제공을 위한 쿠키 사용 및 거부 방법
  제10조 (보호책임자) 성명/연락처 등 공개
  제11조 (권익침해 구제) 분쟁조정위원회, 신고센터 등 안내
  제12조 (시행일) 이 방침은 20XX. X. X.부터 적용합니다.`,
      domestic: `국내여행 표준약관(요지)
  
  제1조 목적 : 국내여행계약의 이행 및 준수사항 규정
  제2조 의무 : 여행사·여행자 각 의무
  제3조 계약의 구성 : 계약서, 약관, 일정표(설명서)
  제4조 특약 : 서면 합의로 가능
  제5조 책임 : 고의·과실 시 손해배상
  제6조 최저행사인원 미충족 시 계약해제 통지
  제7조 요금·조건 변경 및 정산
  제8조 출발 전·후 해제·해지
  기타사항은 문화체육관광부 고시 표준약관을 따릅니다.`,
      overseas: `국외여행 표준약관(요지)
  
  제1조 목적 : 국외여행계약의 이행 및 준수사항 규정
  제2조 용어 : 기획·희망여행, 수속대행 등
  제3조 계약의 구성 및 교부
  제4조 안전정보 제공
  제5조 요금 변경, 조건 변경 및 정산
  제6조 출발 전·후 해제·해지
  제7조 손해배상, 보험가입
  기타사항은 문화체육관광부 고시 표준약관을 따릅니다.`,
      marketing_agree: `서비스 관련 신상품 소식, 이벤트 안내, 고객 혜택 등 다양한 정보를 제공하기 위해 마케팅 목적의 정보 수신에 동의합니다.`,
      third_party: `개인정보 제3자 제공 동의(예시)
  
  1. 제공받는 자 : (예) ㅇㅇㅇ카드
  2. 이용목적 : 이벤트 공동개최 등
  3. 제공항목 : 성명, 주소, 휴대폰번호, 이메일
  4. 보유·이용기간 : 회원탈퇴 또는 동의 철회 시까지`,
      limit_join: `만 14세 이상입니다.`,
    };
  
    // 전자상거래(쇼핑몰) 특화 표준안 샘플 ---------------------------
    const SHOP_TEMPLATES = {
      ...STD_TEMPLATES,
      policy: `전자상거래(인터넷사이버몰) 표준약관(요지)
  
  제1조 목적 : 사이버몰을 이용한 재화 또는 용역의 거래
  제2조 정의 : ‘몰’, ‘이용자’, ‘회원’ 등
  제3조 약관의 명시·개정
  제4조 서비스의 제공 및 변경
  제5조 서비스의 중단
  제6조 회원가입, 회원탈퇴, 자격상실
  제7조 개인정보보호
  제8조 구매신청 및 계약의 성립
  제9조 지급방법
  제10조 공급 및 배송
  제11조 환급, 청약철회
  제12조 청약철회 등의 효과
  제13조 개인정보의 처리
  제14조 분쟁해결 및 관할법원
  
  세부 내용은 공정거래위원회 ‘전자상거래 표준약관’을 따릅니다.`,
      privacy: `전자상거래 고객 개인정보처리방침(요지)
  
  1. 처리목적 : 회원관리, 주문·결제·배송, 민원처리 등
  2. 처리항목 : 회원가입·주문·결제·배송에 필요한 최소한의 정보
  3. 보유기간 : 전자상거래법 등 관련 법령에 따른 기간
    - 표시·광고에 관한 기록 : 6개월
    - 계약/청약철회/결제/재화공급 기록 : 5년
    - 소비자 불만 또는 분쟁처리 기록 : 3년
  4. 제3자 제공/위탁 : 결제(PG), 택배사 등
  5. 권리행사 : 열람·정정·삭제·처리정지
  6. 파기 및 안전성 확보조치
  7. 시행일 : 20XX. X. X.`,
    };
  
    // 텍스트에 값 주입
    function applyTemplate(tpl){
      $$('.terms-textarea').forEach(ta=>{
        const key = ta.dataset.key;
        if (tpl[key]) ta.value = tpl[key];
      });
      enableSave(true);
      toast('표준 서식이 삽입되었습니다. 저장을 눌러 반영하세요.');
    }

    function restoreSavedTerms(){
      try{
        const saved = JSON.parse(localStorage.getItem('admin.config.terms') || 'null');
        const contents = saved && typeof saved === 'object' ? saved.contents : null;
        if(!contents || typeof contents !== 'object') return;
        $$('.terms-textarea').forEach(ta=>{
          const key = ta.dataset.key;
          if(Object.prototype.hasOwnProperty.call(contents, key)) ta.value = contents[key] || '';
        });
      }catch(e){}
    }

    restoreSavedTerms();
  
    // 변경 감지
    $$('.terms-textarea').forEach(ta=>{
      ta.addEventListener('input', ()=> enableSave(true));
    });
  
    // 버튼 핸들러
    $('#btnApplyStd')?.addEventListener('click', ()=> applyTemplate(STD_TEMPLATES));
    $('#btnApplyShopStd')?.addEventListener('click', ()=> applyTemplate(SHOP_TEMPLATES));
  
    // 저장
    function gather(){
      const out = {};
      $$('.terms-textarea').forEach(ta=> out[ta.dataset.key] = ta.value.trim());
      return out;
    }
  
    async function doSave(){
      const payload = { contents: gather(), time: new Date().toISOString() };
      const body = JSON.stringify(payload);
      let saved = false;
      try{
        localStorage.setItem('admin.config.terms', body);
        saved = true;
      }catch(e){
        saved = false;
      }

      if(saved){
        enableSave(false);
        toast('저장되었습니다.');
      }else{
        toast('저장에 실패했습니다.', 'danger');
      }
    }
  
    saveBtns.forEach(b=> b.addEventListener('click', doSave));
  
    // 토스트
    function toast(msg, type='primary'){
      if(window.AdminToast?.show){
        window.AdminToast.show(msg, { variant: type === 'danger' ? 'warning' : 'success' });
        return;
      }
      const id = 'terms-toast';
      let el = document.getElementById(id);
      if(!el){
        el = document.createElement('div');
        el.id = id;
        el.style.position = 'fixed';
        el.style.bottom = '16px';
        el.style.right = '16px';
        el.style.zIndex = '2000';
        document.body.appendChild(el);
      }
      const item = document.createElement('div');
      item.className = `alert alert-${type}`;
      item.textContent = msg;
      el.appendChild(item);
      setTimeout(()=> item.remove(), 2500);
    }
  
  })();
