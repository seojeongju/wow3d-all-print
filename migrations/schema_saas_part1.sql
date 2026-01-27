CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    domain TEXT,
    owner_id INTEGER,
    plan TEXT DEFAULT 'starter',
    settings TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO stores (id, name, slug, plan, settings)
VALUES (1, 'Wow3D 기본 스토어', 'main', 'enterprise', '{"theme_color": "#2563eb", "business_name": "와우쓰리디"}')
ON CONFLICT(id) DO NOTHING;
