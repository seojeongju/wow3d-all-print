-- materials 테이블이 없을 수 있으므로 있으면 생성 (schema_materials.sql 기준)
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

ALTER TABLE materials ADD COLUMN sort_order INTEGER DEFAULT 0;
