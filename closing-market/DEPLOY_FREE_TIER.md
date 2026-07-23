# 무료 배포 가이드 - 클로징마켓 백엔드 + DB + 이미지 스토리지

**초기 비용 0원**으로 백엔드(Node.js), 데이터베이스(MySQL), 이미지 업로드를 모두 실제 운영 가능한 형태로
배포하는 구성입니다. 아래 3개 서비스 조합을 사용합니다.

| 구성 요소 | 서비스 | 무료 범위 | 비고 |
|---|---|---|---|
| 백엔드 서버 | **Render** (Web Service) | 750시간/월, HTTPS 자동 포함 | 신용카드 불필요 |
| 데이터베이스 | **TiDB Cloud Starter** | 5GB 저장공간 + 월 5천만 RU | MySQL 호환, 신용카드 불필요 |
| 이미지 업로드 | **Cloudflare R2** | 10GB 저장공간, 다운로드 무제한 무료 | S3 호환 |

---

## 왜 이 조합인가

### 왜 AWS EC2/RDS가 아닌가
처음에 AWS를 여쭤보셨는데, AWS EC2/RDS 무료 티어는 **가입 후 12개월만 무료**이고 이후 자동으로 유료
전환됩니다. 또한 EC2는 Nginx, 보안그룹, HTTPS 인증서(Let's Encrypt)를 직접 설정해야 해서 손이 많이 갑니다.
"초기 비용 0원 + 관리 부담 최소화"라는 목표에는 아래 조합이 더 잘 맞습니다.

### 왜 MySQL을 유지할 수 있는가
가장 유명한 서버리스 MySQL이었던 PlanetScale은 2024년에 무료 티어를 없앴어요(최소 $5/월). 대신
**TiDB Cloud Starter**를 추천합니다:
- MySQL 8.0 프로토콜과 100% 호환 → 지금 쓰시는 `mysql2` + `drizzle-orm` 코드를 거의 그대로 사용 가능
- 완전 무료, 신용카드 등록 불필요, 기간 제한 없음(다른 서비스들처럼 "30일 후 삭제" 같은 제약 없음)
- 5GB 저장공간, 월 5천만 Request Unit → 초기 서비스 단계에서는 충분

### 이미지 업로드는 왜 손봐야 했는가
기존 코드는 Manus 전용 스토리지(Forge API)를 사용하고 있었어요. 이건 **Manus 밖에서는 작동하지 않는
내부 서비스**라서, 그대로는 배포가 불가능했습니다. 그래서 `server/storage.ts`를 **Cloudflare R2**(S3
호환, 10GB 무료, 다운로드 트래픽 비용 없음)를 쓰도록 다시 작성했습니다. 코드에서 호출하는 방식
(`storagePut(...)`)은 그대로라서 다른 파일은 전혀 안 건드렸어요.

---

## 1단계 - TiDB Cloud (데이터베이스) 설정

1. [tidbcloud.com](https://tidbcloud.com) 가입 (신용카드 불필요)
2. "Create Cluster" → **Starter** 선택 → 리전은 서비스 대상 기준으로 가까운 곳 선택
3. 생성 후 **Connect** 버튼 클릭 → "Node.js" 탭에서 연결 문자열 확인
   - 형태: `mysql://<prefix>.<user>:<password>@<host>:4000/<database>`
4. 이 문자열을 그대로 `DATABASE_URL` 환경변수에 사용 (아래 3단계에서 등록)
5. 로컬 또는 Manus에서 스키마를 반영하려면:
   ```bash
   DATABASE_URL="위에서 받은 연결 문자열" DB_SSL=true pnpm db:push
   ```

> **주의**: TiDB Cloud Starter는 30분 이상 유휴 상태인 연결을 끊을 수 있습니다. 이미 코드가 커넥션
> 풀(`mysql.createPool`)을 사용하고 있어서 대부분 자동으로 재연결되지만, 트래픽이 아주 적은 시간대에는
> 첫 요청이 약간 느릴 수 있습니다.

---

## 2단계 - Cloudflare R2 (이미지 업로드) 설정

1. [dash.cloudflare.com](https://dash.cloudflare.com) 가입
2. 좌측 메뉴에서 **R2** 선택 → "Create bucket" → 이름 예: `closing-market-uploads`
   - R2 활성화 시 카드 등록을 요구할 수 있으나, 무료 한도(10GB) 내에서는 청구되지 않습니다
3. 버킷 생성 후 **Settings → Public Access**에서 공개 접근을 활성화하고,
   `r2.dev` 공개 URL을 확인하거나 커스텀 도메인을 연결
4. **R2 → Manage R2 API Tokens → Create API Token**
   - 권한: Object Read & Write, 대상 버킷: 방금 만든 버킷
   - 발급된 Access Key ID / Secret Access Key를 저장
5. 계정 홈 화면 우측에서 **계정 ID(Account ID)** 확인

환경변수로 정리하면:
```
R2_ACCOUNT_ID=계정ID
R2_ACCESS_KEY_ID=발급받은 키
R2_SECRET_ACCESS_KEY=발급받은 시크릿
R2_BUCKET_NAME=closing-market-uploads
R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev   (또는 연결한 커스텀 도메인)
```

---

## 3단계 - Render (백엔드 서버) 배포

1. [render.com](https://render.com) 가입 (GitHub 계정으로 가능, 신용카드 불필요)
2. GitHub에 이 프로젝트를 올려두기 (Render는 Git 저장소 연결 방식으로 배포)
3. Render 대시보드 → "New +" → "Web Service" → 저장소 선택
   - 이미 포함된 `render.yaml`을 인식하면 설정이 자동으로 채워집니다
   - 수동 설정 시: Build Command `pnpm install && pnpm build`, Start Command `pnpm start`
4. **Environment** 탭에서 아래 환경변수 등록:
   ```
   NODE_ENV=production
   JWT_SECRET=(openssl rand -hex 32 로 생성한 값)
   DATABASE_URL=(1단계에서 받은 TiDB 연결 문자열)
   DB_SSL=true
   R2_ACCOUNT_ID=...
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET_NAME=closing-market-uploads
   R2_PUBLIC_URL=...
   ```
5. Deploy 클릭 → 몇 분 후 `https://closing-market-api.onrender.com` 같은 실제 운영 URL 발급
   - **HTTPS는 Render가 자동으로 붙여줍니다.** 별도 인증서 설정이 필요 없습니다.

### Render 무료 티어의 한계 (미리 알아두실 것)
- **15분간 요청이 없으면 서버가 잠들고, 다음 요청 시 30~60초 정도 깨어나는 시간이 걸립니다.**
  초기 테스트/베타 단계에는 괜찮지만, 실사용자가 늘면 이 지연이 이탈로 이어질 수 있어요.
- 이 문제를 없애려면 유료 Starter 플랜($7/월)으로 올리면 되는데, 나머지 구조(TiDB, R2)는 그대로
  유지하면서 이 부분만 유료로 전환할 수 있어 부담이 적습니다.
- (선택) 무료로 잠들지 않게 하려면 UptimeRobot 같은 외부 서비스로 10분마다 핑을 보내는 방법도 있지만,
  Render 정책상 권장되지는 않습니다.

---

## 4단계 - 앱(프론트엔드)에서 운영 서버 바라보게 설정

앱을 빌드할 때 아래 환경변수를 실제 Render 주소로 설정해야 앱이 localhost/Manus가 아니라 운영
서버를 바라봅니다.

```
EXPO_PUBLIC_API_BASE_URL=https://closing-market-api.onrender.com
```

- Expo Go로 테스트할 땐 이 값을 `.env`에 넣고 다시 빌드
- 나중에 앱스토어 빌드(EAS Build) 시에도 이 환경변수를 EAS 프로젝트 설정에 동일하게 등록

---

## 유료 전환 경로 (트래픽이 늘어났을 때)

이 구성의 장점은 **한 곳씩만 업그레이드**하면 된다는 점입니다.

| 병목 증상 | 다음 단계 |
|---|---|
| 서버 응답이 느림(콜드 스타트 체감) | Render Starter 플랜($7/월)으로 전환 → 상시 구동 |
| DB 저장공간/RU 초과 | TiDB Cloud에 결제수단 등록 → 같은 클러스터에서 유료로 자동 확장 (코드 변경 없음) |
| 이미지 저장공간 10GB 초과 | R2는 초과분만 GB당 약 $0.015 과금 (여전히 매우 저렴, 코드 변경 없음) |

세 서비스 모두 URL/연결 정보만 그대로 유지한 채 "설정값 업그레이드"만으로 확장되도록 설계했습니다.

---

## 요약 체크리스트

- [ ] TiDB Cloud 클러스터 생성 + `DATABASE_URL` 확보
- [ ] `pnpm db:push`로 스키마 반영 (DB_SSL=true 필요)
- [ ] Cloudflare R2 버킷 생성 + 공개 접근 설정 + API 토큰 발급
- [ ] Render에 GitHub 저장소 연결 + 환경변수 등록 + 배포
- [ ] 발급된 Render URL을 `EXPO_PUBLIC_API_BASE_URL`로 앱에 반영
- [ ] 실제 회원가입/로그인/이미지 업로드 테스트로 전체 플로우 확인
