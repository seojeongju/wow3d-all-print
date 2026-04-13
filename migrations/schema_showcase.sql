-- 전문가(/expert) 쇼케이스: 갤러리와 별도 (카테고리별 제작 예시 + 이미지/영상)
CREATE TABLE IF NOT EXISTS showcase_category_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL DEFAULT 1,
    category_slug TEXT NOT NULL,
    title TEXT,
    description TEXT,
    features_json TEXT,
    card_image_key TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(store_id, category_slug)
);

CREATE INDEX IF NOT EXISTS idx_showcase_cat_store ON showcase_category_content(store_id, category_slug);

CREATE TABLE IF NOT EXISTS showcase_examples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL DEFAULT 1,
    category_slug TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    features_json TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_visible INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_showcase_ex_store_cat ON showcase_examples(store_id, category_slug, is_visible, sort_order);
CREATE INDEX IF NOT EXISTS idx_showcase_ex_cat ON showcase_examples(category_slug, is_visible);

CREATE TABLE IF NOT EXISTS showcase_example_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    example_id INTEGER NOT NULL,
    kind TEXT NOT NULL,
    r2_key TEXT NOT NULL,
    mime_type TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_showcase_media_example ON showcase_example_media(example_id, sort_order);
