import crypto from "crypto";

const isProduction = process.env.NODE_ENV === "production";

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (isProduction) {
    console.error(
      "[심각] JWT_SECRET 환경변수가 설정되지 않았습니다. 서버 실행마다 바뀌는 임시 랜덤 값을 사용합니다 " +
        "(재배포/재시작할 때마다 모든 로그인이 풀립니다). Manus/배포 환경변수에 JWT_SECRET을 반드시 추가하세요."
    );
  } else {
    console.warn(
      "[경고] JWT_SECRET이 설정되지 않아 개발용 임시 값을 사용합니다. .env에 JWT_SECRET을 추가하세요."
    );
  }
  // 고정된 문자열을 절대 쓰지 않기 위해 매 부팅마다 랜덤 값을 생성합니다.
  return crypto.randomBytes(32).toString("hex");
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  jwtSecret: resolveJwtSecret(),
  databaseUrl: process.env.DATABASE_URL ?? "",
  // TiDB Cloud 등 TLS 접속이 필수인 매니지드 MySQL을 쓸 때 "true"로 설정
  dbSsl: process.env.DB_SSL === "true",
  // Cloudflare R2 오브젝트 스토리지 (이미지 업로드용)
  r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2BucketName: process.env.R2_BUCKET_NAME ?? "",
  r2PublicUrl: process.env.R2_PUBLIC_URL ?? "",
  // Resend (비밀번호 재설정 이메일 발송)
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
  // 비밀번호 재설정 링크가 가리킬 웹 배포 주소 (예: https://closing-market.vercel.app)
  webAppUrl: process.env.WEB_APP_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction,
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
