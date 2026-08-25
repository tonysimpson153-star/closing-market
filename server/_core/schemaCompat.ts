import { sql } from "drizzle-orm";

import { getDb } from "../db";

/**
 * 운영 DB가 이전 스키마인 경우에도 로그인 쿼리가 실패하지 않도록
 * users 테이블에 현재 코드가 사용하는 컬럼만 비파괴적으로 보정합니다.
 * 기존 행과 값은 삭제하거나 변경하지 않습니다.
 */
export async function ensureUsersSchemaCompatibility() {
  const db = await getDb();
  if (!db) {
    console.warn("[schema] DATABASE_URL이 없어 users 스키마 보정을 건너뜁니다.");
    return;
  }

  const statements = [
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyBusinessCertUrl` TEXT NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyRejectionReason` TEXT NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `failedLoginAttempts` INT NOT NULL DEFAULT 0",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `lockedUntil` TIMESTAMP NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `deletedAt` TIMESTAMP NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `suspendedAt` TIMESTAMP NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `suspendedReason` TEXT NULL",
  ];

  for (const statement of statements) {
    try {
      await db.execute(sql.raw(statement));
    } catch (error) {
      console.error("[schema] users 컬럼 보정 실패:", statement, error);
      throw error;
    }
  }

  console.log("[schema] users 스키마 호환성 확인 완료");
}
