-- 견적 확인 기록: 손님이 파일을 올려 자동견적 금액을 확인한 시점의 정보 (저장·장바구니 여부와 무관)
-- 원본 파일은 보관하지 않고, 수치 정보와 뷰어 미리보기 캡처(작은 JPEG data URL)만 남긴다.
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
