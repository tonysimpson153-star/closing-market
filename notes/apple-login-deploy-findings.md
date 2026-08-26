# Apple 로그인 운영 배포 점검 메모

- 사용자 캡처의 최소 INSERT 쿼리는 `openId`, `email`, `name`, `loginMethod`, `appleId`만 포함합니다.
- 운영 초기 users 스키마의 핵심 필수값은 `openId`이며 createdAt/updatedAt/lastSignedIn은 기본값이 있습니다.
- 최소 INSERT 이후에도 실패했으므로 중복 이메일 또는 같은 openId 재시도 가능성을 고려해 `ON DUPLICATE KEY UPDATE`로 Apple ID와 loginMethod를 연결하도록 보완했습니다.
- 로컬 서버 번들 빌드와 `git diff --check`는 통과했습니다.
- GitHub 커밋 `24e87ca`를 Render에 반영했고, 2026-08-26 05:08 기준 Render 배포는 시작 상태였습니다. `/api/health`는 200을 반환했으나, 새 배포가 live인지 확인이 필요합니다.

- 24e87ca Render 배포는 05:10에도 `started` 상태로 표시되었고 05:10 health 200은 이전 live 인스턴스 응답일 수 있습니다.
- 로컬 프로젝트 DB에서 캡처의 relay 이메일/Apple ID와 일치하는 기존 계정은 조회되지 않았습니다. 다만 운영 DB와 프로젝트 DB가 다를 수 있으므로 운영 중복 여부는 아직 확정하지 않았습니다.
- 초기 users 스키마에는 createdAt/updatedAt/lastSignedIn 기본값이 있어 최소 INSERT 누락은 직접 원인으로 보기 어렵습니다. 현재 가장 유력한 원인은 운영 DB의 unique email/openId 충돌이며, `ON DUPLICATE KEY UPDATE`로 기존 행에 Apple ID를 연결하도록 보완했습니다.

- Render 대시보드에서 GitHub 커밋 `24e87ca` 배포가 2026-08-26 05:10에 `live`로 전환된 것을 확인했습니다.
- 운영 `/api/health`는 200입니다.
- 실제 iPhone에서 같은 Apple 계정으로 한 번 더 로그인해 신규 계정 생성 또는 기존 계정 연결 성공 여부를 확인해야 합니다.
