-- 회원 시스템 전면 개편 마이그레이션
-- role enum 확장: user/admin -> user/seller/company/admin
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','seller','company','admin') NOT NULL DEFAULT 'user';

-- userType 컬럼 제거 (role로 통합)
ALTER TABLE `users` DROP COLUMN IF EXISTS `userType`;

-- 판매회원 관련 컬럼 추가
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `businessName` varchar(255);
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `representativeName` varchar(100);

-- sellerStatus enum에 suspended 추가
ALTER TABLE `users` MODIFY COLUMN `sellerStatus` enum('pending','approved','rejected','suspended') DEFAULT 'pending';

-- 업체회원 관련 컬럼 추가
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyStatus` enum('pending','approved','rejected','suspended') DEFAULT 'pending';
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyType` enum('demolition','interior','waste','signage','pos','cleaning','tax','labor');
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyName` varchar(255);
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyDesc` text;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyPhone` varchar(20);
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyAddress` varchar(500);
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyLogoUrl` text;

-- 기존 관리자 계정 role 유지
UPDATE `users` SET `role` = 'admin' WHERE `email` = 'mm328i@naver.com';
UPDATE `users` SET `role` = 'admin' WHERE `email` = 'admin@closingmarket.com';
