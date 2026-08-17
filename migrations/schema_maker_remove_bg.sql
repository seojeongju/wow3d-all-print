-- Maker 배경 제거(remove.bg) 일일 한도 기록
CREATE TABLE IF NOT EXISTS maker_remove_bg_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_maker_remove_bg_user ON maker_remove_bg_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_maker_remove_bg_session ON maker_remove_bg_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_maker_remove_bg_created ON maker_remove_bg_logs(created_at);
