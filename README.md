# Wow3D - 3D 프린팅 자동 견적 플랫폼

## 프로젝트 개요
3D 모델 파일(STL, OBJ)을 업로드하면 실시간으로 FDM, SLA, DLP 방식별 견적을 자동 산출하는 웹 기반 플랫폼

## 기술 스택
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **UI Components**: Shadcn/UI
- **3D Rendering**: Three.js (React Three Fiber)
- **State Management**: Zustand (with persist)
- **Hosting**: Cloudflare Pages
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (3D 파일 저장용)
- **Runtime**: Edge Runtime (Cloudflare Workers)

## 현재 구현 완료 상태 (2026-01-23)

### ✅ Phase 1: 핵심 기능 (MVP) - 완료
- [x] 프로젝트 세팅 (Next.js + Tailwind + Three.js)
- [x] STL/OBJ 파일 업로드 (Drag & Drop)
- [x] 3D 뷰어 구현 (회전, 줌, 자동 센터링)
- [x] 기하학적 분석 (부피, 표면적, 치수 자동 계산)
- [x] FDM 견적 로직
  - 재료 선택 (PLA, ABS, PETG, TPU)
  - Infill 조절 (10-100%)
  - Layer Height 선택 (0.1, 0.2, 0.3mm)
  - Support 구조 옵션
- [x] SLA/DLP 견적 로직
  - 레진 타입 (Standard, Tough, Clear, Flexible)
  - Layer Thickness (0.025, 0.05, 0.1mm)
  - 후가공 옵션 (세척/경화)
- [x] 실시간 가격 계산 및 예상 시간 표시
- [x] 한국어 랜딩페이지 (BN Makers 스타일)
  - Hero 섹션
  - 서비스 소개 섹션
  - 주요 기능 섹션
  - CTA 및 Footer
- [x] 페이지 구조 분리
  - `/` - 한국어 랜딩페이지
  - `/quote` - 실시간 견적 시스템

### ✅ Phase 2: 장바구니, 회원, 주문 관리 - 완료 (80%)

#### 백엔드 시스템 (100% 완료)
- [x] Cloudflare D1 데이터베이스 스키마 설계
  - users, quotes, cart, orders, order_items, shipments
- [x] 15개 API 엔드포인트 구현 (Edge Runtime)
  - 견적 관리: POST, GET, DELETE
  - 장바구니: POST, GET, PATCH, DELETE
  - 인증: 회원가입, 로그인, 현재 사용자 조회
  - 주문: 생성, 목록 조회, 상세 조회
- [x] 비회원 세션 ID 지원
- [x] JWT 토큰 인증 시스템
- [x] API 유틸리티 함수 (해싱, 토큰 생성/검증 등)

#### 상태 관리 (100% 완료)
- [x] Zustand 스토어 구현
  - useAuthStore (인증 상태)
  - useCartStore (장바구니)
  - useQuoteStore (견적)
  - useFileStore (파일 업로드)
- [x] LocalStorage persist 적용

#### UI 페이지 (80% 완료)
- [x] 견적 저장 기능 (QuotePanel)
- [x] 장바구니 추가 기능
- [x] 장바구니 페이지 (`/cart`)
- [x] 로그인/회원가입 페이지 (`/auth`)
- [x] 마이페이지 (`/my-account`)
- [x] 공통 헤더 (장바구니 아이콘, 로그인 상태)
- [x] Toast 알림 시스템
- [ ] 주문하기 페이지 (`/checkout`) - 대기
- [ ] 주문 완료 페이지 - 대기

