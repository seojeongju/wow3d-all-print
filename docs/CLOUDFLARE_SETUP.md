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

## 10. 관리자 계정

관리자 로그인(`admin@wow3d.com` / `admin1234`)이 되려면 **프로덕션 D1**에 해당 계정이 있어야 합니다.

### 관리자 없을 때 생성

```bash
# 프로덕션 D1에 관리자 추가 (한 번만 실행, 이미 있으면 오류)
npx wrangler d1 execute wow3d-production --file=./create_admin.sql
```

- **이메일**: `admin@wow3d.com`  
- **비밀번호**: `admin1234`  
- `role` 컬럼이 없다면 먼저: `npx wrangler d1 execute wow3d-production --file=./fix_users.sql`

### 비밀번호 초기화(덮어쓰기)

```bash
npx wrangler d1 execute wow3d-production --file=./reset_admin.sql
```

### 확인

```bash
npx wrangler d1 execute wow3d-production --command="SELECT id, email, name, role FROM users WHERE email='admin@wow3d.com'"
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
Git 연동 시 `wrangler.toml`이 "valid Pages configuration"으로 인정되지 않으면 **무시**되며, 이 경우 대시보드에서 수동 설정이 필요합니다.

**해결 순서**

#### 1단계: wrangler.toml 수정 후 재배포 (시도)

- `wrangler.toml`에 `compatibility_flags = ["nodejs_compat"]`와 `pages_build_output_dir = ".vercel/output/static"`(next-on-pages 실제 출력 경로)가 있어야 합니다.
- `pages_build_output_dir`가 `.next` 등 잘못된 값이면 wrangler가 **유효하지 않다**고 판단해 스킵될 수 있습니다.
- 위를 맞춘 뒤 `git push`로 재배포하고, 오류가 사라졌는지 확인합니다.

#### 2단계: 그래도 안 되면 → **대시보드에서 수동 설정 (필수)**

`wrangler.toml`이 반영되지 않는 경우, 반드시 대시보드에서 플래그를 추가해야 합니다.

1. [Cloudflare 대시보드](https://dash.cloudflare.com) 접속  
2. 왼쪽에서 **Workers & Pages** 선택  
3. **Pages** 목록에서 프로젝트(예: `wow3d-all-print`) 클릭  
4. **Settings** 탭 이동  
5. **Functions** 섹션에서 **Compatibility flags** (또는 **Compatibility Flags**) 클릭  
6. **Production**:
   - 입력란에 `nodejs_compat` **직접 입력**
   - 자동완성/드롭다운이 뜨면 **내가 입력한 `nodejs_compat`를 선택** 후 추가 (**Enter만 눌러 다른 항목이 선택되지 않게** 주의)
7. **Preview**도 위와 동일하게 `nodejs_compat` 추가  
8. **Save** 클릭  
9. **Deployments** 탭으로 가서 **Retry deployment** 또는 **Create deployment**로 한 번 더 배포  
10. 배포 완료 후 사이트를 새로고침해 확인

> **참고**: 대시보드 UI에 `nodejs_compat`가 목록에 안 보일 수 있습니다. 이 경우 **직접 입력**(`nodejs_compat`) 후 추가하는 방식을 사용하면 됩니다.

### Next.js와 Cloudflare Pages 호환성
- Edge Runtime을 사용하는 API Routes는 `export const runtime = 'edge'` 추가
- Node.js 런타임이 필요한 경우 Cloudflare Workers 사용 권장

### CORS 이슈
- `functions/_middleware.ts`에서 CORS 헤더 설정

### D1 연결 실패
- `wrangler.toml`의 `database_id`가 올바른지 확인
- Cloudflare Pages 바인딩 설정 확인
