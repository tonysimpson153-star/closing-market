import type { Express, Request, Response } from "express";

const sharedStyles = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #f7f6f2; color: #172033; font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Segoe UI", sans-serif; line-height: 1.72; }
  main { width: min(100% - 32px, 760px); margin: 0 auto; padding: 52px 0 40px; }
  .brand { color: #bf982d; font-size: 14px; font-weight: 800; letter-spacing: .05em; }
  h1 { margin: 10px 0; font-size: clamp(30px, 6vw, 42px); letter-spacing: -.045em; line-height: 1.2; }
  h2 { margin: 30px 0 12px; font-size: 20px; letter-spacing: -.025em; }
  h3 { margin: 26px 0 8px; font-size: 17px; letter-spacing: -.02em; }
  p, li { color: #4c5665; }
  .lead { margin: 0; color: #5a6474; font-size: 17px; }
  .card { margin-top: 28px; padding: 26px; background: #fff; border: 1px solid #e8e3d9; border-radius: 18px; box-shadow: 0 10px 30px rgba(33, 40, 52, .06); }
  ul { margin: 0; padding-left: 20px; }
  li + li { margin-top: 7px; }
  .contact { display: grid; gap: 12px; }
  .contact-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; }
  .label { min-width: 72px; color: #697384; font-size: 14px; font-weight: 700; }
  a { color: #8a6914; font-weight: 700; text-decoration-thickness: 1px; text-underline-offset: 3px; }
  .notice { margin: 20px 0 0; color: #697384; font-size: 14px; }
  .meta { margin: 0 0 22px; color: #697384; font-size: 14px; }
  .back { display: inline-block; margin-bottom: 20px; }
  footer { margin-top: 30px; color: #87909d; font-size: 13px; text-align: center; }
`;

function documentHtml(title: string, description: string, body: string) {
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${description}" />
    <title>${title} | 클로징마켓</title>
    <style>${sharedStyles}</style>
  </head>
  <body><main>${body}</main></body>
</html>`;
}

export const supportPageHtml = documentHtml(
  "고객지원",
  "클로징마켓 고객지원 및 문의 안내",
  `
    <div class="brand">CLOSING MARKET</div>
    <h1>클로징마켓 고객지원</h1>
    <p class="lead">서비스 이용 중 궁금한 점이나 도움이 필요한 사항을 알려주세요.</p>
    <section class="card" aria-labelledby="help-title">
      <h2 id="help-title">도움이 필요한 항목</h2>
      <ul>
        <li>회원가입, 로그인, 계정 정보 변경</li>
        <li>상품 및 업체 등록·수정, 거래 관련 문의</li>
        <li>채팅, 알림, 신고 및 서비스 이용 문의</li>
      </ul>
    </section>
    <section class="card" aria-labelledby="contact-title">
      <h2 id="contact-title">문의 방법</h2>
      <div class="contact">
        <div class="contact-row"><span class="label">이메일</span><a href="mailto:closingmarket.help@gmail.com">closingmarket.help@gmail.com</a></div>
        <div class="contact-row"><span class="label">전화</span><a href="tel:05065674203">050-6567-4203</a></div>
        <div class="contact-row"><span class="label">사업장</span><span>부산 남구 동명로 202, 상가1층</span></div>
      </div>
      <p class="notice">정확한 확인을 위해 문의 시 가입한 이메일 또는 닉네임과 문의 내용을 함께 알려주세요.</p>
    </section>
    <section class="card" aria-labelledby="policy-title">
      <h2 id="policy-title">약관 및 정책</h2>
      <p><a href="/privacy">개인정보처리방침 보기</a></p>
      <p><a href="/delete-account">계정 삭제 요청 안내</a></p>
    </section>
    <footer>© 2026 클로징마켓. 본 서비스는 통신판매중개자입니다.</footer>
  `,
);

export const accountDeletionPageHtml = documentHtml(
  "계정 삭제 요청",
  "클로징마켓 계정 및 관련 개인정보 삭제 요청 방법 안내",
  `
    <a class="back" href="/support">← 고객지원으로 돌아가기</a>
    <div class="brand">CLOSING MARKET</div>
    <h1>계정 삭제 요청</h1>
    <p class="lead">클로징마켓 이용자는 언제든지 계정 삭제를 요청할 수 있습니다.</p>
    <section class="card" aria-labelledby="request-title">
      <h2 id="request-title">요청 방법</h2>
      <p>아래 이메일로 가입한 이메일 주소 또는 닉네임을 함께 보내 주세요. 본인 확인 후 계정 삭제를 처리합니다.</p>
      <p><a href="mailto:closingmarket.help@gmail.com?subject=%5B%ED%81%B4%EB%A1%9C%EC%A7%95%EB%A7%88%EC%BC%93%5D%20%EA%B3%84%EC%A0%95%20%EC%82%AD%EC%A0%9C%20%EC%9A%94%EC%B2%AD&amp;body=%EA%B0%80%EC%9E%85%20%EC%9D%B4%EB%A9%94%EC%9D%BC%20%EB%98%90%EB%8A%94%20%EB%8B%89%EB%84%A4%EC%9E%84%3A%0A%0A%EA%B3%84%EC%A0%95%20%EC%82%AD%EC%A0%9C%EB%A5%BC%20%EC%9A%94%EC%B2%AD%ED%95%A9%EB%8B%88%EB%8B%A4.">closingmarket.help@gmail.com으로 계정 삭제 요청하기</a></p>
    </section>
    <section class="card" aria-labelledby="delete-data-title">
      <h2 id="delete-data-title">삭제되는 정보</h2>
      <p>계정 삭제 처리 시 계정 프로필, 이메일 주소, 전화번호, 프로필 사진, 찜·최근 본 상품 기록, 기기 푸시 알림 토큰 및 계정에 연결된 개인 식별정보를 삭제하거나 익명화합니다. 판매자·업체 인증을 위해 제출한 개인정보는 관련 법령상 보관 의무가 없는 범위에서 삭제합니다.</p>
    </section>
    <section class="card" aria-labelledby="retention-title">
      <h2 id="retention-title">보관될 수 있는 정보</h2>
      <p>거래 상대방의 기록과 연결된 채팅·거래 후기 등은 거래 신뢰도 유지, 분쟁 해결 및 법령상 의무 이행을 위해 보관될 수 있습니다. 이 경우 계정을 식별할 수 있는 이름·이메일·전화번호는 익명화합니다. 자세한 기준은 <a href="/privacy">개인정보처리방침</a>에서 확인할 수 있습니다.</p>
    </section>
    <p class="notice">계정 삭제 요청은 본인 확인 후 처리하며, 법령상 보존 의무나 진행 중인 분쟁이 있는 경우 처리 범위가 제한될 수 있습니다.</p>
    <footer>© 2026 클로징마켓. 본 서비스는 통신판매중개자입니다.</footer>
  `,
);

export const privacyPageHtml = documentHtml(
  "개인정보처리방침",
  "클로징마켓 개인정보처리방침",
  `
    <a class="back" href="/support">← 고객지원으로 돌아가기</a>
    <div class="brand">CLOSING MARKET</div>
    <h1>개인정보처리방침</h1>
    <p class="meta">시행일자: 2026년 7월 4일</p>
    <p>클로징마켓(이하 “회사”)은 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법령을 준수합니다. 본 개인정보처리방침은 회사가 운영하는 클로징마켓 앱 및 관련 서비스에 적용됩니다.</p>

    <h2>1. 수집하는 개인정보 항목</h2>
    <h3>가. 일반 회원가입 시</h3><p>이메일, 비밀번호(암호화 저장), 이름을 수집합니다.</p>
    <h3>나. 카카오 로그인 시</h3><p>카카오 계정 식별정보, 이름, 프로필 사진을 수집할 수 있으며, 이는 카카오 제공 동의 항목에 한합니다.</p>
    <h3>다. 선택 입력 항목</h3><p>휴대폰 번호와 프로필 사진을 수집할 수 있습니다.</p>
    <h3>라. 판매회원 인증 신청 시</h3><p>사업자등록번호, 상호명, 대표자명, 사업자등록증 사본 이미지 및 사업장 사진을 수집합니다.</p>
    <h3>마. 업체회원 인증 신청 시</h3><p>업체명, 대표자명, 업체 연락처, 사업장 주소, 업체 소개, 업체 대표 사진 및 소개 사진, 사업자등록번호(선택)를 수집합니다.</p>
    <h3>바. 서비스 이용 과정에서</h3><p>등록 상품 정보 및 사진, 채팅 메시지 및 첨부 이미지, 찜·최근 본 상품 이용기록, 거래 후기, 신고 및 1:1 문의 내용, 접속 로그, 기기 푸시 알림 토큰이 생성·수집될 수 있습니다.</p>

    <h2>2. 개인정보의 수집 및 이용 목적</h2>
    <ul>
      <li>회원 가입 의사 확인 및 본인 식별·인증</li>
      <li>판매회원·업체회원의 실제 사업자 여부 확인 및 부정 이용 방지</li>
      <li>중고 물품 거래 중개, 채팅·알림 등 서비스 제공</li>
      <li>거래 후기, 신고, 1:1 문의 접수 및 처리</li>
      <li>공지사항 전달, 고객 상담 및 이용자 보호</li>
    </ul>

    <h2>3. 개인정보의 보유 및 이용 기간</h2>
    <p>회사는 원칙적으로 개인정보 수집·이용 목적이 달성된 후 또는 회원 탈퇴 시 해당 정보를 지체 없이 파기합니다. 다만 관계 법령 위반에 따른 수사·조사가 진행 중인 경우 해당 절차 종료 시까지, 서비스 이용 관련 분쟁 해결이 필요한 경우 분쟁 해결 시까지 보존할 수 있습니다.</p>
    <p>탈퇴 회원의 채팅 내역과 거래 후기 등 다른 이용자와 연결된 기록은 거래 신뢰도 유지를 위해 보존될 수 있으나, 탈퇴 회원을 식별할 수 있는 이름·이메일·전화번호 등은 즉시 익명화 처리됩니다.</p>

    <h2>4. 개인정보의 제3자 제공</h2>
    <p>회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 이용자가 사전에 동의했거나, 법령의 규정에 의거하여 수사기관이 적법한 절차로 요구하는 경우는 예외로 합니다.</p>

    <h2>5. 개인정보 처리업무의 위탁</h2>
    <p>회사는 원활한 서비스 제공을 위해 소셜 로그인 인증(카카오), 클라우드 서버 및 데이터 저장, 푸시 알림 발송(Expo Push Notification Service) 업무를 외부 서비스 제공업체에 위탁할 수 있습니다. 회사는 관련 법령에 따라 위탁업무 수행 목적 외 개인정보 처리 금지와 보호조치를 관리합니다.</p>

    <h2>6. 이용자의 권리와 행사 방법</h2>
    <p>이용자는 언제든지 등록된 개인정보를 조회하거나 수정할 수 있습니다. 마이페이지의 계정 설정에서 이름·전화번호·프로필 사진 등을 직접 수정할 수 있으며, 회원 탈퇴 또는 고객센터 문의를 통해 열람·정정·삭제·처리정지를 요구할 수 있습니다. <a href="/delete-account">계정 삭제 요청 방법 보기</a></p>

    <h2>7. 개인정보의 파기 절차 및 방법</h2>
    <p>개인정보 보유기간의 경과 또는 처리 목적 달성 등 개인정보가 불필요하게 된 경우 지체 없이 파기합니다. 전자적 파일은 복구 및 재생이 불가능한 방법으로 삭제하고, 종이 문서는 분쇄 또는 소각합니다.</p>

    <h2>8. 개인정보의 안전성 확보 조치</h2>
    <ul>
      <li>비밀번호 등 주요 정보의 암호화 저장</li>
      <li>개인정보 접근 권한 관리 및 통제</li>
      <li>보안 프로그램 설치 및 갱신</li>
    </ul>

    <h2>9. 아동의 개인정보 보호</h2>
    <p>본 서비스는 만 14세 이상의 이용자를 대상으로 하며, 만 14세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다.</p>

    <h2>10. 개인정보 보호책임자</h2>
    <div class="card">
      <div class="contact">
        <div class="contact-row"><span class="label">담당 부서</span><span>운영팀</span></div>
        <div class="contact-row"><span class="label">성명</span><span>김찬영</span></div>
        <div class="contact-row"><span class="label">이메일</span><a href="mailto:closingmarket.help@gmail.com">closingmarket.help@gmail.com</a></div>
        <div class="contact-row"><span class="label">전화</span><a href="tel:05065674203">050-6567-4203</a></div>
      </div>
    </div>

    <h2>11. 개인정보처리방침의 변경</h2>
    <p>이 개인정보처리방침은 법령, 정책 또는 보안 기술의 변경에 따라 내용이 추가·삭제·수정될 수 있으며, 변경 시 시행 최소 7일 전에 앱 내 공지사항을 통해 고지합니다.</p>
    <footer>© 2026 클로징마켓. 본 서비스는 통신판매중개자입니다.</footer>
  `,
);

export function registerSupportRoutes(app: Express) {
  app.get("/", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", service: "closing-market" });
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  app.get("/support", (_req: Request, res: Response) => {
    res.type("html").send(supportPageHtml);
  });

  app.get("/privacy", (_req: Request, res: Response) => {
    res.type("html").send(privacyPageHtml);
  });

  app.get("/delete-account", (_req: Request, res: Response) => {
    res.type("html").send(accountDeletionPageHtml);
  });
}
