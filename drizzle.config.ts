import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// TiDB Cloud 등 TLS 접속이 필수인 매니지드 MySQL을 지원하기 위해
// 연결 문자열을 직접 파싱해서 구조화된 필드 + ssl 옵션으로 전달합니다.
// (url 문자열 하나만 넘기면 drizzle-kit이 TLS 옵션을 인식하지 못해
//  "Connections using insecure transport are prohibited" 에러가 발생합니다.)
const parsed = new URL(connectionString);
const useSsl = process.env.DB_SSL === "true";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    ...(useSsl ? { ssl: { minVersion: "TLSv1.2" } } : {}),
  },
});

