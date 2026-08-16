import type { Express, Request, Response } from "express";

export function registerSupportRoutes(app: Express) {
  app.get("/support", (_req: Request, res: Response) => {
    res.type("html").send(`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="클로징마켓 고객지원 및 문의 안내" />
  <title>고객지원 | 클로징마켓</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f7f6f2; color: #172033; font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif; line-height: 1.65; }
    main { width: min(100% - 32px, 720px); margin: 0 auto; padding: 52px 0 40px; }
    .brand { color: #bf982d; font-size: 14px; font-weight: 800; letter-spacing: .05em; }
    h1 { margin: 10px 0; font-size: clamp(30px, 6vw, 42px); letter-spacing: -.045em; line-height: 1.2; }
    .lead { margin: 0; color: #5a6474; font-size: 17px; }
    .card { margin-top: 28px; padding: 26px; background: #fff; border: 1px solid #e8e3d9; border-radius: 18px; box-shadow: 0 10px 30px rgba(33, 40, 52, .06); }
    h2 { margin: 0 0 15px; font-size: 20px; }
    ul { margin: 0; padding-left: 20px; color: #4c5665; }
    li + li { margin-top: 7px; }
    .contact { display: grid; gap: 12px; }
    .row { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; }
    .label { min-width: 72px; color: #697384; font-size: 14px; font-weight: 700; }
    a { color: #8a6914; font-weight: 700; text-underline-offset: 3px; }
    .notice { margin: 20px 0 0; color: #697384; font-size: 14px; }
    footer { margin-top: 30px; color: #87909d; font-size: 13px; text-align: center; }
  </style>
</head>
<body>
  <main>
    <div class="brand">CLOSING MARKET</div>
    <h1>클로징마켓 고객지원</h1>
    <p class="lead">서비스 이용 중 궁금한 점이나 도움이 필요한 사항을 알려주세요.</p>
    <section class="card">
      <h2>도움이 필요한 항목</h2>
      <ul>
        <li>회원가입, 로그인, 계정 정보 변경</li>
        <li>상품 및 업체 등록·수정, 거래 관련 문의</li>
        <li>채팅, 알림, 신고 및 서비스 이용 문의</li>
      </ul>
    </section>
    <section class="card">
      <h2>문의 방법</h2>
      <div class="contact">
        <div class="row"><span class="label">이메일</span><a href="mailto:closingmarket.help@gmail.com">closingmarket.help@gmail.com</a></div>
        <div class="row"><span class="label">전화</span><a href="tel:05065674203">050-6567-4203</a></div>
        <div class="row"><span class="label">사업장</span><span>부산 남구 동명로 202, 상가1층</span></div>
      </div>
      <p class="notice">정확한 확인을 위해 문의 시 가입한 이메일 또는 닉네임과 문의 내용을 함께 알려주세요.</p>
    </section>
    <section class="card"><h2>약관 및 정책</h2><p><a href="/privacy">개인정보처리방침 보기</a></p></section>
<footer>© 2026 클로징마켓. 본 서비스는 통신판매중개자입니다.</footer>
  </main>
</body>
</html>`);
  });
  app.get("/privacy", (_req: Request, res: Response) => {
    res.type("html").send(privacyPageHtml);
  });
}


