-- 닉네임은 NULL을 허용하되, 입력된 닉네임은 계정 간 중복을 허용하지 않습니다.
-- 적용 전 기존 중복 닉네임이 없는지 확인해야 합니다.
ALTER TABLE `users`
  ADD CONSTRAINT `users_nickname_unique` UNIQUE (`nickname`);
