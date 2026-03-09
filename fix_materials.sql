CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    price_per_gram REAL NOT NULL,
    density REAL NOT NULL,
    colors TEXT, 
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS print_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO print_settings (key, value, description) VALUES 
('fdm_hourly_rate', '5000', 'FDM 시간당 비용 (원)'),
('sla_hourly_rate', '8000', 'SLA 시간당 비용 (원)'),
('min_order_price', '10000', '최소 주문 금액 (원)');
