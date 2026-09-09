-- 시제품 갤러리 항목별 추가 이미지 (대표 image_url 외 다장 지원)
CREATE TABLE IF NOT EXISTS gallery_item_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gallery_item_id INTEGER NOT NULL,
    r2_key TEXT NOT NULL,
    mime_type TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (gallery_item_id) REFERENCES gallery_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gallery_item_images_item
    ON gallery_item_images(gallery_item_id, sort_order, id);
