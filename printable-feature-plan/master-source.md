| 항목 | 내용 |
|---|---|
| 문서명 | 클로징마켓 프로젝트 전체 마스터 문서 / 기술·기획 인수인계 |
| 기준일 | 2026-09-12 |
| 작성 기준 | 실제 앱 소스, 서버 라우터, Drizzle 스키마, EAS·Render 설정, 홈페이지 프로젝트 및 출시 기록 |
| 이번 작업 범위 | 분석·문서화만 수행. 앱 코드·DB·UI·배포·환경변수·외부 서비스 설정은 변경하지 않음 |
| 상태 표기 | **IMPLEMENTED** 구현 확인 / **PARTIALLY IMPLEMENTED** 일부 구현 / **NOT IMPLEMENTED** 코드에서 미확인 / **PLANNED** 향후 계획 / **NEEDS VERIFICATION** 코드만으로 확정 불가 |

> **핵심 문구:** “사업의 끝, 시작의 가치.”
>
> 이 문서는 일반 개인 중고거래 앱의 운영 문서가 아니라, **폐업·이전·교체·업종 변경·확장·축소·정리 과정에서 발생한 사업장 물품**을 필요한 창업자·사업자·구매자에게 연결하는 클로징마켓의 현재 구현 상태와 다음 개발 기준을 기록한다.

## 1. 프로젝트 기본 정보

| 항목 | 실제 확인 결과 |
|---|---|
| 서비스명 / 영문명 | 클로징마켓 / Closing Market |
| 앱 식별자 | iOS Bundle ID 및 Android package: `com.app.closingmarket` |
| 앱 버전 | 설정상 `1.0.0` |
| 앱 프레임워크 | Expo SDK 54, React Native 0.81, Expo Router 6, TypeScript |
| API 주소 | `https://closing-market.onrender.com` (EAS production 설정 확인) |
| 공식 홈페이지 | `https://closingmarket.netlify.app` |
| 현재 운영 구조 | 앱은 실제 거래 서비스, 홈페이지는 소개·SEO·앱 유입 목적의 별도 정적 프로젝트 |
| 현재 출시 상태 | iOS App Store `1.0.0 (6)` 공개 기록 확인. Android `1.0.0 (3)`은 Play Console 프로덕션 임시보관이며 미제출·미공개 기록 확인 |

## 2. 서비스 철학

클로징마켓은 단순히 폐업 물품을 싼 가격에 판매하는 목록 서비스가 아니다. 사업장이 종료·이전·장비 교체·업종 변경·확장·축소·정리를 수행할 때 발생하는 집기, 장비, 재고, 비품을 다시 필요한 사업자에게 연결하는 것을 목표로 한다.

핵심 흐름은 **사업의 변화 또는 종료 → 사업장 물품의 재사용 → 다른 사업의 시작 또는 운영 효율화**다. 따라서 향후 업체·견적·방문 연결을 추가하더라도 일반 개인 중고거래와 같은 무차별 확장이 아니라 사업장 물품과 사업 과정이라는 맥락을 유지해야 한다.

## 3. 타깃 사용자

### 3.1 판매자

| 유형 | 사용 상황 | 현재 코드 상태 |
|---|---|---|
| 폐업 사업자 | 매장·사업장 정리 중 집기·장비 처분 | **IMPLEMENTED** 판매자 유형 `closed`, `closing_soon` |
| 이전 사업자 | 이전 전 기존 물품 처분 | **IMPLEMENTED** 판매자 유형 `relocating` |
| 교체·정리 사업자 | 장비·비품·재고 교체 또는 처분 | **PARTIALLY IMPLEMENTED** `inventory`, `transfer` 유형 존재 |
| 업종 변경·확장·축소 사업자 | 기존 장비 처분 또는 재배치 | **PARTIALLY IMPLEMENTED** 서비스 문구·상품 등록은 가능하나 별도 워크플로 없음 |

### 3.2 구매자

예비 창업자, 기존 사업자, 중고기기·집기 매입업체, 대량 구매자, 사업장 물품을 필요로 하는 일반 이용자가 물품을 탐색하고 판매자에게 채팅으로 문의할 수 있다. 코드상 상품 열람은 공개이고, 찜·채팅·최근 본 상품은 로그인 사용자를 기준으로 처리된다.

## 4. 일반 중고거래 서비스와의 차이

당근 등 일반 중고거래에서도 사업장 물품 거래는 가능하다. 클로징마켓의 차별점은 일반 서비스보다 우월하다고 주장하는 것이 아니라, **사업장 물품 수요자와 공급자**, 그리고 향후 사업 시작·정리 과정의 전문 업체를 한 흐름에 모으는 데 있다. 현재 구현된 핵심은 인증 판매자 기반 물품 등록·검색·채팅이며, 업체·견적·방문은 확장 영역이다.

## 5. 현재 서비스 구조

현재 코드 기준 대표 사용자 흐름은 다음과 같다.

<!--raw-typst #figure(visual("user-flow.png", width: 92%), caption: [현재 앱의 실제 핵심 사용자 흐름. 견적·방문·유료 연결은 이 흐름에 아직 포함되지 않는다.]) -->

