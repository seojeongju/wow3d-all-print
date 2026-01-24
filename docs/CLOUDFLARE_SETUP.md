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

### Node.JS Compatibility Error (`no nodejs_compat compatibility flag set`)

**증상**: 사이트 접속 시 "Node.JS Compatibility Error" / "no nodejs_compat compatibility flag set" 메시지가 표시됨.

**원인**: `@cloudflare/next-on-pages`로 빌드된 Next.js 앱이 Node.js API(Buffer, `process` 등)를 사용하는데, Cloudflare Workers/Pages에 `nodejs_compat` 플래그가 없을 때 발생합니다.

**해결 방법** (둘 중 하나 또는 둘 다 적용):

1. **wrangler.toml (권장)**  
   프로젝트 `wrangler.toml`에 이미 다음이 포함되어 있어야 합니다:
   ```toml
   compatibility_flags = ["nodejs_compat"]
   ```
   포함되어 있다면, 변경 사항을 커밋한 뒤 **다시 배포**해 주세요 (예: `git push` 후 자동 배포).

2. **Cloudflare 대시보드에서 수동 설정**  
   `wrangler.toml`이 빌드에 반영되지 않는 경우 (예: Git 연동만 사용 중):
   - [Cloudflare 대시보드](https://dash.cloudflare.com) → **Workers & Pages** → 해당 **Pages 프로젝트** 선택
   - **Settings** → **Functions** → **Compatibility flags**
   - **Production**과 **Preview** 환경 모두에 `nodejs_compat` 추가 후 **Save**
   - **Retry deployment** 또는 새 배포를 한 번 더 실행

### Next.js와 Cloudflare Pages 호환성
- Edge Runtime을 사용하는 API Routes는 `export const runtime = 'edge'` 추가
- Node.js 런타임이 필요한 경우 Cloudflare Workers 사용 권장

### CORS 이슈
- `functions/_middleware.ts`에서 CORS 헤더 설정

### D1 연결 실패
- `wrangler.toml`의 `database_id`가 올바른지 확인
- Cloudflare Pages 바인딩 설정 확인
