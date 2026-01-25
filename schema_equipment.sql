-- 3D 프린터 장비별 설정 (FDM, SLA, DLP) - 최대 출력 사이즈 등
-- 실행: npx wrangler d1 execute wow3d-production --file=./schema_equipment.sql

CREATE TABLE IF NOT EXISTS printer_equipment (
  type TEXT PRIMARY KEY,
  name TEXT,
  max_x_mm REAL NOT NULL DEFAULT 220,
  max_y_mm REAL NOT NULL DEFAULT 220,
  max_z_mm REAL NOT NULL DEFAULT 250,
  hourly_rate REAL NOT NULL DEFAULT 5000,
  layer_heights_json TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 기본 시드: FDM, SLA, DLP
INSERT OR IGNORE INTO printer_equipment (type, name, max_x_mm, max_y_mm, max_z_mm, hourly_rate, layer_heights_json) VALUES
('FDM', '기본 FDM', 220, 220, 250, 5000, '[0.1,0.2,0.3]'),
('SLA', '기본 SLA', 145, 145, 175, 8000, '[0.025,0.05,0.1]'),
('DLP', '기본 DLP', 120, 68, 200, 9000, '[0.025,0.05,0.1]');
