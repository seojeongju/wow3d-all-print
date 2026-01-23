# Wow3D - 3D 프린팅 자동 견적 플랫폼

## 프로젝트 개요
3D 모델 파일(STL, OBJ)을 업로드하면 실시간으로 FDM, SLA, DLP 방식별 견적을 자동 산출하는 웹 기반 플랫폼

## 기술 스택
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **UI Components**: Shadcn/UI
- **3D Rendering**: Three.js (React Three Fiber)
- **State Management**: Zustand
- **Hosting**: Cloudflare Pages
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (3D 파일 저장용)

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

## 프로젝트 구조
```
wow3d_all_print/
├── app/
│   ├── layout.tsx          # 루트 레이아웃 (다크모드)
│   ├── page.tsx            # 메인 랜딩페이지 (한국어)
│   └── quote/
│       └── page.tsx        # 견적 시스템 페이지
├── components/
│   ├── canvas/
│   │   └── Scene.tsx       # 3D 뷰어 (Three.js)
│   ├── quote/
│   │   └── QuotePanel.tsx  # 견적 패널 (FDM/SLA/DLP)
│   ├── upload/
│   │   └── FileUpload.tsx  # 파일 업로드 컴포넌트
│   └── ui/                 # Shadcn UI 컴포넌트
├── lib/
│   ├── geometry.ts         # 지오메트리 분석 로직
│   └── utils.ts           # 유틸리티 함수
├── store/
│   └── useFileStore.ts     # 파일 상태 관리 (Zustand)
└── docs/
    └── PRD.md             # 제품 요구사항 문서
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
```

## 견적 산출 로직

### FDM (Fused Deposition Modeling)
```
총 비용 = 재료비 + 서포트비 + 시간비 + 인건비

재료비 = 부피(cm³) × 조정밀도 × 재료단가
조정밀도 = max(밀도 × 0.2, 밀도 × Infill%)
시간비 = 예상시간(h) × 장비단가(/h)
서포트비 = (활성화시) 표면적 × 0.02
```

### SLA/DLP (Stereolithography / Digital Light Processing)
```
총 비용 = 레진비 + 소모품비 + 후가공비 + 시간비 + 인건비

레진비 = 부피(mL) × 레진단가
시간비 = (레이어수 × 레이어당노출시간 / 3600) × 장비단가
후가공비 = (활성화시) 8.0
```

## 다음 단계 (Phase 2)

### 우선순위 높음
- [ ] 장바구니 시스템
  - [ ] Cloudflare D1 DB 스키마 설계
  - [ ] 견적 저장 및 불러오기
  - [ ] 장바구니 UI 구현
- [ ] 회원가입/로그인
  - [ ] Cloudflare D1 Users 테이블
  - [ ] 세션 관리
  - [ ] 마이페이지
- [ ] 주문 관리 대시보드
  - [ ] 주문 내역 조회
  - [ ] 배송 상태 추적

### 우선순위 중간
- [ ] 모델 검증 기능
  - [ ] 터진 면(Non-manifold) 감지
  - [ ] 뒤집힌 면 검사
  - [ ] 경고 메시지 표시
- [ ] 견적서 PDF 출력
- [ ] 파일 용량 최적화 (R2 업로드)

### 우선순위 낮음 (Phase 3)
- [ ] STEP/IGES 파일 지원
- [ ] 관리자 페이지
  - [ ] 주문 관리
  - [ ] 단가 설정
  - [ ] 통계 대시보드
- [ ] 결제 모듈 연동 (PG사)

## 주요 파일 설명

### `lib/geometry.ts`
- `analyzeGeometry()`: STL/OBJ 파일의 부피, 표면적, 바운딩 박스를 계산
- `signedVolumeOfTriangle()`: 삼각형 기반 부피 계산
- `triangleArea()`: 삼각형 면적 계산

### `components/quote/QuotePanel.tsx`
- 출력 방식 선택 (FDM/SLA/DLP)
- 방식별 옵션 UI 동적 렌더링
- 실시간 가격 계산 및 표시

### `store/useFileStore.ts`
- 업로드된 파일 관리
- 분석 결과 저장
- 파일 초기화 로직

## 테스트 방법

1. **파일 업로드 테스트**
   - `test_cube.stl` 파일이 프로젝트 루트에 있음 (20x20x20mm 큐브)
   - 예상 부피: ~8 cm³

2. **견적 비교 테스트**
   - FDM (PLA, 20% Infill, 0.2mm): ~$7.50
   - SLA (Standard, 0.05mm): ~$11.58
   - DLP (Standard, 0.05mm): ~$10.69

## 참고 문서
- [PRD (제품 요구사항 문서)](./docs/PRD.md)
- [BN Makers 참고 사이트](https://www.bnmakers.com/)

## 라이선스
© 2026 Wow3D. All rights reserved.
