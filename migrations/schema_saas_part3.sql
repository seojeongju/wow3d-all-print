-- 나머지 테이블 마이그레이션

-- users 테이블이 없을 수 있으므로 있으면 생성 (schema.sql 기준)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Users
ALTER TABLE users ADD COLUMN store_id INTEGER DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);