1. 회원가입 또는 이메일·Kakao·Apple 로그인
2. 홈·카테고리·검색 화면에서 판매중 상품 탐색
3. 상품 상세에서 이미지·가격·지역·판매자·설명 확인
4. 찜 또는 판매자와 1:1 채팅 생성
5. 판매자는 인증 완료 후 물품 등록, 판매중·예약중·판매완료 상태 변경
6. 거래 후 상대방 대상 후기 작성 가능
7. 별도 탭에서 업체찾기와 업체 등록 신청 진입

## 6. 회원가입 및 로그인

| 항목 | 상태 | 실제 확인 결과 |
|---|---|---|
| 이메일 회원가입 | **IMPLEMENTED** | 이메일·비밀번호·이름·닉네임·전화번호 입력. bcrypt 해시 후 사용자 생성 |
| 이메일 로그인 | **IMPLEMENTED** | JWT 30일 발급, IP 기준 시도 제한 및 실패 횟수/잠금 처리 |
| 비밀번호 재설정 | **IMPLEMENTED** | 1시간 토큰 생성·이메일 발송 코드 존재. 메일 인프라 실제 운영은 **NEEDS VERIFICATION** |
| Kakao 로그인 | **IMPLEMENTED** | Kakao 사용자 API에서 access token 검증 후 Kakao ID 기반 사용자 생성·로그인 |
| Apple 로그인 | **PARTIALLY IMPLEMENTED** | iOS 플러그인·서버 라우터 존재. 서버가 identity token을 서명 검증하지 않고 payload를 디코드하므로 보안 개선 필요 |
| 로그아웃 | **IMPLEMENTED** | 클라이언트 저장 JWT·사용자 정보 제거 및 서버 로그아웃 경로 존재 |
| 회원 탈퇴 | **IMPLEMENTED** | 비밀번호 계정은 비밀번호 확인 후 소프트 삭제·개인정보 익명화 목적의 DB 함수 사용 |
| refresh token | **NOT IMPLEMENTED** | access/refresh token 분리 구조는 현재 코드에서 확인되지 않음 |

인증 API는 `auth.register`, `auth.login`, `auth.kakaoLogin`, `auth.appleLogin`, `auth.me`, `auth.forgotPassword`, `auth.resetPassword`로 구성된다. 보호 API는 Authorization Bearer JWT를 해석해 DB 사용자 상태를 재조회하며, 탈퇴·정지 계정은 토큰이 남아 있어도 보호 API에서 제외된다.

## 7. 사용자 프로필

**IMPLEMENTED:** 이름, 이메일, 전화번호, 프로필 이미지, 역할(`user`/`seller`/`company`/`admin`), 알림 설정, 판매 상품, 구매 내역, 찜, 최근 본 상품, 받은 후기, 1:1 문의, 계정 설정 화면이 존재한다.

**PARTIALLY IMPLEMENTED:** 닉네임 컬럼은 존재하지만 가입 API의 중복 검증은 이메일만 확실히 수행한다. 닉네임 서버 측 고유성 검증은 향후 보완 대상이다. 거래 지역은 상품의 텍스트 위치로 저장되며 사용자 상시 프로필 주소 필드로 분리되어 있지는 않다.

## 8. 사업자·사업장 등록

판매회원 신청은 `seller.submit`에서 판매 상황, 사업자등록번호(10자리), 사업장명, 대표자명, 사업자등록증 URL, 선택 사업장 사진 URL을 받는다. 관리자 승인 전에는 `pending`, 승인 후에만 판매자 상품 등록이 가능하다.

| 항목 | 상태 | 확인 결과 |
|---|---|---|
| 사업자등록증 업로드 | **IMPLEMENTED** | 판매자 증빙 업로드 API와 URL 저장 구조 존재 |
| 판매 상황 | **IMPLEMENTED** | 폐업예정·폐업·이전·재고·양도 유형 enum 존재 |
| GPS | **PARTIALLY IMPLEMENTED** | 물품 등록 화면에서 로그인 상태이면 foreground 위치 권한 요청 후 시/도·구/군·동 텍스트를 자동 입력 |
| 위도·경도 저장 | **PARTIALLY IMPLEMENTED** | products 스키마에는 위도·경도 컬럼이 있으나 물품 등록 API가 좌표를 입력받지 않음 |
| 주변 검색 | **NOT IMPLEMENTED** | 좌표 반경 계산·거리 정렬 API는 현재 확인되지 않음 |

## 9. 상품 등록

인증 판매자 또는 관리자는 상품을 등록할 수 있다. `products.create`는 상품명, 설명, 가격, 수량, 업종 카테고리, 거래 유형, 지역 텍스트, 대표 이미지 및 최대 10장의 이미지 URL을 받는다. 첫 이미지가 대표 이미지로 사용된다.

| 필드 | DB 컬럼/구조 | 상태 |
|---|---|---|
| 상품명·설명 | `products.title`, `description` | **IMPLEMENTED** |
| 가격·수량 | `price`, `quantity` | **IMPLEMENTED** |
| 업종·거래유형 | `category`, `tradeType` | **IMPLEMENTED** |
| 거래 지역 | `location` | **IMPLEMENTED** 텍스트 기준 |
| 이미지 | `product_images`, `mainImageUrl` | **IMPLEMENTED** |
| 거래 상태 | `selling` / `reserved` / `sold` | **IMPLEMENTED** |
| 상품 수정·개별 삭제 | 전용 판매자 API·화면은 **NOT IMPLEMENTED**로 확인 | 관리자 삭제 API는 존재 |

## 10. 카테고리

