-- 수정견적 저장/표시용 컬럼 (견적 관리 목록에서 수정견적 금액 표시)
-- 원격에 이미 has_expert_quote 등이 있으면 "duplicate column"으로 실패함.
-- 그 경우: D1 Console에서 INSERT INTO d1_migrations (name) VALUES ('schema_orders_expert_quote.sql'); 실행 후
-- 터미널에서 다시: npx wrangler d1 migrations apply wow3d-production --remote

ALTER TABLE orders ADD COLUMN has_expert_quote INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN expert_quote_data TEXT NULL;
