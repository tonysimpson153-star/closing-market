# Apple 출시본·통합찾기 비교 기록

확인일: 2026-09-01

## Apple 출시본

공개 App Store URL: https://apps.apple.com/kr/app/%ED%81%B4%EB%A1%9C%EC%A7%95%EB%A7%88%EC%BC%93/id6802008480

페이지에 표시된 앱 설명은 폐업 사업자의 물품과 창업에 필요한 상품·서비스 연결이며, 카페·음식점·PC방·헬스장 등 다양한 업종의 폐업 물품과 창업·폐업 관련 업체를 안내한다. 공개 정보에는 통합찾기라는 별도 기능 명칭이 표시되지 않는다.

## GitHub 비교

- `main`에는 `closing-market/app/(tabs)/companies.tsx`가 있다.
- `main`에는 `closing-market/app/company/integrated.tsx`가 없다.
- `feature/integrated-search-draft`에는 위 두 파일이 모두 있다.
- `main...feature/integrated-search-draft` 비교 결과는 `diverged`, draft가 `ahead_by: 1`, `behind_by: 13`이며 변경 파일은 업체찾기 화면과 통합찾기 화면 두 개다.
- 홈페이지 작업 커밋은 `server/_core/landing.ts` 추가, `server/_core/index.ts` 연결 및 이후 두 파일 제거 커밋으로 구성되었고, `app/(tabs)/companies.tsx` 또는 `app/company/integrated.tsx`를 변경하지 않았다.

결론: GitHub `main`에는 통합찾기 화면 파일이 없고, 통합찾기 화면은 draft 브랜치에만 있다. 현재 로컬 작업 폴더에는 이전 draft 체크포인트가 로드되어 `app/company/integrated.tsx`가 보일 수 있으므로, 통합찾기 출시 빌드에는 로컬 작업 폴더를 사용하지 말고 Apple 출시 기준 또는 GitHub `main`을 기준으로 삼아야 한다.