| 실제 코드값 | 표시명 | 구현 상태 | 비고 |
|---|---|---|---|
| `cafe` | 카페 | **IMPLEMENTED** | 물품 등록·검색 사용 |
| `pcroom` | PC방 | **IMPLEMENTED** | 동일 |
| `restaurant` | 식당 | **IMPLEMENTED** | 동일 |
| `gym` | 헬스장 | **IMPLEMENTED** | 동일 |
| `office` | 사무실 | **IMPLEMENTED** | 동일 |
| `warehouse` | 창고재고 | **IMPLEMENTED** | 동일 |
| `transfer` | 사업양도 | **PARTIALLY IMPLEMENTED** | DB·상세 라벨 존재, 일반 등록 화면 선택지는 미노출 |

향후 미용실, 숙박, 교육, 소매, 병원·의료, 공장·설비 등은 실제 매물·수요가 확인된 후 추가한다.

## 11. 검색

상품 목록 API는 카테고리·상태·limit·offset 필터를 제공한다. 검색 화면은 최대 30개 결과를 받아 제목·설명·지역 문자열을 **클라이언트에서 필터링**한다.

| 항목 | 상태 | 비고 |
|---|---|---|
| 키워드 검색 | **PARTIALLY IMPLEMENTED** | UI 검색어는 API 입력에 전달되나 서버 schema는 별도 검색 필드를 처리하지 않음 |
| 카테고리·판매중 필터 | **IMPLEMENTED** | 서버 목록 API 지원 |
| 가격·정렬·거리 필터 | **NOT IMPLEMENTED** | 코드에서 확인되지 않음 |
| 페이지네이션 | **PARTIALLY IMPLEMENTED** | API offset/limit 존재, 검색 화면은 고정 30개 |
| 주변 검색 | **NOT IMPLEMENTED** | 좌표 기반 반경·거리 정렬 없음 |

## 12. 상품 상세

상품 상세는 다중 이미지 스와이프·전체화면 이미지, 카테고리, 지역, 제목, 가격, 거래유형, 판매 상태, 판매자 인증 표시, 상세 설명, 공유, 찜, 채팅 문의, 신고 진입을 제공한다. 상품 조회 시 로그인 사용자는 최근 본 상품을 저장한다. 등록일·조회수·수량은 스키마에 존재하지만 상세 화면에서 모두 노출되는지에는 차이가 있어 **PARTIALLY IMPLEMENTED**로 기록한다.

## 13. 찜 기능

`favorites`는 사용자와 상품 또는 업체 ID를 저장한다. `favorites.list`, `check`, `toggle` API가 있으며 상품 상세의 찜 토글과 마이페이지 목록이 연결된다. 찜한 상품의 가격 하락을 실제로 감지·발송하는 로직은 현재 확인되지 않아 가격하락 알림은 **NOT IMPLEMENTED**다.

## 14. 채팅

| 항목 | 상태 | 실제 확인 결과 |
|---|---|---|
| 1:1 채팅방 | **IMPLEMENTED** | 구매자·판매자·선택 상품 ID로 생성 또는 기존방 재사용 |
| 메시지·읽음 | **IMPLEMENTED** | 텍스트/이미지, 읽음 처리, 페이지네이션 조회 |
| 거래 상태 | **IMPLEMENTED** | 채팅방 `active` / `completed` / `cancelled` |
| 이미지 전송 | **IMPLEMENTED** | 채팅 이미지 업로드 API 존재 |
| 푸시 | **PARTIALLY IMPLEMENTED** | Expo token이 있을 때 채팅 전송 시 push 시도 |
| 차단 기능 | **NOT IMPLEMENTED** | 사용자 차단 테이블·API 미확인 |
| IDOR 방어 | **PARTIALLY IMPLEMENTED** | 방/메시지 DB 함수에 사용자 ID가 전달되나 전체 권한 검증은 통합 테스트 필요 |

## 15. 거래 상태

상품 상태는 `selling`, `reserved`, `sold`이며 판매자 소유 확인을 포함한 `products.updateStatus` API가 있다. 채팅방은 `active`, `completed`, `cancelled` 상태를 별도로 가진다. 결제·에스크로·배송 추적·분쟁 조정은 **NOT IMPLEMENTED**다.

## 16. 리뷰

별점 1~5와 최대 500자 후기, 대상 사용자, 선택 상품·채팅방 ID를 저장한다. 자기 자신에게 후기를 작성하는 것은 서버에서 막고, `checkExists` 조회 API는 존재한다. 그러나 서버 생성 API가 거래완료 상태·채팅방 참여자·중복을 강제하는지는 코드상 완전하게 확인되지 않아 **PARTIALLY IMPLEMENTED**다. 리뷰 수정·삭제·리뷰 신고는 현재 확인되지 않는다.

## 17. 신고 및 UGC 관리

신고 대상은 상품·사용자·댓글·채팅이며 사유는 5~1,000자로 저장된다. 관리자는 목록 조회 후 `resolved` 또는 `dismissed`로 처리할 수 있다. 관리자 상품 삭제·사용자 정지 기능도 존재한다. 댓글 테이블은 있으나 댓글 UI/API는 현재 확인되지 않고, 리뷰 신고·사용자 차단·자동 모더레이션은 **NOT IMPLEMENTED**다.

## 18. 알림

