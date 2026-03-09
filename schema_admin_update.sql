-- Admin & Settings Schema Update

-- 1. Add role to users table (if not exists checks are hard in sqlite alter, handling carefully)
-- SQLite doesn't support IF NOT EXISTS in ALTER TABLE. 
-- We assume it doesn't exist or we catch the error in app logic, but for D1 execute we just try it.
-- However, running this multiple times will fail.
-- Better to use a separate migration strategy, but for now:
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';

-- 2. Materials Table
CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'FDM', 'SLA', 'DLP'
  price_per_gram REAL NOT NULL,
  density REAL DEFAULT 1.24,
  colors TEXT DEFAULT '["#FFFFFF"]', -- JSON array
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Global Print Settings
CREATE TABLE IF NOT EXISTS print_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL, -- Stored as string, cast in app
  category TEXT DEFAULT 'general',
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Data
INSERT INTO print_settings (key, value, category, description) VALUES 
('fdm_hourly_rate', '5000', 'pricing', 'FDM Hourly Machine Rate (KRW)'),
('sla_hourly_rate', '8000', 'pricing', 'SLA Hourly Machine Rate (KRW)'),
('min_order_amount', '10000', 'pricing', 'Minimum Order Amount (KRW)'),
('shipping_fee', '3000', 'shipping', 'Standard Shipping Fee (KRW)');

INSERT INTO materials (name, type, price_per_gram, density, colors) VALUES 
('PLA', 'FDM', 200, 1.24, '["#FFFFFF", "#000000", "#FF0000", "#0000FF"]'),
('ABS', 'FDM', 250, 1.04, '["#FFFFFF", "#000000", "#Gray"]'),
('Standard Resin', 'SLA', 500, 1.15, '["#Transparency", "#Gray", "#White"]');
