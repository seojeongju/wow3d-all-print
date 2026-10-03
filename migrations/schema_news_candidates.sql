-- 최신 동향 AI 초안용 기사 후보 (RSS·네이버 뉴스·관리자 URL 입력)
CREATE TABLE IF NOT EXISTS news_candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL DEFAULT 1,
    -- rss | naver | manual
    source_type TEXT NOT NULL,
    source_name TEXT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    summary TEXT,
    -- ko | en
    language TEXT NOT NULL DEFAULT 'ko',
    -- UTC 'YYYY-MM-DD HH:MM:SS'
    published_at TEXT,
    -- 키워드 기반 관련도 0~100
    relevance INTEGER NOT NULL DEFAULT 0,
    -- new | hidden | drafted
    status TEXT NOT NULL DEFAULT 'new',
    draft_post_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(store_id, url)
);

CREATE INDEX IF NOT EXISTS idx_news_candidates_store_status
    ON news_candidates(store_id, status, created_at);