사용자별 채팅·가격하락·거래·마케팅 수신 설정 컬럼과 설정 API가 있다. 앱 시작 시 Expo push token을 저장하고, 채팅 메시지 전송 시 상대방 토큰으로 push를 시도한다. 앱 내 `notifications` 테이블과 읽음 처리 API가 존재한다. 가격하락·찜·거래 상태 등의 자동 생성 트리거는 현재 확인되지 않아 **PARTIALLY IMPLEMENTED**다.

## 19. 관리자 기능

관리자 전용 API는 판매자 신청 승인·거절·정지, 사용자 목록·정지·복구, 상품 목록·삭제, 신고 목록·처리, 공지 생성·삭제, 고객 문의 목록·답변, 업체 신청 승인·거절·정지를 포함한다. `app/admin/dashboard.tsx`와 판매자 신청 화면이 존재한다.

리뷰 직접 관리, 거래 분쟁 관리, 결제 정산, 분석 대시보드 고도화는 **NOT IMPLEMENTED** 또는 **PARTIALLY IMPLEMENTED**다.

## 20. 업체 기능

업체는 철거·인테리어·폐기물·간판·POS·CCTV·청소·세무·노무·주방·컨설팅 유형으로 신청할 수 있다. 업체명, 대표자, 전화번호, 주소, 소개, 사업자등록번호, 로고, 사업자 증빙, 최대 10장 이미지를 저장한다. 승인 업체는 공개 목록·상세에 노출된다.

기존 `businesses` 추천 업체 테이블과 사용자 기반 `companies` 승인 업체 구조가 함께 존재한다. 업체 채팅·견적·방문예약·리드관리·과금은 현재 **NOT IMPLEMENTED**이다.

## 21. 향후 기능 — 찾아요

**PLANNED / NOT IMPLEMENTED.** 구매자가 “카페 테이블 10개 찾습니다”처럼 필요한 사업장 물품 수요를 먼저 등록하는 구조다. 필요 필드는 제목, 카테고리, 지역, 예산, 수량, 희망 날짜, 설명, 사진, 상태이며 판매자 알림·제안·채팅 연결이 뒤따라야 한다. 현재 DB 테이블·API·화면은 확인되지 않는다.

## 22. 향후 기능 — 통합찾기

**PLANNED / PARTIALLY IMPLEMENTED.** `app/company/integrated.tsx` 화면 파일은 현재 저장소에서 확인되지만, 출시 iOS 기준에는 포함되지 않았다는 비교 기록이 있다. 현재 저장소 main에서 파일이 추적되는 상태와 출시 분리 원칙이 충돌하므로, **출시 전 draft로 취급하고 브랜치·빌드 기준을 재감사해야 한다.** 실제 견적 요청 백엔드·DB·업체 연결은 미구현이다.

## 23. 업체찾기 고도화

현재 업체찾기는 승인 업체와 추천 업체 목록·상세·유형 필터 중심이다. 향후에는 철거, 인테리어, 청소, 폐기물, 운송, 간판, 중고기기, 설비, 기타를 서비스 범위·지역·후기·응답률·포트폴리오로 탐색하고 업체 비교·저장·상담 연결을 강화한다.

## 24. 견적 요청

**PLANNED / NOT IMPLEMENTED.** 지역, 업종, 평수, 요청 서비스, 작업 내용, 사진, 희망 날짜, 요청사항을 구조화해 여러 업체가 견적·상담 제안을 할 수 있어야 한다. 요청·제안·상담·종료·신고 상태와 개인정보 공개 규칙이 필요하다.

## 25. 방문예약

**PLANNED / NOT IMPLEMENTED.** 견적 요청 이후 고객의 후보 날짜·시간 선택, 업체 승인·거절, 예약 확정·변경·취소, 알림, 노쇼·분쟁 처리 규칙이 필요하다. 견적 기능과 업체 운영 인력이 확보된 이후 개발한다.

## 26. 주소 공개 및 업체 연결 과금

**PLANNED / NOT IMPLEMENTED.** 1차 요청에서는 대략 지역·업종·평수·작업 범위·사진만 공개하고, 고객이 연결을 허용한 후에만 정확한 주소·필요 연락처를 단계 공개하는 구조를 검토한다. 연결비 결제·환불·리드 중복·개인정보 동의·증빙은 사업 데이터 확보 후 별도 정책과 결제 연동으로 설계한다.

## 27. 향후 양도양수

`business_transfers` 테이블은 product ID, 권리금, 보증금, 월세, 업종을 갖지만 현재 화면·API가 충분히 연결됐는지는 확인되지 않는다. 따라서 사업장 자체 양도양수·중개 수수료는 **PARTIALLY IMPLEMENTED 데이터 기반 / PLANNED 제품 기능**으로 분리한다.

## 28. 외부 인프라 전체 분석

