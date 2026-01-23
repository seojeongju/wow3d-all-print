# Cloudflare Pages 배포 가이드

## 1. Wrangler CLI 설치 확인

```bash
npm install
```

## 2. Cloudflare 로그인

```bash
npx wrangler login
```

## 3. D1 데이터베이스 생성

```bash
# 프로덕션 데이터베이스 생성
npx wrangler d1 create wow3d-production

# 출력된 database_id를 wrangler.toml에 복사
```

## 4. 스키마 적용

```bash
# 로컬 개발 DB
npx wrangler d1 execute wow3d-production --local --file=./schema.sql

# 프로덕션 DB
npx wrangler d1 execute wow3d-production --file=./schema.sql
```

## 5. R2 버킷 생성

```bash
npx wrangler r2 bucket create wow3d-files
```

## 6. Cloudflare Pages 프로젝트 생성

1. Cloudflare 대시보드 접속: https://dash.cloudflare.com/
2. Pages 섹션으로 이동
3. "Create a project" 클릭
4. GitHub 연동 선택
5. wow3d_all_print 레포지토리 선택
6. 빌드 설정:
   - **Framework preset**: Next.js
   - **Build command**: `npm run pages:build`
   - **Build output directory**: `.vercel/output/static`

## 7. 환경 변수 설정

Cloudflare Pages 프로젝트 설정에서:

### Production 환경
- `ENVIRONMENT`: `production`

### Bindings 설정
- **D1 Database**: `DB` → `wow3d-production`
- **R2 Bucket**: `BUCKET` → `wow3d-files`

## 8. 로컬 개발

```bash
# Next.js 개발 서버 (DB 없음)
npm run dev

# Cloudflare Pages 로컬 개발 (DB 포함)
npm run pages:dev
```

## 9. 배포

```bash
# GitHub에 푸시하면 자동 배포
git push origin main
```

## 주요 명령어

```bash
# D1 Database 쿼리 실행
npx wrangler d1 execute wow3d-production --command="SELECT * FROM users LIMIT 10"

# D1 Database 로컬 테스트
npx wrangler d1 execute wow3d-production --local --command="SELECT * FROM users"

# R2 파일 리스트
npx wrangler r2 object list wow3d-files

# Pages 로그 확인
npx wrangler pages deployment tail
```

## 트러블슈팅

### Next.js와 Cloudflare Pages 호환성
- Edge Runtime을 사용하는 API Routes는 `export const runtime = 'edge'` 추가
- Node.js 런타임이 필요한 경우 Cloudflare Workers 사용 권장

### CORS 이슈
- `functions/_middleware.ts`에서 CORS 헤더 설정

### D1 연결 실패
- `wrangler.toml`의 `database_id`가 올바른지 확인
- Cloudflare Pages 바인딩 설정 확인
