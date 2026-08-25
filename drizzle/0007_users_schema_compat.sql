-- 기존 users 데이터는 유지하고 현재 코드에 필요한 누락 컬럼만 추가합니다.
ALTER TABLE `users`
  ADD COLUMN `companyBusinessCertUrl` text NULL,
  ADD COLUMN `companyRejectionReason` text NULL,
  ADD COLUMN `failedLoginAttempts` int NOT NULL DEFAULT 0,
  ADD COLUMN `lockedUntil` timestamp NULL,
  ADD COLUMN `deletedAt` timestamp NULL,
  ADD COLUMN `suspendedAt` timestamp NULL,
  ADD COLUMN `suspendedReason` text NULL;