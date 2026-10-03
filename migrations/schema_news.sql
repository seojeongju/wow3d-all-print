-- 3D프린팅 최신 동향(뉴스 큐레이션) 게시글
CREATE TABLE IF NOT EXISTS news_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL DEFAULT 1,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'industry',
    -- 핵심 요약: 줄바꿈으로 구분한 3~5줄
    summary TEXT,
    body_html TEXT,
    -- 와우3D 실무 관점
    insight TEXT,
    meta_description TEXT,
    source_name TEXT,
    source_url TEXT,
    source_published_at TEXT,
    cover_r2_key TEXT,
    cover_alt TEXT,
    tags_json TEXT,
    faq_json TEXT,
    related_links_json TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    -- UTC 'YYYY-MM-DD HH:MM:SS' — 미래 시각이면 예약 발행
    published_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(store_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_news_posts_store_status
    ON news_posts(store_id, status, published_at);
