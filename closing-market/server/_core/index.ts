import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";

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
