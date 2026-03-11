-- Phase 2: 견적서 발송 일시 (목록/상세에서 견적 발송 여부 표시)
-- orders.quotation_sent_at: NULL = 미발송, 값 있음 = 견적서 발송 일시
-- 원격에 이미 quotation_sent_at이 있으면 "duplicate column"으로 실패함.
-- 그 경우: D1 Console에서 INSERT INTO d1_migrations (name) VALUES ('schema_orders_quotation_sent.sql'); 실행 후
-- 터미널에서 다시: npx wrangler d1 migrations apply wow3d-production --remote
ALTER TABLE orders ADD COLUMN quotation_sent_at DATETIME NULL;
