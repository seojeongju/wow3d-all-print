-- 사진→AI 3D 추가 생성 보너스(관리자 부여). remaining > 0 인 합이 사용 가능 횟수
CREATE TABLE IF NOT EXISTS meshy_bonus_credits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL DEFAULT 1,
  remaining INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  granted_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_meshy_bonus_user ON meshy_bonus_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_meshy_bonus_remaining ON meshy_bonus_credits(user_id, remaining);
