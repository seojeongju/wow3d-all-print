-- 출력물 갤러리 테이블
CREATE TABLE IF NOT EXISTS gallery_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    material TEXT,
    print_method TEXT,
    tags TEXT,          -- JSON 배열 문자열 예: '["FDM","PLA"]'
    is_visible INTEGER NOT NULL DEFAULT 1,  -- 1=공개, 0=비공개
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_gallery_store ON gallery_items(store_id, is_visible, sort_order);
