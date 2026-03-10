-- 수정견적 저장/표시용 컬럼 (견적 관리 목록에서 수정견적 금액 표시)
-- 실행: npx wrangler d1 execute wow3d-production --remote --file=./migrations/schema_orders_expert_quote.sql
-- 이미 컬럼이 있으면 "duplicate column name" 에러가 나므로, 그때는 무시하면 됨.

ALTER TABLE orders ADD COLUMN has_expert_quote INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN expert_quote_data TEXT NULL;