| 서비스 | 실제 확인 결과 | 상태 |
|---|---|---|
| Render | Node API `closing-market-api`, Singapore free plan 설정 | **IMPLEMENTED** |
| TiDB / MySQL 호환 DB | Drizzle·mysql2·`DATABASE_URL`·SSL 설정 확인 | **IMPLEMENTED** |
| Cloudflare R2 | S3 SDK 기반 상품·채팅·증빙 파일 업로드 구현 | **IMPLEMENTED** |
| Expo / EAS | iOS·Android build profile와 projectId 확인 | **IMPLEMENTED** |
| Kakao | 사용자 API 호출·RN SDK 의존성 확인 | **IMPLEMENTED** |
| Apple | Expo Apple Authentication 플러그인·서버 라우터 확인 | **PARTIALLY IMPLEMENTED** |
| Expo Push | token 저장·채팅 push 호출 확인 | **PARTIALLY IMPLEMENTED** |
| Resend | 이메일 API 코드·환경변수 참조 확인 | **NEEDS VERIFICATION** |
| Netlify | 별도 정적 공식 홈페이지 배포 확인 | **IMPLEMENTED** |
| Naver Search Advisor | 등록·sitemap·RSS 기록 확인 | **IMPLEMENTED** |
| Cloudflare DNS / UptimeRobot | 운영 사용 여부는 현재 코드·설정에서 확정되지 않음 | **NEEDS VERIFICATION** |

## 29. 인프라 구조도

<!--raw-typst #figure(visual("system-architecture.png", width: 94%), caption: [실제 코드·설정에서 확인된 클로징마켓 운영 구조. DNS·모니터링은 별도 운영 확인이 필요하다.]) -->

앱은 Render API의 tRPC 엔드포인트를 사용하고, 서버는 TiDB/MySQL 호환 데이터베이스 및 Cloudflare R2 공개 URL 기반 파일 저장소를 사용한다. 공식 홈페이지는 앱 저장소와 분리된 정적 프로젝트로 Netlify에서 제공된다.

## 30. 데이터베이스

| 테이블 | 목적 | 주요 관계·상태 |
|---|---|---|
| `users` | 계정·역할·판매자·업체·알림·정지 상태 | 상품, 채팅, 찜, 후기, 신고, 문의의 기준 사용자 |
| `products` / `product_images` | 물품과 다중 이미지 | 판매자, 카테고리, 거래상태, 지역 텍스트 |
| `businesses` / `company_images` | 추천 업체·업체 이미지 | 사용자 기반 승인 업체와 병행 구조 |
| `favorites` / `recent_views` | 찜·최근 본 상품 | 사용자와 상품/업체 연결 |
| `chat_rooms` / `chat_messages` | 1:1 채팅·읽음 | 구매자·판매자·상품 연결 |
| `reviews` | 별점·후기 | 작성자·대상자·선택 상품/채팅방 |
| `reports` / `notifications` | 신고·앱 내 알림 | 사용자 기준 상태 관리 |
| `seller_applications` | 판매회원 인증 심사 | 신청·승인·거절·정지 |
| `notices` / `inquiries` | 공지·고객 문의 | 관리자 답변 상태 |
| `business_transfers` | 양도양수 보조 데이터 | 현 제품 기능 연결은 확인 필요 |
| `password_reset_tokens` | 비밀번호 재설정 | 만료·사용 여부 |

스키마상 대부분의 관계는 정수 ID로 표현되고, 명시적 DB foreign key 제약은 확인되지 않는다. 데이터 정합성은 서버 API와 운영 절차에 크게 의존한다.

<!--raw-typst #figure(visual("data-relationship.png", width: 92%), caption: [현재 Drizzle 스키마를 기준으로 한 핵심 데이터 관계. 일부 관계는 명시적 foreign key 제약이 아닌 ID 참조다.]) -->

## 31. 파일·이미지 저장 구조

상품 이미지, 채팅 이미지, 판매자 사업자등록증·사업장 사진, 업체 로고·증빙·갤러리, 프로필 사진은 `upload` tRPC 그룹을 통해 Cloudflare R2로 저장된다. 업로드는 JPG/JPEG/PNG/WebP, 최대 5MB MIME·크기 검증을 한다.

현재 R2 구현은 **공개 URL**을 반환한다. 상품·채팅 이미지에는 편리하지만 사업자등록증·증빙 자료도 동일 공개 URL 구조에 저장될 수 있으므로 **High 개선 필요**다. 민감 문서는 비공개 버킷·서명 URL·권한 검사·보존기간 정책으로 분리해야 한다.

## 32. 보안

| 항목 | 현재 상태 | 위험·개선 필요 |
|---|---|---|
| JWT 보호 API | **IMPLEMENTED** | Bearer JWT 검증 후 DB 사용자 재조회, 탈퇴·정지 즉시 차단 |
| 이메일 비밀번호 | **IMPLEMENTED** | bcrypt 해시·로그인 시도 제한·잠금 처리 |
| Kakao 로그인 | **IMPLEMENTED** | Kakao 사용자 API로 access token 확인 |
| Apple 로그인 | **PARTIALLY IMPLEMENTED** | payload decode만 수행. Apple 서명·issuer·audience·nonce 검증 필요 |
| 관리자 권한 | **IMPLEMENTED** | `adminProcedure`가 DB role `admin` 확인 |
| 파일 형식·크기 | **IMPLEMENTED** | MIME allowlist·5MB 제한. 매직바이트·악성 이미지 검사 추가 검토 |
| 민감 증빙 파일 | **High 개선 필요** | R2 public URL 구조로 노출 가능성 |
| 채팅 접근 | **PARTIALLY IMPLEMENTED** | 사용자 ID를 전달한 조회 함수 사용. 권한 회귀 테스트 보강 필요 |
| CORS·origin | **NEEDS VERIFICATION** | 환경변수 참조는 있으나 운영 allowlist 값·배포 상태는 문서에 미기록 |
| XSS·SQL injection | **PARTIALLY IMPLEMENTED** | Drizzle parameterized query 구조이나 UGC 출력 sanitization·전면 테스트 필요 |

