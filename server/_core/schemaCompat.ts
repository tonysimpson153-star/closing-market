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

  // Drizzle의 users 전체 SELECT가 참조하는 컬럼을 모두 포함합니다.
  // IF NOT EXISTS와 NULL 허용/기본값을 사용해 기존 회원 데이터는 보존합니다.
  const statements = [
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `nickname` VARCHAR(50) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `loginMethod` VARCHAR(64) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `role` VARCHAR(32) NOT NULL DEFAULT 'user'",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `sellerStatus` VARCHAR(32) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `sellerType` VARCHAR(32) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `businessNumber` VARCHAR(20) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `businessName` VARCHAR(255) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `representativeName` VARCHAR(100) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `businessCertUrl` TEXT NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `businessPhotoUrl` TEXT NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyStatus` VARCHAR(32) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyType` VARCHAR(32) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyName` VARCHAR(255) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyDesc` TEXT NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyPhone` VARCHAR(20) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyAddress` VARCHAR(500) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyLogoUrl` TEXT NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyBusinessCertUrl` TEXT NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyRejectionReason` TEXT NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `isVerified` TINYINT(1) NOT NULL DEFAULT 0",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `profileImageUrl` TEXT NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `phone` VARCHAR(20) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `password` VARCHAR(256) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `failedLoginAttempts` INT NOT NULL DEFAULT 0",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `lockedUntil` TIMESTAMP NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `kakaoId` VARCHAR(64) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `appleId` VARCHAR(64) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `notifChat` TINYINT(1) NOT NULL DEFAULT 1",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `notifPriceDrop` TINYINT(1) NOT NULL DEFAULT 1",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `notifTrade` TINYINT(1) NOT NULL DEFAULT 1",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `notifMarketing` TINYINT(1) NOT NULL DEFAULT 0",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `expoPushToken` TEXT NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `lastSignedIn` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `deletedAt` TIMESTAMP NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `suspendedAt` TIMESTAMP NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `suspendedReason` TEXT NULL",
    // 기존 회원 시스템에서 관리자였던 계정의 권한만 복구합니다.
    // 상품·업체·채팅 등 다른 데이터는 변경하지 않습니다.
    "UPDATE `users` SET `role` = 'admin' WHERE `email` IN ('mm328i@naver.com', 'admin@closingmarket.com')",
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
