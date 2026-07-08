/**
 * 관리자 계정 생성/승격 스크립트
 *
 * 비밀번호를 코드에 하드코딩하지 않기 위해 환경변수로 입력받습니다.
 * 이미 가입된 이메일이면 관리자 권한만 부여하고, 없으면 새로 만듭니다.
 *
 * 실행 방법 (프로젝트 루트에서):
 *
 *   ADMIN_EMAIL="mm328i@naver.com" ADMIN_PASSWORD="Admin1234!" ADMIN_NAME="관리자" \
 *     npx tsx scripts/create-admin.ts
 *
 * DATABASE_URL 등 .env에 설정된 값을 그대로 사용합니다.
 */
import bcrypt from "bcryptjs";
import * as db from "../server/db";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "관리자";

  if (!email || !password) {
    console.error(
      "사용법: ADMIN_EMAIL=이메일 ADMIN_PASSWORD=비밀번호 [ADMIN_NAME=이름] npx tsx scripts/create-admin.ts"
    );
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("비밀번호는 6자 이상이어야 합니다.");
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const existing = await db.getUserByEmail(email);

  if (existing) {
    await db.updateUserPassword(existing.id, hashedPassword);
    await db.setUserRole(existing.id, "admin");
    console.log(`기존 계정(${email})을 관리자로 승격하고 비밀번호를 갱신했습니다. (id: ${existing.id})`);
  } else {
    const openId = `email_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const user = await db.createUserByEmail({
      openId,
      email,
      password: hashedPassword,
      name,
      loginMethod: "email",
    });
    if (!user) throw new Error("계정 생성에 실패했습니다.");
    await db.setUserRole(user.id, "admin");
    console.log(`관리자 계정을 새로 생성했습니다. (id: ${user.id}, email: ${email})`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("관리자 계정 설정 중 오류가 발생했습니다:", err);
  process.exit(1);
});