## 33. API 구조

API는 REST 개별 경로가 아니라 `https://closing-market.onrender.com/api/trpc`의 tRPC query/mutation 그룹으로 구성된다.

| 그룹 | 주요 기능 | 인증 |
|---|---|---|
| `auth` | 가입·로그인·Kakao·Apple·비밀번호 재설정·push token | public / token 저장은 protected |
| `user` | 프로필·비밀번호·탈퇴·알림 설정 | protected |
| `products` | 목록·상세·등록·상태 변경·내 상품 | 목록/상세 public, 나머지 protected |
| `companies` / `businesses` | 업체·추천업체 목록·상세 | public |
| `favorites` / `recentViews` / `purchases` | 개인 활동 목록 | protected |
| `upload` | 상품·채팅·증빙·프로필 이미지 | protected |
| `chats` / `notifications` | 채팅·읽음·거래 상태·알림 | protected |
| `seller` / `company` | 신청·프로필·업체 정보 | protected |
| `reports` / `inquiries` / `reviews` | 신고·문의·후기 | 혼합 |
| `admin` | 심사·회원·상품·신고·공지·문의·업체 | admin |

## 34. 배포 구조

| 대상 | 현재 구성 |
|---|---|
| API | Git 저장소 기준 Render Node web service, `pnpm install && pnpm build`, `pnpm start` |
| DB | `DATABASE_URL` 및 `DB_SSL=true` Render 설정 |
| iOS/Android | EAS `production` profile, store distribution, API base URL 주입 |
| 홈페이지 | 별도 정적 HTML/CSS/JS 프로젝트를 Netlify 배포 |

Render free plan 설정은 idle·응답 지연 가능성을 운영 리스크로 기록한다. 실제 자동 배포 트리거·GitHub 연결 상태는 Render 대시보드 확인이 필요하다.

## 35. 현재 앱 출시 상태

| 플랫폼 | 확인된 상태 |
|---|---|
| iOS | App Store production `1.0.0 (6)`, 2026-08-21 빌드 기록. 카카오 로그인 후 인증 상태 반영 수정 포함 |
| Android 공개 기준 | 기존 Play production `1.0.0 (2)` 기록. iOS 최신 카카오 수정과 기준 차이 존재 |
| Android 최신 초안 | `1.0.0 (3)` AAB는 Play Console 프로덕션 임시보관에 저장됐으나 검토 제출·공개 미실행 |
| 출시 전 확인 | Android 실기기 핵심 흐름 전수 테스트·Play 정책 최종 확인 필요 |

## 36. 공식 홈페이지

공식 홈페이지는 `/home/ubuntu/closing-market-website`의 별도 정적 프로젝트다. `index.html`, 구매자·판매자·업체 입점 페이지, 정책·문의·계정 삭제 페이지, sitemap, RSS, robots를 포함한다. Netlify 공개 주소는 `https://closingmarket.netlify.app`이며, 네이버 검색 등록 기록이 존재한다.

앱 다운로드 CTA는 구조가 있으나 Android 공개 스토어 URL은 출시 전이므로 완성 여부를 재확인해야 한다. GA4 등 일반 유입 분석 설치는 현재 확인되지 않는다.

## 37. 앱과 홈페이지 관계

앱은 로그인, 인증, 물품 등록, 탐색, 채팅, 찜, 후기, 신고, 관리자 운영을 수행한다. 홈페이지는 서비스 설명, 검색 유입, 사업장물품 키워드 SEO, 정책·계정 삭제 안내, 앱 다운로드 유도 역할을 수행한다. 홈페이지 작업은 앱 저장소의 기능·출시 코드와 분리되어야 한다.

## 38. 현재 마케팅·유입 구조

현재 확인된 유입 기반은 Netlify 공식 홈페이지, 네이버 Search Advisor 등록, sitemap/RSS, 폐업물품·사업장물품 SEO, Instagram/Reels용 홍보 소재다. Threads, 명함, 오프라인 영업, 제휴 업체 네트워크는 전략 후보이나 실제 운영량은 **NEEDS VERIFICATION**이다.

## 39. 현재 사용자 확보 전략

현재 우선순위는 복잡한 기능보다 매물 공급과 구매 수요를 동시에 만드는 것이다. 판매 공급은 폐업·이전·장비 교체·업종 변경·사업장 정리 사업자에게 접근하고, 수요는 예비창업자·기존 사업자·중고기기 업자·사업장 물품 구매자에게 집중한다. 초기에는 광고 전면 확대보다 현장 인터뷰와 실제 등록·문의 전환을 측정한다.

## 40. 중고기기 업체 네트워크

중고기기·집기 업체는 공급 매물, 창업자 수요, 폐업 사업장 정보에 동시에 접할 수 있는 핵심 연결점이다. 현재 특정 업체명·계약·리드 공급은 코드에서 확인되지 않으므로 **PLANNED / NEEDS VERIFICATION**이다. 업체 등록·승인 기능을 실제 네트워크 운영과 연결하는 것이 먼저다.

## 41. 오프라인 영업 전략

