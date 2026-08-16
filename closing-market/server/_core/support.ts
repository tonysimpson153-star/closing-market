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
    <footer>© 2026 클로징마켓. 본 서비스는 통신판매중개자입니다.</footer>
  </main>
</body>
</html>`);
  });
}
