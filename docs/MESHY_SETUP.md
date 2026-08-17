# Meshy AI Image-to-3D 연동 설정

자동견적에서 **「3D 모델이 없어요」** 경로로 제품 사진 → AI 3D 모델링 → 기존 견적 파이프라인을 사용합니다.

## 1. Meshy API 키

1. [meshy.ai](https://www.meshy.ai) 가입 (Pro 이상, API 사용)
2. API 페이지에서 API Key 발급
3. 크레딧 충전 (Image to 3D mesh ≈ 20 credits / 회, 텍스처 OFF 기준)

## 2. Cloudflare Secret

```bash
npx wrangler secret put MESHY_API_KEY
```

로컬 `.dev.vars`:

```
MESHY_API_KEY=msy_xxxxxxxx
```

## 3. D1 마이그레이션

```bash
npx wrangler d1 execute wow3d-production --remote --file=./migrations/schema_meshy_jobs.sql
```

## 4. 동작 확인

1. https://www.wow3dp.co.kr/quote 접속
2. **3D 모델이 없어요** 선택
3. JPG/PNG 업로드 → AI 생성 → 견적 설정으로 이동

## 한도 (Phase 1)

| 구분 | 일일 한도 |
|------|-----------|
| 회원 | 5회 |
| 비회원 | 2회 |

## API

- `POST /api/meshy/jobs` — 이미지 업로드 + Meshy task 생성
- `GET /api/meshy/jobs/:id` — 상태 폴링 (성공 시 STL을 R2 저장)
- `GET /api/meshy/jobs/:id/model` — 생성된 STL 다운로드

## 참고

- 생성물은 시제품·형상 확인용에 적합합니다. 정밀 치수는 파일 업로드 권장.
- Phase 2: 멀티뷰 이미지, 유료 과금, printability repair 예정.