const privacyPageHtml = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="description" content="클로징마켓 개인정보처리방침" /><title>개인정보처리방침 | 클로징마켓</title><style>*{box-sizing:border-box}body{margin:0;background:#f7f6f2;color:#172033;font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;line-height:1.72}main{width:min(100% - 32px,760px);margin:0 auto;padding:52px 0 40px}.brand{color:#bf982d;font-size:14px;font-weight:800;letter-spacing:.05em}h1{margin:10px 0;font-size:clamp(30px,6vw,42px);letter-spacing:-.045em;line-height:1.2}h2{margin:30px 0 12px;font-size:20px}h3{margin:26px 0 8px;font-size:17px}p,li{color:#4c5665}ul{margin:0;padding-left:20px}li+li{margin-top:7px}a{color:#8a6914;font-weight:700;text-underline-offset:3px}.meta{margin:0 0 22px;color:#697384;font-size:14px}.back{display:inline-block;margin-bottom:20px}.card{margin-top:12px;padding:24px;background:#fff;border:1px solid #e8e3d9;border-radius:18px}.contact{display:grid;gap:12px}.row{display:flex;flex-wrap:wrap;gap:8px;align-items:baseline}.label{min-width:72px;color:#697384;font-size:14px;font-weight:700}footer{margin-top:30px;color:#87909d;font-size:13px;text-align:center}</style></head><body><main><a class="back" href="/support">← 고객지원으로 돌아가기</a><div class="brand">CLOSING MARKET</div><h1>개인정보처리방침</h1><p class="meta">시행일자: 2026년 7월 4일</p><p>클로징마켓(이하 회사)은 이용자의 개인정보를 중요시하며, 개인정보 보호법 등 관련 법령을 준수합니다. 본 개인정보처리방침은 회사가 운영하는 클로징마켓 앱 및 관련 서비스에 적용됩니다.</p><h2>1. 수집하는 개인정보 항목</h2><p>일반 회원가입 시 이메일, 비밀번호(암호화 저장), 이름을 수집합니다. 카카오 로그인 시 카카오 계정 식별정보, 이름, 프로필 사진을 수집할 수 있습니다. 선택 입력 항목으로 휴대폰 번호와 프로필 사진을 수집할 수 있습니다.</p><p>판매회원 인증 신청 시 사업자등록번호, 상호명, 대표자명, 사업자등록증 사본 이미지 및 사업장 사진을 수집합니다. 업체회원 인증 신청 시 업체명, 대표자명, 업체 연락처, 사업장 주소, 업체 소개, 업체 대표 사진 및 소개 사진, 사업자등록번호(선택)를 수집합니다.</p><p>서비스 이용 과정에서 등록 상품 정보 및 사진, 채팅 메시지 및 첨부 이미지, 찜·최근 본 상품 이용기록, 거래 후기, 신고 및 1:1 문의 내용, 접속 로그, 기기 푸시 알림 토큰이 생성·수집될 수 있습니다.</p><h2>2. 개인정보의 수집 및 이용 목적</h2><ul><li>회원 가입 의사 확인 및 본인 식별·인증</li><li>판매회원·업체회원의 실제 사업자 여부 확인 및 부정 이용 방지</li><li>중고 물품 거래 중개, 채팅·알림 등 서비스 제공</li><li>거래 후기, 신고, 1:1 문의 접수 및 처리</li><li>공지사항 전달, 고객 상담 및 이용자 보호</li></ul><h2>3. 개인정보의 보유 및 이용 기간</h2><p>회사는 원칙적으로 개인정보 수집·이용 목적이 달성된 후 또는 회원 탈퇴 시 해당 정보를 지체 없이 파기합니다. 다만 관계 법령 위반에 따른 수사·조사가 진행 중인 경우 해당 절차 종료 시까지, 서비스 이용 관련 분쟁 해결이 필요한 경우 분쟁 해결 시까지 보존할 수 있습니다.</p><p>탈퇴 회원의 채팅 내역과 거래 후기 등 다른 이용자와 연결된 기록은 거래 신뢰도 유지를 위해 보존될 수 있으나, 탈퇴 회원을 식별할 수 있는 이름·이메일·전화번호 등은 즉시 익명화 처리됩니다.</p><h2>4. 개인정보의 제3자 제공</h2><p>회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 이용자가 사전에 동의했거나, 법령의 규정에 의거하여 수사기관이 적법한 절차로 요구하는 경우는 예외로 합니다.</p><h2>5. 개인정보 처리업무의 위탁</h2><p>회사는 원활한 서비스 제공을 위해 소셜 로그인 인증(카카오), 클라우드 서버 및 데이터 저장, 푸시 알림 발송(Expo Push Notification Service) 업무를 외부 서비스 제공업체에 위탁할 수 있습니다.</p><h2>6. 이용자의 권리와 행사 방법</h2><p>이용자는 언제든지 등록된 개인정보를 조회하거나 수정할 수 있습니다. 마이페이지의 계정 설정에서 이름·전화번호·프로필 사진 등을 직접 수정할 수 있으며, 회원 탈퇴 또는 고객센터 문의를 통해 열람·정정·삭제·처리정지를 요구할 수 있습니다.</p><h2>7. 개인정보의 파기 절차 및 방법</h2><p>개인정보 보유기간의 경과 또는 처리 목적 달성 등 개인정보가 불필요하게 된 경우 지체 없이 파기합니다. 전자적 파일은 복구 및 재생이 불가능한 방법으로 삭제하고, 종이 문서는 분쇄 또는 소각합니다.</p><h2>8. 개인정보의 안전성 확보 조치</h2><ul><li>비밀번호 등 주요 정보의 암호화 저장</li><li>개인정보 접근 권한 관리 및 통제</li><li>보안 프로그램 설치 및 갱신</li></ul><h2>9. 아동의 개인정보 보호</h2><p>본 서비스는 만 14세 이상의 이용자를 대상으로 하며, 만 14세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다.</p><h2>10. 개인정보 보호책임자</h2><div class="card"><div class="contact"><div class="row"><span class="label">담당 부서</span><span>운영팀</span></div><div class="row"><span class="label">성명</span><span>김찬영</span></div><div class="row"><span class="label">이메일</span><a href="mailto:closingmarket.help@gmail.com">closingmarket.help@gmail.com</a></div><div class="row"><span class="label">전화</span><a href="tel:05065674203">050-6567-4203</a></div></div></div><h2>11. 개인정보처리방침의 변경</h2><p>이 개인정보처리방침은 법령, 정책 또는 보안 기술의 변경에 따라 내용이 추가·삭제·수정될 수 있으며, 변경 시 시행 최소 7일 전에 앱 내 공지사항을 통해 고지합니다.</p><footer>© 2026 클로징마켓. 본 서비스는 통신판매중개자입니다.</footer></main></body></html>`;
