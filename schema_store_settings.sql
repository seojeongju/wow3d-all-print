-- store_settings 테이블 (상점 기본 설정 저장)
-- 실행: npx wrangler d1 execute wow3d-production --local --file=./schema_store_settings.sql
-- 운영: npx wrangler d1 execute wow3d-production --remote --file=./schema_store_settings.sql

CREATE TABLE IF NOT EXISTS store_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO store_settings (setting_key, setting_value, description)
VALUES 
  ('shipping_base_fee', '3000', '기본 배송비 (원)'),
  ('shipping_free_threshold', '50000', '무료 배송 기준 금액 (원)');
