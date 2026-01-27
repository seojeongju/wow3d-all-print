-- 나머지 테이블 마이그레이션

-- Pricing Presets
ALTER TABLE pricing_presets ADD COLUMN store_id INTEGER DEFAULT 1 REFERENCES stores(id);
CREATE INDEX IF NOT EXISTS idx_pricing_presets_store_id ON pricing_presets(store_id);

-- Users
ALTER TABLE users ADD COLUMN store_id INTEGER DEFAULT 1 REFERENCES stores(id);
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);

-- Inquiries
ALTER TABLE inquiries ADD COLUMN store_id INTEGER DEFAULT 1 REFERENCES stores(id);

-- Materials
ALTER TABLE materials ADD COLUMN store_id INTEGER DEFAULT 1 REFERENCES stores(id);
