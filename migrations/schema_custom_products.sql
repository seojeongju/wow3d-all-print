-- 맞춤 상품 (스마트스토어형) + 이미지
CREATE TABLE IF NOT EXISTS custom_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL DEFAULT 1,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    description TEXT,
    detail_body TEXT,
    price_note TEXT,
    method TEXT NOT NULL DEFAULT 'fdm',
    primary_cta TEXT NOT NULL DEFAULT 'quote',
    secondary_cta TEXT,
    options_json TEXT,
    highlights_json TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(store_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_custom_products_store_active
    ON custom_products(store_id, is_active, sort_order);

CREATE TABLE IF NOT EXISTS custom_product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    r2_key TEXT NOT NULL,
    mime_type TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES custom_products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_custom_product_images_product
    ON custom_product_images(product_id, role, sort_order, id);
