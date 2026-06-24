# Project TODO

- [x] 테마 컬러 설정 (블루 #3B82F6, 옐로우 브랜드 컬러 적용)
- [x] 아이콘 매핑 추가 (탭바, 상세화면 등 전체 아이콘)
- [x] 하단 탭바 구현 (홈, 카테고리, 등록하기, 채팅, 마이페이지)
- [x] 홈 화면 구현 (카테고리 스크롤, 추천 물품, 추천 업체, 최신 물품)
- [x] 카테고리 화면 구현 (그리드 + 상품 목록)
- [x] 채팅 목록 화면 구현
- [x] 마이페이지 화면 구현 (프로필, 나의 활동, 설정)
- [x] 상품 등록 화면 구현 (폼, 카테고리 선택, 가격 입력)
- [x] 상품 상세 페이지 구현
- [x] 업체 상세 페이지 구현
- [x] 검색 화면 구현 (카테고리 필터)
- [x] 알림 화면 구현
- [x] 데이터베이스 스키마 설계 (상품, 업체, 찜, 채팅, 알림, 후기, 신고 테이블)
- [x] 서버 API 라우터 구현 (products, businesses, favorites, chats, notifications)
- [x] 앱 로고 적용 및 브랜딩 설정 (클로징마켓 로고)

## 판매자 인증 시스템

- [x] DB 스키마 - sellerApplications 테이블 추가
- [x] DB 스키마 - users 테이블에 role, sellerStatus 컬럼 추가
- [x] DB 마이그레이션 실행
- [x] 서버 API - 판매자 신청 제출 (이미지 포함)
- [x] 서버 API - 관리자 승인/반려/정지 처리
- [x] 서버 API - 신청 상태 조회 및 목록 조회
- [x] 판매자 가입 1단계 - 판매 유형 선택 화면
- [x] 판매자 가입 2단계 - 사업자 정보 입력 화면
- [x] 판매자 가입 3단계 - 증빙자료 업로드 화면
- [x] 판매자 가입 4단계 - 승인 대기 화면
- [x] 등록하기 탭 - 미인증 회원 진입 시 판매자 인증 페이지로 이동
- [x] 인증 판매자 배지 컴포넌트 (프로필, 상품 카드에 표시)
- [x] 관리자 페이지 - 판매자 신청 목록 및 승인/반려 처리

## 1:1 채팅 기능

- [x] 채팅 DB 스키마 확인 (chatRooms, chatMessages 테이블)
- [x] 서버 API - 채팅방 생성/조회
- [x] 서버 API - 메시지 전송 (텍스트)
- [x] 서버 API - 이미지 메시지 전송
- [x] 서버 API - 메시지 목록 조회 (페이지네이션)
- [x] 서버 API - 읽음 처리
- [x] 서버 API - 채팅 목록 조회 (최신 메시지 + 읽지 않은 수)
- [x] 채팅 목록 화면 (chat.tsx 개선)
- [x] 채팅방 화면 구현 (app/chat/[id].tsx)
- [x] 폴링 기반 실시간 메시지 업데이트 (3초 간격)
- [x] 읽음 표시 UI
- [x] 사진 전송 (이미지 피커 + 업로드)
- [x] 상품 상세에서 "채팅하기" 버튼 연동

## 거래 후기 시스템

- [x] DB 스키마 - reviews 테이블 확인 및 보완
- [x] 서버 API - 후기 작성 (별점 + 텍스트)
- [x] 서버 API - 후기 목록 조회 (판매자별)
- [x] 서버 API - 판매자 평균 별점 조회
- [x] 채팅방 거래완료 후 후기 작성 유도 화면
- [x] 별점 입력 UI (터치 가능한 별 5개)
- [x] 후기 작성 화면 구현
- [x] 판매자 프로필 화면에 후기 목록 및 평균 별점 표시
- [x] 마이페이지 - 내가 받은 후기 목록
- [x] 중복 후기 방지 (거래 1건당 1개)

## 관리자 대시보드

- [x] 관리자 API - 통계 (회원수, 상품수, 거래수, 신고수)
- [x] 관리자 API - 전체 상품 목록 조회 및 삭제
- [x] 관리자 API - 신고 목록 조회 및 처리 (승인/기각)
- [x] 관리자 API - 공지사항 CRUD
- [x] 관리자 API - 회원 목록 조회 및 정지
- [x] 관리자 대시보드 화면 - 통계 카드 (홈)
- [x] 관리자 대시보드 화면 - 상품 관리 탭
- [x] 관리자 대시보드 화면 - 신고 관리 탭
- [x] 관리자 대시보드 화면 - 회원 관리 탭
- [x] 관리자 대시보드 화면 - 공지사항 관리 탭
- [x] 마이페이지에서 관리자 전용 메뉴 진입

## 찜 목록 및 가격 변동 알림

- [ ] 서버 API - 찜 토글 (추가/제거)
- [ ] 서버 API - 내 찜 목록 조회
- [ ] 서버 API - 상품 찜 여부 확인
- [ ] 서버 API - 가격 변동 시 찜한 사용자에게 알림 생성
- [ ] 마이페이지 찜 목록 화면 구현
- [ ] 상품 상세 페이지 찜 버튼 실제 동작 연동
- [ ] 상품 가격 수정 시 찜한 사용자 알림 자동 생성

## 인증 시스템 교체 (JWT + 이메일/카카오)

- [x] DB 스키마 - users 테이블에 password, kakaoId 컬럼 추가 및 마이그레이션
- [x] 서버 API - auth.register (이메일 회원가입)
- [x] 서버 API - auth.login (이메일 로그인)
- [x] 서버 API - auth.me (토큰으로 사용자 정보 조회)
- [x] 서버 API - auth.kakaoLogin (카카오 액세스 토큰으로 로그인)
- [x] 서버 context.ts - Authorization 헤더에서 JWT 파싱하여 ctx.user 주입
- [x] lib/trpc.ts - AsyncStorage의 JWT 토큰을 Authorization 헤더로 전달
- [x] lib/auth-store.ts - Zustand 기반 JWT 인증 상태 관리 스토어
- [x] app/auth/login.tsx - 이메일/비밀번호 로그인 화면
- [x] app/auth/register.tsx - 이메일 회원가입 화면
- [x] app/auth/kakao.tsx - 카카오 로그인 화면
- [x] app/_layout.tsx - 앱 시작 시 loadFromStorage() 호출
- [x] app/(tabs)/mypage.tsx - useAuthStore로 교체, 로그인/로그아웃 버튼 연동
- [x] app/(tabs)/chat.tsx - useAuthStore로 교체
- [x] app/(tabs)/register.tsx - useAuthStore로 교체
- [x] app/chat/[id].tsx - useAuthStore로 교체
- [x] app/product/[id].tsx - useAuthStore로 교체
- [x] app/notifications/index.tsx - useAuthStore로 교체
- [x] app/admin/dashboard.tsx - useAuthStore로 교체

## 회원가입 개선

- [x] 회원가입 화면에 구매자/판매자 유형 선택 UI 추가 (카드 선택 방식)
- [x] 서버 auth.register에 userType 파라미터 추가
- [x] 판매자 가입 시 가입 완료 후 판매자 인증 페이지로 자동 이동
- [x] 관리자 테스트 계정 생성 (admin@closingmarket.com)

## 계정설정 / 알림설정

- [x] 계정설정 화면 구현 (이름/전화번호 수정, 비밀번호 변경)
- [x] 알림설정 화면 구현 (채팅/찜가격변동/거래/마케팅 항목별 ON/OFF 토글)
- [x] DB users 테이블에 notifChat/notifPriceDrop/notifTrade/notifMarketing 컬럼 추가
- [x] 서버 user.updateProfile, user.changePassword, user.getNotificationSettings, user.updateNotificationSettings API 구현
- [x] 마이페이지 설정 메뉴에 onPress 핸들러 연결
