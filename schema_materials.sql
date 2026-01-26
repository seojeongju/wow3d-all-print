-- materials 테이블 (소재 추가/수정에 필요)
-- 실행: npx wrangler d1 execute wow3d-production --remote --file=./schema_materials.sql

CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  price_per_gram REAL NOT NULL,
  density REAL DEFAULT 1.24,
  colors TEXT DEFAULT '["#FFFFFF"]',
  is_active INTEGER DEFAULT 1,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
