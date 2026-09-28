-- 현재 접속자 집계용 접속 신호 (세션당 1행, heartbeat로 last_seen 갱신)
CREATE TABLE IF NOT EXISTS site_presence (
  session_id TEXT PRIMARY KEY,
  user_id INTEGER,
  path TEXT,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_site_presence_last_seen ON site_presence(last_seen DESC);
