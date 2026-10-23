-- 견적 확인 기록: 손님이 파일을 올려 자동견적 금액을 확인한 시점의 정보 (저장·장바구니 여부와 무관)
-- 수치와 뷰어 썸네일(JPEG data URL)을 남긴다.
-- 원본 파일 키는 schema_quote_estimate_logs_file_key.sql (file_key)로 추가한다.
CREATE TABLE IF NOT EXISTS quote_estimate_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    session_id TEXT,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL DEFAULT 0,
    dimensions_x REAL NOT NULL DEFAULT 0,
    dimensions_y REAL NOT NULL DEFAULT 0,
    dimensions_z REAL NOT NULL DEFAULT 0,
    volume_cm3 REAL NOT NULL DEFAULT 0,
    surface_area_cm2 REAL NOT NULL DEFAULT 0,
    print_method TEXT NOT NULL,
    material_name TEXT,
    layer_height REAL,
    fdm_infill INTEGER,
    total_price INTEGER NOT NULL DEFAULT 0,
    estimated_time_hours REAL NOT NULL DEFAULT 0,
    change_count INTEGER NOT NULL DEFAULT 0,
    thumbnail_data TEXT,
    quote_id INTEGER,
    guide_source TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_quote_estimate_logs_created_at ON quote_estimate_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_estimate_logs_user_id ON quote_estimate_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_estimate_logs_session_id ON quote_estimate_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_quote_estimate_logs_quote_id ON quote_estimate_logs(quote_id);
