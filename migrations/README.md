# 마이그레이션

## Meshy AI 이미지→3D (사진 견적)

```bash
npx wrangler d1 execute wow3d-production --remote --file=./migrations/schema_meshy_jobs.sql
npx wrangler secret put MESHY_API_KEY
```

설정 상세: `docs/MESHY_SETUP.md`

## 수정견적 금액이 견적 관리 목록에 안 나오거나 저장이 안 될 때

`/admin/quotes`에서 **수정견적 금액**이 항상 "-"이거나, 견적서 수정 후 "수정견적 저장"을 눌러도 반영되지 않으면 `orders` 테이블에 수정견적용 컬럼이 없는 경우입니다. 아래를 **한 번만** 실행하세요.

```bash
npx wrangler d1 execute wow3d-production --remote --file=./migrations/schema_orders_expert_quote.sql
```

- 이미 컬럼이 있으면 `duplicate column name` 에러가 나며, 그때는 실행하지 않아도 됩니다.
- 실행 후에는 수정견적 저장이 정상 동작하고, 견적 관리 목록에 수정견적 금액이 표시됩니다.
