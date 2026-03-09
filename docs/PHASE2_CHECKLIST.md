# 🚀 Phase 2 작업 체크리스트

## 준비사항
개발을 재개하기 전에 확인할 사항:
- [x] README.md 검토
- [ ] PRD.md 재확인
- [ ] 개발 서버 실행: `npm run dev`
- [ ] http://localhost:3000 접속 확인
- [ ] http://localhost:3000/quote 견적 시스템 정상 작동 확인

---

## 📦 Phase 2.1: 장바구니 시스템 (예상 소요: 4-6시간)

### DB 스키마 설계
- [ ] Cloudflare D1 Database 생성
- [ ] `quotes` 테이블 설계
  ```sql
  CREATE TABLE quotes (
    id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    volume REAL,
    surface_area REAL,
    print_method TEXT, -- 'fdm', 'sla', 'dlp'
    material TEXT,
    options TEXT, -- JSON
    total_price REAL,
    estimated_time REAL,
    created_at INTEGER
  );
  ```
- [ ] `cart_items` 테이블 설계

### 백엔드 API
- [ ] `/api/quotes/save` - POST: 견적 저장
- [ ] `/api/quotes/list` - GET: 견적 목록 조회
- [ ] `/api/cart/add` - POST: 장바구니 추가
- [ ] `/api/cart/remove` - DELETE: 장바구니 아이템 삭제

### 프론트엔드
- [ ] `store/useCartStore.ts` 생성 (Zustand)
- [ ] QuotePanel에 "장바구니에 담기" 버튼 활성화
- [ ] 장바구니 페이지 `/cart` 생성
- [ ] 헤더에 장바구니 아이콘 및 개수 배지 추가

### 테스트
- [ ] 견적 저장 기능 테스트
- [ ] 장바구니 추가/삭제 테스트
- [ ] 페이지 새로고침 후 데이터 유지 확인

---

## 👤 Phase 2.2: 회원가입/로그인 (예상 소요: 6-8시간)

### DB 스키마
- [ ] `users` 테이블 설계
  ```sql
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    created_at INTEGER
  );
  ```
- [ ] `sessions` 테이블 설계

### 백엔드 API
- [ ] `/api/auth/signup` - POST: 회원가입
- [ ] `/api/auth/login` - POST: 로그인
- [ ] `/api/auth/logout` - POST: 로그아웃
- [ ] `/api/auth/me` - GET: 현재 사용자 정보

### 프론트엔드
- [ ] `/signup` 페이지 생성
- [ ] `/login` 페이지 생성
- [ ] 로그인 상태 관리 (Zustand or Context)
- [ ] 헤더 UI 업데이트 (로그인/로그아웃 버튼)
- [ ] Protected Routes 설정

### 보안
- [ ] 비밀번호 해싱 (bcrypt)
- [ ] JWT 토큰 발급
- [ ] CORS 설정

---

## 📊 Phase 2.3: 주문 관리 대시보드 (예상 소요: 4-6시간)

### DB 스키마
- [ ] `orders` 테이블 설계
  ```sql
  CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    quote_id TEXT,
    status TEXT, -- 'pending', 'processing', 'completed', 'cancelled'
    shipping_address TEXT,
    total_amount REAL,
    created_at INTEGER,
    updated_at INTEGER
  );
  ```

### 백엔드 API
- [ ] `/api/orders/create` - POST: 주문 생성
- [ ] `/api/orders/list` - GET: 주문 목록
- [ ] `/api/orders/:id` - GET: 주문 상세 조회
- [ ] `/api/orders/:id/status` - PATCH: 주문 상태 업데이트

### 프론트엔드
- [ ] `/dashboard` 페이지 생성
- [ ] 주문 목록 컴포넌트
- [ ] 주문 상세 모달
- [ ] 주문 상태 필터링 (진행중/완료/취소)

---

## 🔍 Phase 2.4: 모델 검증 기능 (예상 소요: 6-8시간)

### 분석 기능
- [ ] `lib/modelValidator.ts` 생성
- [ ] Non-manifold 감지 로직
- [ ] 뒤집힌 면(Inverted Normals) 검사
- [ ] 최소 두께 검사 (선택사항 - 고급)

### UI
- [ ] 검증 결과 표시 컴포넌트
- [ ] 경고/에러 메시지 UI
- [ ] 수정 가이드 안내

---

## 📄 Phase 2.5: 견적서 PDF 출력 (예상 소요: 3-4시간)

### 구현
- [ ] PDF 생성 라이브러리 설치 (jsPDF, react-pdf 등)
- [ ] 견적서 템플릿 디자인
- [ ] "견적서 다운로드" 버튼 추가
- [ ] 로고, 회사 정보, 견적 상세 내용 포함

---

## 🎨 추가 개선 사항 (선택)

### UX 향상
- [ ] 로딩 애니메이션 추가
- [ ] 에러 핸들링 개선
- [ ] Toast 알림 추가 (Sonner)
- [ ] 다크/라이트 모드 토글 (현재 다크모드 고정)

### 성능 최적화
- [ ] 3D 모델 로딩 최적화
- [ ] 이미지 최적화 (Next.js Image)
- [ ] 코드 스플리팅

### SEO
- [ ] 메타 태그 최적화
- [ ] OG 이미지 추가
- [ ] sitemap.xml 생성

---

## 📝 참고사항

### Cloudflare 설정 필요 항목
1. **D1 Database 생성**
   ```bash
   npx wrangler d1 create wow3d-db
   ```

2. **R2 Bucket 생성**
   ```bash
   npx wrangler r2 bucket create wow3d-files
   ```

3. **wrangler.toml 설정**
   ```toml
   name = "wow3d-quote"
   compatibility_date = "2024-01-01"
   
   [[d1_databases]]
   binding = "DB"
   database_name = "wow3d-db"
   database_id = "<YOUR_DB_ID>"
   
   [[r2_buckets]]
   binding = "FILES"
   bucket_name = "wow3d-files"
   ```

### 유용한 명령어
```bash
# 개발 서버
npm run dev

# 빌드
npm run build

# Cloudflare Pages 배포
npm run deploy

# DB 마이그레이션
npx wrangler d1 execute wow3d-db --file=./migrations/001_init.sql
```

---

## 🎯 마일스톤

- **Week 1**: Phase 2.1 (장바구니) + Phase 2.2 (회원가입)
- **Week 2**: Phase 2.3 (주문 관리) + Phase 2.4 (모델 검증)
- **Week 3**: Phase 2.5 (PDF) + 추가 개선사항
- **Week 4**: Phase 3 준비 (STEP/IGES 지원, 관리자 페이지)

---

## 📚 학습 자료

- [Cloudflare D1 문서](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 문서](https://developers.cloudflare.com/r2/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Zustand 상태관리](https://zustand-demo.pmnd.rs/)
- [Three.js 문서](https://threejs.org/docs/)
