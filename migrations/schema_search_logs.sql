-- 사이트 통합 검색 기록 (인기 검색어·결과 없는 검색어 분석용, 1년 보관)
CREATE TABLE IF NOT EXISTS search_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    normalized TEXT NOT NULL,
    result_count INTEGER NOT NULL DEFAULT 0,
    locale TEXT NOT NULL DEFAULT 'ko',
    source TEXT NOT NULL DEFAULT 'page',
    visitor_id TEXT,
    clicked_url TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_search_logs_created ON search_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_normalized ON search_logs(normalized, created_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_visitor ON search_logs(visitor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_zero ON search_logs(result_count, created_at);
