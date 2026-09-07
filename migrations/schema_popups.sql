-- 사이트 팝업 관리
-- 실행: npx wrangler d1 execute wow3d-production --remote --file=./migrations/schema_popups.sql

CREATE TABLE IF NOT EXISTS popups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  body TEXT,
  image_key TEXT,
  link_url TEXT,
  start_at TEXT,
  end_at TEXT,
  is_visible INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  dismiss_days INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_popups_store_active
  ON popups(store_id, is_visible, sort_order, start_at, end_at);
