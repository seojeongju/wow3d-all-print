# 다음 세션 작업 이어가기

> 마지막 업데이트: 커밋/푸시/배포 후 작성

---

## 1. 방금 마무리한 작업

- **wow3dp.co.kr 도메인 연결**
  - `wrangler.toml`에 Custom Domain 추가: `wow3dp.co.kr`, `www.wow3dp.co.kr`
  - `docs/DOMAIN_SETUP.md`에 Cloudflare·가비아 설정 가이드 정리
- **커밋·푸시·배포** 완료 (master → origin)

---

## 2. 현재 상태: wow3dp.co.kr

- **Cloudflare** 도메인 목록에 wow3dp.co.kr 추가됨
- **상태: "Invalid nameservers"** → 가비아 네임서버가 아직 Cloudflare로 바뀌지 않음
- **다음에 할 일**
  1. Cloudflare에서 wow3dp.co.kr Zone 클릭 → **네임서버 2개** 확인 (예: xxx.ns.cloudflare.com, yyy.ns.cloudflare.com)
  2. **가비아** → 도메인 관리 → wow3dp.co.kr → **네임서버 설정** → 1차/2차를 위 2개로 변경 후 저장
  3. 전파 후(수 분~24시간) Cloudflare에서 **Active** 확인
  4. 그 후 배포된 Worker가 https://wow3dp.co.kr 로 서비스됨 (wrangler.toml 반영 완료)

---

## 3. 참고 문서

| 문서 | 용도 |
|------|------|
| `docs/DOMAIN_SETUP.md` | wow3dp.co.kr Cloudflare·가비아 설정 절차 |
| `docs/ORDER_QUOTE_WORKFLOW_PROPOSAL.md` | 주문 견적 검토/발송 제안 및 Phase 1~3 요약 |

---

## 4. 배포

- **main/master** 푸시 시 GitHub Actions로 Cloudflare Workers 자동 배포
- Worker 이름: `wow3d-all-print`
- 네임서버가 Active가 되면 Custom Domain(wow3dp.co.kr, www.wow3dp.co.kr)으로 접속 가능

---

## 5. 이어서 할 수 있는 작업 (선택)

- wow3dp.co.kr Active 확인 후 접속 테스트
- 프로덕션용 `NEXT_PUBLIC_APP_URL` = `https://wow3dp.co.kr` Cloudflare Worker 변수 설정
- DNS에서 기존 A 레코드(115.68.229.23) 정리 여부 검토 (Worker로만 서비스할 경우)
