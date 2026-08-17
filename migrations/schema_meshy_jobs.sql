-- Meshy Image-to-3D 작업 추적
CREATE TABLE IF NOT EXISTS meshy_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  -- pending | uploading | queued | processing | succeeded | failed | canceled
  meshy_task_id TEXT,
  source_image_key TEXT,
  source_file_name TEXT,
  result_file_key TEXT,
  result_file_name TEXT,
  thumbnail_url TEXT,
  progress INTEGER DEFAULT 0,
  credits_used INTEGER,
  error_message TEXT,
  quote_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_meshy_jobs_user ON meshy_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_meshy_jobs_session ON meshy_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_meshy_jobs_meshy_task ON meshy_jobs(meshy_task_id);
CREATE INDEX IF NOT EXISTS idx_meshy_jobs_created ON meshy_jobs(created_at);
