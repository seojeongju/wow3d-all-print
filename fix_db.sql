-- Add missing admin-related tables
CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    price_per_gram REAL NOT NULL,
    density REAL NOT NULL,
    colors TEXT, -- JSON array string
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS print_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initialize default print settings if not exist
INSERT OR IGNORE INTO print_settings (key, value, description) VALUES 
('fdm_hourly_rate', '5000', 'FDM 시간당 비용 (원)'),
('sla_hourly_rate', '8000', 'SLA 시간당 비용 (원)'),
('min_order_price', '10000', '최소 주문 금액 (원)'),
('operating_rate', '82', '가동률 (%)'),
('operating_detail', '프린터 12/15대 가동중', '가동 상세');

-- Attempt to add role column to users (will fail if exists, but that's okay for manual run or we can ignore error)
-- SQLite doesn't support IF NOT EXISTS for column. 
-- We will try to create a temp table and migrate if needed, OR just run ALTER and expect error if exists.
-- For safety, we will assume it might be missing.
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