특정 지역의 카페·PC방·식당·헬스장·미용실·사무실을 방문해 물품 처분 경험, 기존 거래 채널, 수요·공급 시점, 등록 의향을 조사한다. 목적은 단순 홍보가 아니라 카테고리 우선순위·가격대·사진 품질·거래 방식·업체 연계 수요를 문서화하는 것이다. 지역명은 운영 결정 후 별도 관리하며 개인정보는 본 문서에 기록하지 않는다.

## 42. “당근에 올리면 되지 않나요?” 포지셔닝

당근 등에서도 판매는 가능하다. 클로징마켓은 사업장 물품을 찾는 수요와 매물을 집중시키고, 이후 철거·인테리어·청소·운송 등 사업 전환 과정의 업체 연결까지 확장하는 전문성을 제공한다. UI·브랜드를 일반 중고거래 앱처럼 복제하기보다, 인증·물품 맥락·업체 연결이라는 신뢰 요소를 강화한다.

## 43. 향후 기능 전체 목록과 개발 우선순위

| 기능 | 목적 | 현재 상태 | 개발 조건 |
|---|---|---|---|
| 찾어요 | 구매 수요 등록 | **NOT IMPLEMENTED** | 매물·사용자 확보 |
| 통합찾기 | 시작·정리 서비스 통합 | **PARTIALLY IMPLEMENTED / PLANNED** | draft 분리 재검증, 백엔드 설계 |
| 업체찾기 고도화 | 업체 연결 품질 개선 | **PARTIALLY IMPLEMENTED** | 업체 데이터 확보 |
| 견적 요청 | 업체 리드 생성 | **NOT IMPLEMENTED** | 업체 확보·개인정보 정책 |
| 방문예약 | 현장 일정 연결 | **NOT IMPLEMENTED** | 견적 요청 이후 |
| 연결 과금 | 리드 수익화 | **NOT IMPLEMENTED** | 충분한 공급·수요·결제 정책 |
| 사업장 양도양수 | 거래 범위 확대 | **PARTIALLY IMPLEMENTED / PLANNED** | 별도 심사·법률·운영 설계 |

<!--raw-typst #figure(visual("service-expansion.png", width: 92%), caption: [현재 물품 거래 기반 위에 향후 업체·견적·방문·연결 관리가 확장되는 구조.]) -->

<!--raw-typst #figure(visual("development-roadmap.png", width: 78%), caption: [기능 추가보다 매물·사용자·업체 확보를 우선하는 단계별 로드맵.]) -->

## 44. 현재 절대 우선순위가 아닌 기능

불필요한 커뮤니티, 복잡한 등급·포인트·배지, 판매자 유료광고, 초기 추천 알고리즘, 사용자가 적은 상태의 과도한 자동화는 현재 우선순위가 아니다. 모든 기능은 “실제 사업장 물품 거래와 문의를 늘리는가?”라는 기준으로 평가한다.

## 45. 향후 개발 우선순위 기준

새 기능은 거래 발생 가능성, 판매자·구매자·업체 확보 효과, 반복 사용성, 개발·운영 난이도, 개인정보·보안 위험, 수익화 가능성의 7가지 기준으로 평가한다. 기능이 매물·수요·상담 데이터를 만들지 못하면 후순위로 둔다.

## 46. 기술 스택 및 서비스

| 영역 | 확인된 구성 |
|---|---|
| Mobile | Expo SDK 54, React Native 0.81, Expo Router 6, React 19 |
| UI | NativeWind 4, Lucide, Expo Symbols, Safe Area, Gesture Handler |
| 상태·데이터 | Zustand, TanStack Query, tRPC v11, SuperJSON |
| Server | Node.js, Express, TypeScript/tsx, esbuild |
| DB | TiDB/MySQL 호환, Drizzle ORM, mysql2 |
| 인증 | JWT, bcrypt, Kakao API, Apple Authentication, SecureStore |
| Storage | Cloudflare R2, AWS S3 SDK |
| Notifications | Expo Notifications / Expo Push |
| Email | Resend API 코드 참조 |
| Website | 정적 HTML/CSS/JS, Netlify, Naver Search Advisor |

## 47. 환경변수

