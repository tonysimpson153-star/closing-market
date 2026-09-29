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

  // 닉네임은 NULL은 허용하되, 실제로 입력된 값은 한 계정만 사용할 수 있게 합니다.
  // 기존 데이터에 중복이 있으면 자동으로 이름을 바꾸지 않고 배포를 중단해
  // 기존 회원 정보가 조용히 변경되지 않도록 합니다.
  const duplicateNicknames = await db.execute(sql.raw(
    "SELECT `nickname`, COUNT(*) AS `count` FROM `users` WHERE `nickname` IS NOT NULL AND TRIM(`nickname`) <> '' GROUP BY `nickname` HAVING COUNT(*) > 1 LIMIT 1",
  ));
  const duplicateRows = Array.isArray(duplicateNicknames) ? duplicateNicknames[0] : [];
  if (Array.isArray(duplicateRows) && duplicateRows.length > 0) {
    throw new Error("닉네임 중복 데이터가 있어 users_nickname_unique 인덱스를 적용할 수 없습니다. 기존 중복 닉네임을 먼저 정리해주세요.");
  }

  const indexResult = await db.execute(sql.raw(
    "SELECT COUNT(*) AS `count` FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'users_nickname_unique'",
  ));
  const indexRows = Array.isArray(indexResult) ? indexResult[0] : [];
  const indexCount = Number((Array.isArray(indexRows) ? indexRows[0] as { count?: number | string } | undefined : undefined)?.count ?? 0);
  if (indexCount === 0) {
    await db.execute(sql.raw("ALTER TABLE `users` ADD CONSTRAINT `users_nickname_unique` UNIQUE (`nickname`)"));
  }

  console.log("[schema] users 스키마 호환성 확인 완료");
}
