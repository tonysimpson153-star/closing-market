# 웹 버전 배포 가이드 (Vercel / Netlify)

이 앱은 Expo Router + react-native-web으로 만들어져 있어서, 네이티브 앱과 같은 코드로
브라우저에서 볼 수 있는 정적(static) 웹사이트를 만들 수 있어요. `app.config.ts`에 이미
`web: { bundler: "metro", output: "static" }`가 설정돼 있어서 별도 설정 없이 바로 빌드됩니다.

**중요:** Vercel/Netlify는 "정적 프론트엔드"만 올라갑니다. 로그인/상품/채팅 등 실제 데이터를
다루는 백엔드(서버 + MySQL)는 Vercel/Netlify가 아니라 **지금 쓰고 계신 곳(Manus)이나 별도의
Node 서버 호스팅(Railway, Render 등)에 계속 떠 있어야** 해요. 웹사이트는 그 백엔드에 API로
접속하는 방식입니다.

## 1. 프론트엔드 빌드 명령

```bash
npm run build:web
```

`dist/` 폴더에 정적 웹사이트 파일이 생성돼요. Vercel/Netlify 설정 파일(`vercel.json`,
`netlify.toml`)을 이미 추가해뒀으니, 그냥 저장소를 연결하면 이 명령이 자동 실행돼요.

## 2. 백엔드 주소 연결 (필수)

빌드할 때 환경변수 하나를 반드시 넣어줘야 해요:

```
EXPO_PUBLIC_API_BASE_URL=https://당신의-백엔드-주소
```

- Manus에서 백엔드가 떠 있는 실제 공개 URL을 넣으면 돼요 (예: 미리보기 링크의 포트가
  `8081`이었다면, 백엔드는 보통 같은 서브도메인의 `3000` 포트예요).
- 이 값을 안 넣으면 배포된 사이트가 어떤 백엔드에 접속해야 할지 몰라서 로그인/상품 조회가
  전부 실패해요.
- Vercel: 프로젝트 설정 → Environment Variables에 추가
- Netlify: Site settings → Environment variables에 추가

## 3. 배포 순서

**Vercel**
1. GitHub 등에 이 프로젝트를 올리고 Vercel에서 Import
2. Environment Variables에 `EXPO_PUBLIC_API_BASE_URL` 추가
3. Deploy (빌드 명령/출력 폴더는 `vercel.json`에 이미 설정됨)

**Netlify**
1. 저장소 연결 또는 `dist/` 폴더를 직접 드래그 앤 드롭 배포
2. Site settings에서 `EXPO_PUBLIC_API_BASE_URL` 추가 후 재배포

## 4. 웹에서 100% 똑같이 동작하지 않는 기능

- **카카오 로그인**: 네이티브에서는 앱 딥링크로 돌아오는데, 웹은 리다이렉트 방식이라
  카카오 개발자 콘솔에 웹 리다이렉트 URI를 추가로 등록해야 정상 동작해요.
- **이미지 선택**: `expo-image-picker`가 웹에서는 브라우저 파일 선택창으로 대체돼요.
  대부분 잘 동작하지만 카메라 촬영 같은 기능은 빠져요.
- **푸시 알림**: 모바일 전용 기능이라 웹에서는 동작하지 않아요.
- 나머지 화면(상품 목록/상세, 채팅, 마이페이지, 관리자 대시보드 등)은 그대로 웹에서도
  똑같이 보이고 동작해요 — 기능 확인 용도로는 충분해요.