값은 문서에 기록하지 않는다. 현재 코드·설정에서 확인된 이름은 `DATABASE_URL`, `DB_SSL`, `JWT_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`, `EXPO_PUBLIC_KAKAO_APP_ID`, `EXPO_PUBLIC_KAKAO_CLIENT_SECRET`, `OAUTH_SERVER_URL`, `WEB_APP_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `EAS_PROJECT_ID`, `ALLOWED_ORIGINS`, `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` 등이다. 운영 환경에는 최소 권한·정기 교체·노출 방지 원칙을 적용한다.

## 48. 현재 문제점

| 우선순위 | 문제 | 영향 | 권장 조치 |
|---|---|---|---|
| Critical | 현재 코드 main에 통합찾기 파일이 추적되며 출시 분리 원칙과 충돌 | 의도치 않은 다음 빌드 포함 위험 | 출시 기준 branch·commit·EAS source를 재감사하고 draft 분리 |
| High | Apple identity token 서명 검증 부재 | 인증 위변조 위험 | Apple JWKS 기반 signature/issuer/audience/nonce 검증 |
| High | 사업자 증빙이 public R2 URL 구조에 저장될 수 있음 | 민감 문서 노출 위험 | private bucket·signed URL·접근 제어·보존 정책 |
| High | Android 최신 공개본이 iOS 최신 로그인 수정 기준보다 이전 | 플랫폼 기능 불일치 | 실기기 검증 후 Android 업데이트 심사 |
| Medium | 검색이 클라이언트 30개 결과 필터 중심 | 검색 품질·확장성 저하 | 서버 검색·정렬·가격·지역 조건 설계 |
| Medium | 리뷰 거래완료/중복 강제 확인 부족 | 신뢰도 저하 가능 | 서버 transaction 검증·unique 제약 |
| Medium | 기존 TypeScript 오류 약 38건 기록 | 유지보수·다음 빌드 리스크 | 테스트 mock·SSL type·rateLimit timer 등 단계 정리 |
| Low | GA4 등 웹 분석 미설치 | 유입·CTA 판단 제한 | 개인정보 고지 후 익명 분석 설치 검토 |

## 49. 현재 개발 완료 체크리스트

- [x] 이메일 회원가입·로그인·비밀번호 재설정 흐름
- [x] Kakao 로그인
- [x] Apple 로그인 화면·서버 경로(서명 검증은 개선 필요)
- [x] 인증 판매자 상품 등록과 이미지 업로드
- [x] 상품 목록·카테고리·상세·상태 변경
- [x] 상품 찜·최근 본 상품·구매 내역 조회
- [x] 1:1 채팅·읽음·채팅 이미지·채팅 push 시도
- [x] 후기·신고·고객 문의·알림 설정
- [x] 판매자·업체 신청과 관리자 승인 기능
- [x] 관리자 회원·상품·신고·공지·문의 관리 API
- [x] 공식 홈페이지·정책·계정 삭제 공개 페이지·네이버 SEO 기반
- [x] 물품 등록 시 foreground 위치 권한과 시/구/동 텍스트 자동 입력

## 50. 아직 개발하지 않은 기능

- [ ] 서버 기반 전문 검색·가격·거리·정렬·주변 검색
- [ ] 찾어요 수요 등록·판매자 제안·알림
- [ ] 통합찾기 견적 요청 백엔드·DB·운영 플로우
- [ ] 업체 견적·방문예약·리드관리
- [ ] 연결 과금·결제·환불·정산
- [ ] 사용자 차단·리뷰 신고·댓글 기능의 실제 운영 연결
- [ ] 민감 사업자 증빙의 private storage·signed URL
- [ ] Apple 토큰 완전 검증
- [ ] 사업장 양도양수의 사용자 화면·API·운영 정책

## 51. 프로젝트 현재 상태 요약

> **한 줄 요약:** 현재 클로징마켓은 인증 판매자가 사업장 물품을 등록하고 구매자가 검색·찜·채팅·후기로 거래를 진행할 수 있는 **초기 운영·검증 단계**다.

기술적으로는 Expo 기반 모바일 앱, tRPC API, TiDB/MySQL 호환 DB, R2 파일 저장, 관리자 운영 API, 별도 Netlify 홈페이지가 구현돼 있다. 서비스적으로는 iOS 공개 기록이 있고 Android는 최신 AAB가 심사 제출 전 임시보관 상태다.

가장 중요한 과제는 기능을 더 늘리는 것이 아니라 **실제 사업장 물품 매물, 구매 수요, 승인 업체를 확보하고 거래 흐름을 실기기에서 검증하는 것**이다. 견적·방문·연결 과금보다 매물과 사용자 확보가 우선이다.

## 52. 개발자가 반드시 기억해야 할 사항

클로징마켓의 목적은 기능이 많은 앱을 만드는 것이 아니라 실제 사업장 물품 거래와 연결을 만드는 것이다. 새 기능을 추가하기 전에는 사용자 수요, 매물, 거래 데이터, 운영 인력, 개인정보·보안 비용을 확인한다.

기존 물품 등록·검색·채팅·인증 흐름을 깨지 않는 것을 최우선으로 한다. 통합찾기 등 출시 전 기능은 현재 출시 코드와 분리하고, 서버·DB·정책·실기기 검증이 완료된 뒤에만 배포 후보로 승격한다. 앱과 홈페이지는 서로 다른 프로젝트이므로 홈페이지 변경이 앱 출시 기준을 바꾸지 않도록 관리한다.

<!--raw-typst #app-screen-grid("screens/01-home.png", [관리자 대시보드 — 회원·상품·신고 현황], "screens/02-register.png", [마이페이지 — 개인 기능·관리자 진입], [사용자 제공 화면 1·2. 운영 관리와 개인 메뉴 화면 사례.]) -->

<!--raw-typst #app-screen-grid("screens/03-search.png", [내 상품 — 판매자가 등록한 물품 관리], "screens/04-product-detail.png", [등록하기 — 상품·업체 등록 유형 선택], [사용자 제공 화면 3·4. 판매자 상품 관리와 등록 진입 화면 사례.]) -->

<!--raw-typst #app-screen-grid("screens/05-chat.png", [채팅 목록 — 판매자·구매자 대화 관리], "screens/06-mypage.png", [업체 찾기 — 개별 업체·통합찾기 진입], [사용자 제공 화면 5·6. 현재 채팅과 업체 연결 진입 화면 사례.]) -->

<!--raw-typst #app-screen-grid("screens/07-company-search.png", [통합찾기 — 출시 전 draft 참고], "screens/08-integrated-draft.png", [업체찾기 — 현재 업체 탐색], [사용자 제공 화면 7·8. 통합찾기는 현재 공개 출시 기능으로 간주하지 않는다.]) -->
