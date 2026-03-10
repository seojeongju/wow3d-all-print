# 마이그레이션

## 수정견적 금액이 견적 관리 목록에 안 나올 때

`/admin/quotes` 목록에서 **수정견적 금액**이 항상 "-"로만 보이면, `orders` 테이블에 수정견적용 컬럼이 없는 경우입니다. 아래를 **한 번만** 실행하세요.

```bash
npx wrangler d1 execute wow3d-production --remote --file=./migrations/schema_orders_expert_quote.sql
```

이미 컬럼이 있으면 `duplicate column name` 에러가 나며, 그때는 실행하지 않아도 됩니다.
