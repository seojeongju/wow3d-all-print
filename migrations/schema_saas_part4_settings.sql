-- Print Settings 테이블 마이그레이션 (재시도)

-- print_settings 테이블이 없을 수 있으므로 있으면 생성 (구 스키마)
CREATE TABLE IF NOT EXISTS print_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS print_settings_new (
    key TEXT NOT NULL,
    value TEXT,
    description TEXT,
    store_id INTEGER DEFAULT 1 REFERENCES stores(id),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (store_id, key)
);

INSERT INTO print_settings_new (key, value, description, store_id, updated_at)
SELECT key, value, description, 1, updated_at FROM print_settings;

DROP TABLE print_settings;
ALTER TABLE print_settings_new RENAME TO print_settings;

CREATE INDEX IF NOT EXISTS idx_print_settings_store_id ON print_settings(store_id);
