-- FDM/SLA/DLP 타입별 기본금액(최소 견적). 자동견적이 이 금액 미만이면 기본금액으로 책정
-- 기존 printer_equipment 테이블에 컬럼 추가.
-- 원격에 이미 min_price_krw가 있으면 "duplicate column"으로 실패함.
-- 그 경우: Cloudflare 대시보드 D1 > wow3d-production > Console에서
--   INSERT INTO d1_migrations (name) VALUES ('schema_equipment_min_price.sql');
-- 실행 후 터미널에서 다시: npx wrangler d1 migrations apply wow3d-production --remote
ALTER TABLE printer_equipment ADD COLUMN min_price_krw INTEGER DEFAULT NULL;
