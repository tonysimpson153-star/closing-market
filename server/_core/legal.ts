import type { Express, Request, Response } from "express";

export function registerLegalRoutes(app: Express) {
  // 이용약관 페이지
  app.get("/terms", (_req: Request, res: Response) => {
    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>이용약관 - 클로징마켓</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      background-color: white;
      min-height: 100vh;
    }
    h1 {
      font-size: 32px;
      margin-bottom: 10px;
      color: #0a7ea4;
    }
    .meta {
      font-size: 14px;
      color: #999;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    h2 {
      font-size: 18px;
      font-weight: 600;
      margin-top: 30px;
      margin-bottom: 15px;
      color: #222;
    }
    p {
      margin-bottom: 12px;
      color: #555;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .section {
      margin-bottom: 25px;
    }
    .footer-note {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
      font-style: italic;
      line-height: 1.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>클로징마켓 이용약관</h1>
    <div class="meta">시행일자: 2026년 7월 4일</div>

    <div class="section">
      <h2>제1조 (목적)</h2>
      <p>이 약관은 클로징마켓(이하 "회사")이 제공하는 중고 물품 거래 중개 및 전문 업체 연결 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
    </div>

    <div class="section">
      <h2>제2조 (정의)</h2>
      <p>1. "서비스"란 회사가 제공하는 중고 물품 등록·거래 중개 및 업체 정보 제공 플랫폼을 의미합니다.
2. "회원"이란 이 약관에 동의하고 서비스에 가입한 자를 의미합니다.
3. "판매회원"이란 사업자등록증 등 서류 제출을 통해 회사의 인증을 받아 물품을 등록·판매할 수 있는 회원을 의미합니다.
4. "업체회원"이란 인테리어, 철거 등 전문 서비스 업체로서 회사의 인증을 받아 서비스 정보를 게시하는 회원을 의미합니다.
5. "게시물"이란 회원이 서비스 내에 게시한 상품 정보, 사진, 채팅 메시지, 후기 등 일체의 정보를 의미합니다.</p>
    </div>

    <div class="section">
      <h2>제3조 (약관의 효력 및 변경)</h2>
      <p>1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력을 발생합니다.
2. 회사는 관계 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있으며, 변경 시 적용일자 및 변경사유를 최소 7일 전에 공지합니다. 다만 이용자에게 불리한 변경의 경우 30일 전에 공지합니다.</p>
    </div>

    <div class="section">
      <h2>제4조 (회원가입 및 인증)</h2>
      <p>1. 회원가입은 이메일 또는 카카오 계정을 통해 신청하며, 회사가 이를 승낙함으로써 성립합니다.
2. 판매회원 및 업체회원 자격은 사업자등록증 등 관련 서류 제출 후 회사의 심사·승인을 통해 부여됩니다.
3. 회사는 다음 각 호에 해당하는 경우 가입 신청을 승인하지 않거나 사후에 이용계약을 해지할 수 있습니다.
   가. 타인의 명의를 이용하거나 허위 정보를 기재한 경우
   나. 제출한 사업자 정보가 사실과 다르거나 확인이 불가능한 경우
   다. 기타 회원으로 등록하는 것이 서비스 운영에 현저히 지장이 있다고 판단되는 경우</p>
    </div>

    <div class="section">
      <h2>제5조 (회원의 의무 및 금지행위)</h2>
      <p>회원은 다음 각 호의 행위를 하여서는 안 됩니다.

1. 허위 매물 등록, 허위 정보 기재 등 기망 행위
2. 타인의 정보 도용 또는 사업자 정보 허위 제출
3. 회사 및 제3자의 지식재산권 등 권리를 침해하는 행위
4. 다른 회원에 대한 욕설, 비방, 명예훼손 행위
5. 서비스를 이용한 불법적인 물품(장물, 위조품 등)의 거래
6. 서비스의 안정적 운영을 방해할 수 있는 행위(비정상적인 방법의 접속, 서버에 무리를 주는 행위 등)
7. 회사의 승인 없이 서비스를 영리·비영리 목적으로 변형, 복제, 배포하는 행위</p>
    </div>

    <div class="section">
      <h2>제6조 (서비스 이용 제한)</h2>
      <p>1. 회사는 회원이 제5조를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 경고, 일시정지, 영구이용정지 등의 조치를 취할 수 있습니다.
2. 이용정지 등 조치에 이의가 있는 회원은 회사가 정한 절차에 따라 이의신청을 할 수 있습니다.</p>
    </div>

    <div class="section">
      <h2>제7조 (거래에 대한 회사의 지위)</h2>
      <p>1. 회사는 통신판매의 당사자가 아니며, 회원 간의 상품 정보 및 거래를 중개하는 통신판매중개자입니다.
2. 회사는 회원 간 이루어지는 거래에 대해 원칙적으로 판매자 또는 구매자로서의 책임을 지지 않으며, 상품의 품질, 정보의 진위, 거래 이행 여부 등에 관한 책임은 거래 당사자인 회원에게 있습니다.
3. 회사는 판매회원·업체회원의 인증 심사를 통해 서비스 신뢰도 제고를 위해 노력하나, 이 인증이 거래 안전을 보증하는 것은 아닙니다.</p>
    </div>

    <div class="section">
      <h2>제8조 (게시물의 관리)</h2>
      <p>1. 회원이 등록한 게시물의 저작권은 해당 회원에게 귀속됩니다.
2. 회사는 게시물이 제5조의 금지행위에 해당하거나 관계 법령에 위반된다고 판단되는 경우 사전 통지 없이 해당 게시물을 삭제하거나 이동시킬 수 있습니다.
3. 회원 탈퇴 시에도 다른 회원과의 거래·채팅·후기 기록 등은 서비스 신뢰도 유지를 위해 보존될 수 있으며, 이 경우 탈퇴 회원의 개인 식별정보는 익명화하여 처리합니다. (자세한 내용은 개인정보처리방침 참조)</p>
    </div>

    <div class="section">
      <h2>제9조 (회사의 면책)</h2>
      <p>1. 회사는 천재지변, 통신장애 등 불가항력으로 인하여 서비스를 제공할 수 없는 경우 책임이 면제됩니다.
2. 회사는 회원 간 거래에서 발생한 분쟁에 대해 개입할 의무가 없으며, 이로 인한 손해에 대해 책임을 지지 않습니다. 다만 회사는 원활한 분쟁 해결을 위하여 신고 기능, 고객센터 등을 통해 합리적인 범위 내에서 지원할 수 있습니다.
3. 회사는 회원이 게시한 정보의 신뢰성, 정확성에 대해 보증하지 않습니다.</p>
    </div>

    <div class="section">
      <h2>제10조 (분쟁해결 및 관할법원)</h2>
      <p>1. 서비스 이용과 관련하여 회사와 회원 간 분쟁이 발생한 경우, 양 당사자는 우선적으로 협의를 통해 해결하도록 노력합니다.
2. 협의가 이루어지지 않을 경우 관련 법령에 따른 관할법원에 소를 제기할 수 있습니다.</p>
    </div>

    <div class="section">
      <h2>제11조 (약관 외 준칙)</h2>
      <p>이 약관에 명시되지 않은 사항은 관계 법령 및 회사가 정한 개별 서비스의 이용약관, 운영정책 및 규칙 등에 따릅니다.</p>
    </div>

    <div class="footer-note">
      참고: 이 문서는 AI가 참고용으로 작성한 표준 약관 초안이며 법률 자문을 대체하지 않습니다. 실제 서비스 운영 전 법률 전문가의 검토를 권장합니다.
    </div>
  </div>
</body>
</html>
    `;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });

  // 개인정보처리방침 페이지
  app.get("/privacy", (_req: Request, res: Response) => {
    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>개인정보처리방침 - 클로징마켓</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      background-color: white;
      min-height: 100vh;
    }
    h1 {
      font-size: 32px;
      margin-bottom: 10px;
      color: #0a7ea4;
    }
    .meta {
      font-size: 14px;
      color: #999;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    h2 {
      font-size: 18px;
      font-weight: 600;
      margin-top: 30px;
      margin-bottom: 15px;
      color: #222;
    }
    p {
      margin-bottom: 12px;
      color: #555;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .section {
      margin-bottom: 25px;
    }
    .footer-note {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
      font-style: italic;
      line-height: 1.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>클로징마켓 개인정보처리방침</h1>
    <div class="meta">시행일자: 2026년 7월 4일</div>

    <div class="section">
      <h2>1. 개인정보의 수집 및 이용 목적</h2>
      <p>클로징마켓(이하 "회사")은 다음의 목적을 위하여 개인정보를 수집하고 이용합니다.
- 회원 가입 및 관리
- 서비스 제공 및 개선
- 고객 상담 및 지원
- 마케팅 및 광고 (동의 시)</p>
    </div>

    <div class="section">
      <h2>2. 수집하는 개인정보의 항목</h2>
      <p>회사는 다음과 같은 개인정보를 수집합니다.
- 필수: 이름, 이메일, 전화번호, 로그인 ID
- 선택: 프로필 사진, 주소, 기타 추가 정보
- 자동 수집: IP 주소, 쿠키, 접속 로그, 기기 정보</p>
    </div>

    <div class="section">
      <h2>3. 개인정보의 보유 및 이용 기간</h2>
      <p>개인정보는 다음과 같이 보유 및 이용됩니다.
- 회원 가입 정보: 회원 탈퇴 시까지
- 거래 관련 정보: 거래 완료 후 5년
- 마케팅 정보: 동의 철회 시까지</p>
    </div>

    <div class="section">
      <h2>4. 개인정보의 제3자 제공</h2>
      <p>회사는 원칙적으로 개인정보를 제3자에게 제공하지 않습니다. 다만 다음의 경우는 예외입니다.
- 법령에 따른 요청
- 회원의 명시적 동의
- 서비스 제공을 위한 필수 제휴사</p>
    </div>

    <div class="section">
      <h2>5. 카카오 계정 연동 시 정보 수집</h2>
      <p>카카오 계정으로 로그인할 경우 다음 정보를 수집합니다.
- 카카오 계정 ID (OpenID)
- 카카오 프로필 이름
- 카카오 프로필 이메일
이 정보는 회사의 회원 인증 및 프로필 설정에만 사용되며, 별도의 목적으로 활용되지 않습니다.</p>
    </div>

    <div class="section">
      <h2>6. 개인정보의 안전성 확보</h2>
      <p>회사는 개인정보의 안전성을 확보하기 위해 다음의 조치를 취합니다.
- 암호화된 통신 (HTTPS)
- 접근 권한 제한
- 정기적인 보안 감시
- 직원 보안 교육</p>
    </div>

    <div class="section">
      <h2>7. 개인정보 관련 권리</h2>
      <p>회원은 언제든지 다음의 권리를 행사할 수 있습니다.
- 개인정보 열람 요청
- 개인정보 수정 요청
- 개인정보 삭제 요청 (회원 탈퇴)
- 개인정보 처리 동의 철회</p>
    </div>

    <div class="section">
      <h2>8. 개인정보 보호책임자</h2>
      <p>개인정보 관련 문의 사항이 있으시면 아래로 연락주시기 바랍니다.
- 이메일: support@closingmarket.com
- 고객센터: 1234-5678</p>
    </div>

    <div class="footer-note">
      참고: 이 문서는 AI가 참고용으로 작성한 표준 개인정보처리방침 초안이며 법률 자문을 대체하지 않습니다. 실제 서비스 운영 전 법률 전문가의 검토를 권장합니다.
    </div>
  </div>
</body>
</html>
    `;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });
}
