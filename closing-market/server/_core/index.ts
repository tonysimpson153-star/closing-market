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
