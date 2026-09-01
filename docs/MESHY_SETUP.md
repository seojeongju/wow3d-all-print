# Meshy AI Image-to-3D 연동 설정

자동견적에서 **「3D 모델이 없어요」** 경로로 제품 사진 → AI 3D 모델링 → 기존 견적 파이프라인을 사용합니다.

## 1. Meshy API 키

1. [meshy.ai](https://www.meshy.ai) 가입 (Pro 이상, API 사용)
2. API 페이지에서 API Key 발급
3. 크레딧 충전 (Image to 3D mesh ≈ 20 credits / 회, 텍스처 OFF 기준)

## 2. API 키 (Cloudflare Secret)

**Meshy**

```bash
npx wrangler secret put MESHY_API_KEY
```

**Tripo3D** (선택 — 관리자에서 Meshy/Tripo 전환 가능)

```bash
npx wrangler secret put TRIPO_API_KEY
```

로컬 `.dev.vars`:

```
MESHY_API_KEY=msy_xxxxxxxx
TRIPO_API_KEY=tsk_xxxxxxxx
```

(`TRIPO3D_API_KEY` 이름도 지원합니다.)

## 3. D1 마이그레이션

```bash
npx wrangler d1 execute wow3d-production --remote --file=./migrations/schema_meshy_jobs.sql
npx wrangler d1 execute wow3d-production --remote --file=./migrations/schema_gallery_source_image.sql
npx wrangler d1 execute wow3d-production --remote --file=./migrations/schema_meshy_provider.sql
```

갤러리 Before/After(원본 사진) 쇼케이스 예시 데이터:

```bash
npx wrangler d1 execute wow3d-production --remote --file=./migrations/seed_photo_to_3d_gallery.sql
```

## 4. 동작 확인

1. https://www.wow3dp.co.kr/quote 접속
2. **3D 모델이 없어요** 선택
3. JPG/PNG 업로드 → AI 생성 → **이 모델로 견적 진행** → 견적 설정

### AI 엔진 선택 (관리자)

`/admin/meshy` → **AI 3D 엔진 선택**에서 Meshy 또는 Tripo3D를 선택합니다.  
신규 생성만 변경되며, 진행 중 작업은 생성 당시 엔진으로 완료됩니다.

## 한도

| 구분 | 일일 한도 |
|------|-----------|
| 회원 (로그인) | **1회** (한국 시간 기준, 계정당) |
| 비회원 | 이용 불가 (로그인 필요) |

- 생성 실패(`failed`) 건은 한도에 포함하지 않습니다.
- 진행 중·성공 건은 당일 1회로 집계됩니다.

## API

- `GET /api/meshy/quota` — 오늘 남은 횟수
- `GET /api/meshy/jobs/active` — 오늘 진행·완료 작업 복구
- `POST /api/meshy/jobs` — 이미지 업로드 + Meshy task 생성
- `GET /api/meshy/jobs/:id` — 상태 폴링 (성공 시 STL을 R2 저장)
- `GET /api/meshy/jobs/:id/model` — 생성된 STL 다운로드

## 구현된 고도화

### Phase A (신뢰)
- 촬영 가이드(좋은 예 / 피하세요)
- 남은 횟수 UI + KST 리셋 안내
- 로그인·한도·실패 메시지 정리
- 결과 확인 단계(자동 적용 대신 「이 모델로 견적 진행」)
- 진행 중 job 복구(새로고침 후 폴링 재개)

### Phase B (전환)
- 클라이언트 전처리(대비·해상도)
- 선택적 배경 제거(`/api/maker/remove-bg` 재사용)
- 견적 화면 AI 생성 모델 안내 + mm 스케일 유도

### Phase C (수익 골격)
- 내 생성 히스토리 (`GET /api/meshy/jobs`) · 과거 STL을 견적에 다시 넣기
- 관리자 보너스 횟수 (`meshy_bonus_credits`) — 일일 1회 소진 후 추가 생성
- 관리자 `/admin/meshy` — 오늘/7일 사용량·실패율·credits, **회원 검색·선택** 후 보너스 부여

```bash
npx wrangler d1 execute wow3d-production --remote --file=./migrations/schema_meshy_bonus.sql
```

### Phase D (품질)
- 품질 프리셋: **빠름**(저폴리) / **표준**(기본)
- **멀티뷰**: 정면 + 선택 우측·뒷면·좌측 → Meshy Multi-Image to 3D
- 생성 완료 시 정면·우·뒤·좌 썸네일 미리보기
- 견적 화면 **출력 적합성 경고**(얇은 벽·작은 부피·오버행) — 자동 수리는 하지 않음

## SEO · 쇼케이스 · 로그인 연동

| 페이지 | URL |
|--------|-----|
| 사진→3D 견적 | `/quote?entry=photo` |
| 사진→3D 가이드 | `/guides/photo-to-3d-printing-quote` |
| 사진→3D 서비스 | `/services/photo-to-3d` |
| 갤러리 Before/After | `/gallery?tag=photo-to-3d` |
| 로그인 (사진 견적 유도) | `/auth?return=/quote?entry=photo` |

### 갤러리 Before/After 등록 (`/admin/gallery`)

1. **출력물·AI 3D 결과** + **원본 사진 Before** 업로드
2. 태그에 `photo-to-3d` 포함
3. 노출 ON → 가이드·서비스 쇼케이스·갤러리 필터에 자동 반영

실제 Meshy 작업 사례가 생기면 위 형식으로 교체·추가하세요.

## 다음 (미구현)

- 고품질 텍스처·GLB 다운로드
- Printability 자동 메시 수리
- 결제 연동 추가 생성 (현재는 관리자 보너스)
