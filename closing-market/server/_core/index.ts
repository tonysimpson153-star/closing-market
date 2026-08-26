import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerLegalRoutes } from "./legal";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { ensureUsersSchemaCompatibility } from "./schemaCompat";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  await ensureUsersSchemaCompatibility();
  const app = express();
  // Render 등 리버스 프록시 뒤에서 실제 클라이언트 IP를 올바르게 인식하도록 설정
  // (X-Forwarded-For 헤더 신뢰) - Rate Limit이 제대로 동작하려면 필요합니다.
  app.set("trust proxy", 1);
  const server = createServer(app);

  // CORS - 알려진 도메인만 허용 (네이티브 앱 요청은 Origin 헤더가 없어 영향받지 않습니다)
  const allowedOrigins = [
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()) : []),
    ...(process.env.WEB_APP_URL ? [process.env.WEB_APP_URL] : []),
    "http://localhost:3000",
    "http://localhost:8081",
  ].filter(Boolean);
  const isRenderPreview = (origin: string) => /\.onrender\.com$/.test(new URL(origin).hostname);
    const isManusPreview = (origin: string) => /\.manus\.computer$/.test(new URL(origin).hostname);


  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      let allow = false;
      try {
        allow = allow = allowedOrigins.includes(origin) || isRenderPreview(origin) || isManusPreview(origin);

      } catch {
        allow = false;
      }
      if (allow) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Access-Control-Allow-Credentials", "true");
      }
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerLegalRoutes(app);

  // Render 서비스는 API 서버이므로, 브라우저에서 직접 열 수 있는 공개 안내 페이지를 제공합니다.
  app.get(["/", "/home"], (_req, res) => {
    res
      .status(200)
      .type("html")
      .send(`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>클로징마켓</title>
  <style>
    :root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif; }
    body { margin: 0; background: #fff; color: #222; }
    main { box-sizing: border-box; width: min(760px, 100%); margin: 0 auto; padding: 56px 24px 64px; }
    .brand { color: #D4AF37; font-weight: 800; letter-spacing: .08em; font-size: 14px; }
    h1 { margin: 18px 0 12px; font-size: 34px; line-height: 1.25; }
    .lead { color: #666; line-height: 1.7; margin: 0 0 28px; }
    .links { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
    .links a { display: block; padding: 20px; border: 1px solid #eadfb8; border-radius: 16px; color: #222; text-decoration: none; background: #fffdf7; font-weight: 700; }
    .links a span { display: block; margin-top: 7px; color: #777; font-size: 13px; font-weight: 400; line-height: 1.5; }
    footer { margin-top: 34px; color: #888; font-size: 12px; line-height: 1.7; }
  </style>
</head>
<body>
  <main>
    <div class="brand">CLOSING MARKET</div>
    <h1>사업을 정리하고, 다시 시작하는 곳</h1>
    <p class="lead">폐업·사업정리 물품 중고거래와 사업에 필요한 전문 업체 연결을 제공하는 클로징마켓입니다.</p>
    <div class="links">
      <a href="/privacy">개인정보처리방침<span>개인정보 수집·이용 및 보호 안내</span></a>
      <a href="/terms">이용약관<span>서비스 이용 조건과 회원의 권리·의무</span></a>
      <a href="/support">고객지원/문의<span>서비스 이용 문의와 이메일 상담 안내</span></a>
      <a href="/community-policy">신고 및 커뮤니티 운영정책<span>게시물 기준과 신고 처리 절차</span></a>
    </div>
    <footer>문의: closingmarket.help@gmail.com</footer>
  </main>
</body>
</html>`);
  });

  // 실제 1:1 문의 작성·조회는 앱 내부의 /support/inquiries 화면에서 처리합니다.
  app.get(["/support", "/support/"], (_req, res) => {
    res
      .status(200)
      .type("html")
      .send(`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>클로징마켓 고객센터</title>
  <style>
    :root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif; }
    body { margin: 0; background: #fff; color: #222; }
    main { box-sizing: border-box; width: min(680px, 100%); margin: 0 auto; padding: 56px 24px 64px; }
    .brand { color: #D4AF37; font-weight: 800; letter-spacing: .08em; font-size: 14px; }
    h1 { margin: 18px 0 10px; font-size: 32px; line-height: 1.25; }
    .lead { color: #666; line-height: 1.7; margin: 0 0 28px; }
    section { border: 1px solid #eadfb8; border-radius: 16px; padding: 22px; margin-top: 14px; background: #fffdf7; }
    h2 { font-size: 17px; margin: 0 0 10px; }
    p { line-height: 1.7; margin: 0; }
    a { display: inline-block; margin-top: 18px; padding: 12px 18px; border-radius: 10px; background: #D4AF37; color: #222; text-decoration: none; font-weight: 700; }
    small { display: block; color: #888; margin-top: 28px; line-height: 1.6; }
  </style>
</head>
<body>
  <main>
    <div class="brand">CLOSING MARKET</div>
    <h1>클로징마켓 고객센터</h1>
    <p class="lead">서비스 이용 중 궁금한 점이나 불편한 점이 있으신가요?</p>
    <section>
      <h2>1:1 문의는 앱에서 이용해주세요</h2>
      <p>클로징마켓 앱에서 <strong>마이페이지 → 고객센터 문의</strong>로 들어가 문의를 작성하고 답변을 확인할 수 있습니다.</p>
    </section>
    <section>
      <h2>이메일 문의</h2>
      <p>closingmarket.help@gmail.com</p>
      <a href="mailto:closingmarket.help@gmail.com">이메일 보내기</a>
    </section>
    <small>이 페이지는 고객센터 안내용 웹 페이지입니다. 회원별 문의 내역은 로그인된 앱에서 안전하게 확인할 수 있습니다.</small>
  </main>
</body>
</html>`);
  });

  app.get(["/community-policy", "/report-policy"], (_req, res) => {
    res
      .status(200)
      .type("html")
      .send(`<!doctype html>
<html lang="ko">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>신고 및 커뮤니티 운영정책 - 클로징마켓</title>
<style>body{margin:0;background:#f7f7f7;color:#222;font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;line-height:1.7}.container{max-width:900px;margin:0 auto;padding:40px 20px 64px;background:#fff;min-height:100vh}.brand{color:#D4AF37;font-weight:800;letter-spacing:.08em;font-size:14px}nav{display:flex;flex-wrap:wrap;gap:14px;margin:18px 0 30px;padding-bottom:16px;border-bottom:1px solid #eadfb8}nav a{color:#6d5a20;text-decoration:none;font-size:13px}h1{font-size:30px;line-height:1.3}h2{font-size:19px;margin:28px 0 10px}p{white-space:pre-wrap}.meta{color:#888;border-bottom:1px solid #eee;padding-bottom:18px}.note{margin-top:40px;padding-top:20px;border-top:1px solid #eee;color:#888;font-size:12px}</style>
</head>
<body><div class="container"><div class="brand">CLOSING MARKET</div><nav><a href="/privacy">개인정보처리방침</a><a href="/terms">이용약관</a><a href="/support">고객지원/문의</a><a href="/community-policy">신고 및 커뮤니티 운영정책</a></nav><h1>신고 및 커뮤니티 운영정책</h1><div class="meta">시행일자: 2026년 8월 6일</div><h2>1. 목적</h2><p>클로징마켓 서비스의 안전한 이용 질서와 신고·게시물 관리 기준을 정합니다.</p><h2>2. 제한되는 게시물 및 행위</h2><p>허위 매물·허위 사업자 정보·과장 광고, 불법 물품 거래, 타인의 권리 침해, 욕설·비방·혐오 표현, 개인정보 무단 노출, 스팸·사기 유도 및 신고 보복 행위는 제한됩니다.</p><h2>3. 신고 및 처리</h2><p>회원은 고객지원/문의 경로를 통해 신고 대상과 사유를 알려주실 수 있습니다. 운영자는 확인 후 게시물 삭제·비공개, 이용 제한, 추가 자료 요청 등의 조치를 취할 수 있습니다.</p><h2>4. 이용 제한</h2><p>금지행위가 반복되거나 중대한 경우 경고, 게시물 제한, 일시 정지 또는 영구 이용 정지가 이루어질 수 있습니다.</p><h2>5. 문의처</h2><p>closingmarket.help@gmail.com</p><div class="note">본 정책은 서비스 운영을 위한 초안이며 실제 적용 전 관련 법령과 운영 절차에 맞춘 법률 전문가 검토를 권장합니다.</div></div></body></html>`);
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
