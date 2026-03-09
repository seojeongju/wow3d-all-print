-- 나머지 테이블 마이그레이션

-- Users
ALTER TABLE users ADD COLUMN store_id INTEGER DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);


