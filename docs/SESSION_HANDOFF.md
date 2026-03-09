# 세션 마무리 / 다음 작업용 요약

> 이 파일은 다음 세션에서 이어서 작업할 때 참고하기 위한 요약입니다. 작업이 끝나면 삭제하거나 갱신해 두세요.

**최종 업데이트**: 2025년 3월 기준

---

## 1. 프로젝트 개요

- **사이트**: https://wow3dp.co.kr (Cloudflare Workers 배포)
- **스택**: Next.js 15, OpenNext for Cloudflare, D1, R2
- **배포**: `npm run deploy` (로컬), GitHub push 후 수동 배포
- **Worker**: wow3d-all-print | workers.dev: https://wow3d-all-print.jayseo36.workers.dev

---

## 2. 최근 세션에서 진행한 작업

| 구분 | 내용 |
|------|------|
| **SEO** | 3D프린팅출력/자동견적/3D프린터출력/출력서비스 키워드 반영 (layout, quote layout, Hero, JSON-LD, docs/SEO_KEYWORDS.md) |
| **장바구니** | 저장 목록 옆 **주문조회** 탭 추가 (로그인 시 주문 목록, 상세보기→내계정) |
| **내 계정** | 진행중주문/총주문완료/총결제금액 실제 데이터 + 원화(KRW_RATE 1300) 표시 |
| **관리자** | GET /api/admin/orders 500 해결: store_id·has_expert_quote 등 없을 때 폴백 쿼리, requireAdminAuth에서 users.store_id 없을 때 role만 조회 |
| **주문 상세 API** | store_id 없을 때 id만으로 조회하는 폴백 추가 |
| **견적 관리** | 테이블에 **현재 상태**(접수대기/주문확인/제작중/배송중/완료/취소) 열 추가 |
| **주문 관리** | 연락란 회원/비회원 구분: API에 **user_id**, **guest_email** 포함해 연락 정상 표시 |
| **문서** | DOMAIN_SETUP.md에 연결 끊김(ERR_CONNECTION_TIMED_OUT) 원인·대응(7번 섹션) 추가 |

---

## 3. 현재 상태

- **브랜치**: master (origin/main과 동기화 여부는 `git status`로 확인)
- **배포**: 마지막 배포까지 반영된 상태
- **DB**: D1 wow3d-production. 일부 마이그레이션(store_id, quotation_sent_at, has_expert_quote 등)이 안 된 환경에서는 API 폴백으로 동작

---

## 4. 다음에 할 수 있는 작업 (참고)

- **연결 안정화**: Cloudflare Cron Trigger로 Keep-Warm 설정(1~5분 주기), 또는 Workers 유료 플랜 검토
- **DB 마이그레이션**: orders에 store_id, quotation_sent_at, has_expert_quote, expert_quote_data 등 추가 시 주문/견적 관리 전체 기능 정상화
- **기타**: wrangler 4 업데이트, 테스트/모니터링 강화 등

---

## 5. 자주 쓰는 명령

```bash
# 상태 확인
git status

# 배포 (wrangler 로그인 후)
npm run deploy

# 푸시
git push origin master
```

---

이어서 작업할 때는 이 파일과 `docs/DOMAIN_SETUP.md`, `docs/SEO_KEYWORDS.md` 등을 참고하면 됩니다.
