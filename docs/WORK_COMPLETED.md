# 작업 완료 내역 (Work Completed)

## 2026-01-27: SaaS 플랫폼 전환 (Phase 1~3 완료)

### 1. Multi-Tenancy DB 아키텍처 구축
- **Stores 테이블 생성**: 개별 입점 업체(Tenant) 관리를 위한 `stores` 테이블 생성 (ID, 이름, 슬러그, 소유자 등).
- **기본 스토어 연결**: 기존 운영 데이터(주문, 유저 등)를 'Wow3D 본점(ID:1)'으로 마이그레이션.
- **FK 추가**: `users`, `orders`, `inquiries` 등 주요 테이블에 `store_id` 컬럼 추가 및 인덱싱.
- **마이그레이션 스크립트**: `migrations/schema_saas_*.sql` 작성 및 Remote DB 적용 완료.

### 2. 플랫폼 관리자 시스템 (Super Admin)
- **인증 시스템 고도화**: 로그인 (`/api/auth/login`) 시 사용자의 `store_id`를 반환하도록 수정하고, Zustand Store에 저장.
- **슈퍼 어드민 메뉴**: 관리자 사이드바에 본사 관리자(Store #1) 전용 **[플랫폼 관리]** 섹션 추가.
- **스토어 관리 페이지**: `/admin/platform/stores` 구현.
  - 전체 입점 업체 목록 조회.
  - 신규 스토어 생성 및 관리자 계정 연결 기능 (Modal UI).

### 3. 데이터 격리 (Data Isolation) - 보안 핵심
- **보안 헬퍼 함수 (`requireAdminAuth`)**: API 요청 시 토큰을 검증하고 DB에서 강제로 `store_id`를 조회하여 반환하는 로직 구현.
- **주문 API 격리**:
  - `GET /api/admin/orders`: 본인 스토어의 주문만 조회 (`WHERE store_id = ?`).
  - `GET /api/admin/orders/[id]`: 타 스토어 주문 상세 조회 차단.
  - `PATCH /api/admin/orders/[id]`: 타 스토어 주문 상태 수정 차단.
- **문의 API 격리**: `GET /api/admin/inquiries`에 격리 로직 적용.

### 4. 기타
- **견적서 관리**: 관리자용 견적 생성/수정/인쇄 기능 구현 완료.
- **코드 정리**: `lib/types.ts` 업데이트 (Store ID, Role 확장).

---
## 이전 작업 내역

### 2026-01-27: 비즈니스 페이지 및 3D 뷰어 개선
- `/business` 페이지 섹션 추가 및 디자인 개선.
- 랜딩 페이지 3D 뷰어 기능 고도화 (STL/OBJ 로딩, 측정 도구 등).

(이하 생략)
