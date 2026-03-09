# Cloudflare 배포 가이드 - 단계별 상세 설명

## 🚀 배포 프로세스

### Part 1: 터미널 명령어로 하는 작업 (AI가 도움 가능)

#### Step 1: Wrangler 로그인
```bash
npx wrangler login
```
브라우저가 열리면 Cloudflare 계정으로 로그인하세요.

#### Step 2: D1 데이터베이스 생성
```bash
npx wrangler d1 create wow3d-production
```

**중요!** 출력된 내용 중 `database_id`를 복사하세요:
```
✅ Successfully created DB 'wow3d-production'

[[d1_databases]]
binding = "DB"
database_name = "wow3d-production"
database_id = "xxxx-xxxx-xxxx-xxxx"  ← 이 부분을 복사!
```

이 `database_id`를 `wrangler.toml` 파일의 `database_id = ""` 부분에 붙여넣으세요.

#### Step 3: 데이터베이스 스키마 적용
```bash
npx wrangler d1 execute wow3d-production --file=./schema.sql
```

#### Step 4: R2 버킷 생성 (3D 파일 저장용)
```bash
npx wrangler r2 bucket create wow3d-files
```

---

### Part 2: Cloudflare Dashboard에서 하는 작업 (웹 브라우저)

이 부분은 **사용자가 직접** Cloudflare 대시보드에서 설정해야 합니다.

#### Step 1: Cloudflare Pages 프로젝트 생성

1. **Cloudflare Dashboard 접속**
   - https://dash.cloudflare.com/ 로그인

2. **Workers & Pages 선택**
   - 왼쪽 메뉴에서 "Workers & Pages" 클릭

3. **Create application**
   - "Create application" 버튼 클릭
   - "Pages" 탭 선택
   - "Connect to Git" 클릭

4. **GitHub 연동**
   - GitHub 계정 연결 (처음이면 권한 승인 필요)
   - `seojeongju/wow3d-all-print` 레포지토리 선택
   - "Begin setup" 클릭

5. **빌드 설정**
   ```
   Project name: wow3d-all-print
   Production branch: main
   
   Build settings:
   - Framework preset: Next.js
   - Build command: npm run pages:build
   - Build output directory: .vercel/output/static
   ```

6. **환경 변수 설정 (선택사항)**
   - "Environment variables" 섹션 펼치기
   - 필요한 환경 변수 추가 (현재는 없음)

7. **"Save and Deploy"** 클릭
   - 첫 배포가 시작됩니다 (5-10분 소요)

#### Step 2: Bindings 설정 (매우 중요!)

배포가 완료되면:

1. **Settings 탭으로 이동**
   - 프로젝트 페이지에서 "Settings" 클릭

2. **Functions** 섹션 찾기
   - "Functions" > "Bindings" 선택

3. **D1 Database Binding 추가**
   - "Add binding" 클릭
   - Variable name: `DB`
   - D1 database: `wow3d-production` 선택
   - "Save" 클릭

4. **R2 Bucket Binding 추가**
   - "Add binding" 클릭
   - Variable name: `BUCKET`
   - R2 bucket: `wow3d-files` 선택
   - "Save" 클릭

5. **재배포**
   - "Deployments" 탭으로 이동
   - 최신 배포 옆 "···" 메뉴 클릭
   - "Retry deployment" 선택
   - Bindings이 적용되도록 재배포

---

### Part 3: 확인 및 테스트

1. **배포된 URL 확인**
   - 배포 완료 후 `https://wow3d-all-print.pages.dev` 같은 URL 제공됨

2. **기능 테스트**
   - 랜딩페이지 접속
   - 견적 시스템 테스트
   - 견적 저장 테스트 (DB 연결 확인)
   - 장바구니 추가 테스트

3. **커스텀 도메인 연결 (선택)**
   - Settings > Custom domains
   - 원하는 도메인 추가

---

## 🔍 트러블슈팅

### 문제 1: 빌드 실패
**원인**: 의존성 충돌
**해결**: package.json에서 `--legacy-peer-deps` 플래그 사용

빌드 명령어를 다음과 같이 수정:
```
npm install --legacy-peer-deps && npm run pages:build
```

### 문제 2: API 호출 실패 (DB 연결 안됨)
**원인**: Bindings 설정 안됨
**해결**: 
1. Settings > Functions > Bindings 확인
2. DB와 BUCKET이 올바르게 연결되었는지 확인
3. 재배포

### 문제 3: "Module not found" 에러
**원인**: Next.js와 Cloudflare Pages 호환성
**해결**: 
1. `next.config.ts`에 `images.unoptimized = true` 설정 확인
2. Edge Runtime 사용 확인 (`export const runtime = 'edge'`)

---

## 📝 체크리스트

### 터미널 작업 ✓
- [ ] `npx wrangler login` 완료
- [ ] D1 데이터베이스 생성
- [ ] `wrangler.toml`에 database_id 입력
- [ ] 스키마 적용 (`schema.sql`)
- [ ] R2 버킷 생성

### Cloudflare Dashboard 작업 ✓
- [ ] Pages 프로젝트 생성
- [ ] GitHub 레포지토리 연결
- [ ] 빌드 설정 완료
- [ ] D1 Binding 추가 (`DB`)
- [ ] R2 Binding 추가 (`BUCKET`)
- [ ] 재배포 완료

### 테스트 ✓
- [ ] 랜딩페이지 접속 확인
- [ ] 3D 파일 업로드 테스트
- [ ] 견적 저장 테스트 (DB)
- [ ] 장바구니 추가 테스트
- [ ] 로그인/회원가입 테스트

---

## 🆘 도움이 필요하면

1. **빌드 로그 확인**
   - Cloudflare Dashboard > Deployments > 실패한 배포 클릭
   - 로그에서 에러 메시지 확인

2. **Function Logs**
   - Real-time logs에서 API 에러 확인

3. **GitHub Issues**
   - Next.js + Cloudflare Pages 관련 이슈 검색

---

완료하면 전 세계에서 빠르게 접근 가능한 3D 프린팅 견적 플랫폼이 배포됩니다! 🚀
