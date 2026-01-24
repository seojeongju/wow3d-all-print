# Cloudflare 배포 가이드

이 프로젝트는 **OpenNext for Cloudflare Workers**를 사용합니다.  
(이전: `@cloudflare/next-on-pages` + Cloudflare Pages → 현재: `@opennextjs/cloudflare` + **Workers**)

---

## 0. 현재 배포 구조 (OpenNext / Workers)

- **빌드**: `npx opennextjs-cloudflare build` → `.open-next/worker.js` + `.open-next/assets`
- **로컬 프리뷰**: `npm run preview` (Wrangler 로컬, D1/R2 시뮬레이션)
- **배포**: `npm run deploy` → `opennextjs-cloudflare build` 후 `opennextjs-cloudflare deploy` (Cloudflare **Workers**)

`wrangler.toml`에 `main = ".open-next/worker.js"`, `[assets]`, D1, R2, `[[services]]`(WORKER_SELF_REFERENCE)가 설정되어 있습니다.  
**Pages Git 연동이 아닌 Workers 배포**이므로, CI에서 `npm run deploy` 또는 `opennextjs-cloudflare deploy`를 사용합니다.

---

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

## 6. (참고) 이전 방식: Cloudflare Pages + next-on-pages

현재는 **Workers + OpenNext**를 사용하므로 아래는 참고용입니다.

- **Build command**: `npm run pages:build` (구 `@cloudflare/next-on-pages`)
- **Build output**: `.vercel/output/static`
- Pages Git 연동 시 `compatibility_flags`(예: `nodejs_compat`)를 대시보드 **Functions**에서 수동 설정해야 하는 경우가 많음.

## 7. 환경 변수 / Bindings

`wrangler.toml`의 `[vars]`와 바인딩으로 설정됩니다:

- **Vars**: `ENVIRONMENT` = `production`
- **D1**: `DB` → `wow3d-production`
- **R2**: `BUCKET` → `wow3d-files`

로컬 프리뷰 시 `.dev.vars`에 `NEXTJS_ENV=development` 등 추가 가능.

## 8. 로컬 개발

```bash
# Next.js 개발 서버 (DB 바인딩 없음)
npm run dev

# OpenNext 로컬 프리뷰 (D1/R2 시뮬레이션, Wrangler)
npm run preview
```

## 9. 배포

```bash
# OpenNext 빌드 후 Workers에 배포
npm run deploy
```

CI에서 사용할 경우: `npm run deploy` 또는 `opennextjs-cloudflare build` 후 `opennextjs-cloudflare deploy`.

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

# Workers 로그 확인
npx wrangler tail
```

## 트러블슈팅

### Node.JS Compatibility / 500 Internal Server Error (`nodejs_compat` 없음)

**증상** (하나라도 해당 시 의심):
- "Node.JS Compatibility Error" / "no nodejs_compat compatibility flag set" 문구
- **500 Internal Server Error** (특히 `/api/*`, 로그인, 메인 접속 시)
- 브라우저 콘솔·네트워크에서 `process is not defined`·`Buffer is not defined` 유사 에러

**원인**: `@cloudflare/next-on-pages`로 빌드된 Next.js 앱과 API 라우트(`process.env` 사용)가 Node.js API를 사용하는데, Cloudflare Pages에 `nodejs_compat` 플래그가 없으면 `process` 등이 없어 500이 발생합니다.  
Git 연동 시 `wrangler.toml`의 `compatibility_flags`가 **반영되지 않는 경우가 많으므로**, 대시보드에서 수동 설정이 필수입니다.

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
- OpenNext/Workers에서는 `functions/` 미사용. 필요 시 `next.config`의 `headers` 또는 API 라우트에서 CORS 헤더 처리.

### D1 연결 실패
- `wrangler.toml`의 `database_id`가 올바른지 확인
- Cloudflare Pages 바인딩 설정 확인
