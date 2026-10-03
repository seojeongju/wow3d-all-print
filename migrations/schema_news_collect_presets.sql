-- 최신 동향 수집 조건 고도화: 후보 기사에 일치 키워드 기록 + 저장 수집 조건(프리셋)
-- ALTER TABLE은 재실행 시 "duplicate column" 오류가 나므로 한 번만 실행한다

ALTER TABLE news_candidates ADD COLUMN keyword TEXT;

CREATE TABLE IF NOT EXISTS news_collect_presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL DEFAULT 1,
    name TEXT NOT NULL,
    -- lib/news-collect-config.ts CollectConfig JSON
    config_json TEXT NOT NULL,
    -- 1이면 매일 자정 크론에서 이 조건으로도 수집
    auto_collect INTEGER NOT NULL DEFAULT 0,
    last_run_at TEXT,
    last_added INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_news_collect_presets_store
    ON news_collect_presets(store_id, auto_collect);