## 프로젝트 구조
```
wow3d_all_print/
├── app/
│   ├── layout.tsx          # 루트 레이아웃 (Toaster 포함)
│   ├── page.tsx            # 메인 랜딩페이지
│   ├── quote/
│   │   └── page.tsx        # 견적 시스템
│   ├── cart/
│   │   └── page.tsx        # 장바구니
│   ├── auth/
│   │   └── page.tsx        # 로그인/회원가입
│   ├── my-account/
│   │   └── page.tsx        # 마이페이지
│   └── api/                # API Routes (Edge Runtime)
│       ├── quotes/
│       ├── cart/
│       ├── auth/
│       └── orders/
├── components/
│   ├── layout/
│   │   └── Header.tsx      # 공통 헤더
│   ├── canvas/
│   │   └── Scene.tsx       # 3D 뷰어
│   ├── quote/
│   │   └── QuotePanel.tsx  # 견적 패널
│   ├── upload/
│   │   └── FileUpload.tsx  # 파일 업로드
│   └── ui/                 # Shadcn UI 컴포넌트
├── lib/
│   ├── geometry.ts         # 지오메트리 분석
│   ├── api-utils.ts        # API 헬퍼 함수
│   ├── types.ts            # TypeScript 타입
│   └── utils.ts            # 유틸리티
├── store/                  # Zustand 상태 관리
│   ├── useAuthStore.ts
│   ├── useCartStore.ts
│   ├── useQuoteStore.ts
│   └── useFileStore.ts
├── hooks/
│   └── use-toast.ts        # Toast 알림 hook
├── functions/
│   └── _middleware.ts      # Cloudflare Pages Functions
├── schema.sql              # D1 데이터베이스 스키마
├── wrangler.toml           # Cloudflare 설정
└── env.d.ts                # Cloudflare 타입 정의
```

## 로컬 개발 환경 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 열기
# http://localhost:3000 - 랜딩페이지
# http://localhost:3000/quote - 견적 시스템
# http://localhost:3000/cart - 장바구니
# http://localhost:3000/auth - 로그인/회원가입
```

## Cloudflare 배포

상세한 배포 가이드는 [`docs/CLOUDFLARE_SETUP.md`](./docs/CLOUDFLARE_SETUP.md)를 참고하세요.

### 1. Cloudflare 로그인
```bash
npx wrangler login
```

### 2. D1 데이터베이스 생성
```bash
npx wrangler d1 create wow3d-production
# 출력된 database_id를 wrangler.toml에 복사
```

### 3. 스키마 적용
```bash
npx wrangler d1 execute wow3d-production --file=./schema.sql
```

### 4. R2 버킷 생성
```bash
npx wrangler r2 bucket create wow3d-files
```

### 5. Cloudflare Pages 배포
1. Cloudflare Dashboard → Pages
2. GitHub 레포지토리 연동
3. 빌드 설정:
   - Framework: Next.js
   - Build command: `npm run pages:build`
   - Output: `.vercel/output/static`
4. Bindings 설정:
   - D1: `DB` → `wow3d-production`
   - R2: `BUCKET` → `wow3d-files`

## 주요 기능

### 1. 실시간 견적 산출
- 3D 모델 파일 업로드 (STL, OBJ)
- 자동 지오메트리 분석 (부피, 표면적, 치수)
- FDM/SLA/DLP 방식별 견적 비교
- 실시간 가격 및 소요 시간 계산

### 2. 장바구니 시스템
- 비회원도 세션 ID로 이용 가능
- 수량 조절, 항목 삭제
- 실시간 총액 계산
- 주문 요약

### 3. 회원 시스템
- 이메일/비밀번호 회원가입
- JWT 토큰 기반 인증
- 마이페이지 (견적 내역, 주문 내역)
- 로그아웃 기능

### 4. 주문 관리
- 견적 기반 주문 생성
- 주문 상태 추적
- 배송 정보 관리

## 다음 단계 (Phase 2 완성)

- [ ] 주문하기 페이지 구현
- [ ] 결제 모듈 연동 준비
- [ ] 이메일 알림 시스템

## Phase 3 계획 (관리자 기능)

- [ ] 관리자 대시보드
- [ ] 주문 관리 (상태 변경, 메모)
- [ ] 단가 설정 UI
- [ ] 통계 및 분석
- [ ] 결제 모듈 완전 연동

## 참고 문서
- [PRD (제품 요구사항 문서)](./docs/PRD.md)
- [Cloudflare 배포 가이드](./docs/CLOUDFLARE_SETUP.md)
- [Phase 2 진행 현황](./docs/PHASE2_PROGRESS.md)

## 라이선스
© 2026 Wow3D. All rights reserved.
