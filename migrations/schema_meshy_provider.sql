-- 사진→AI 3D 프로바이더 (meshy | tripo) 및 Tripo STL 변환 task 추적
ALTER TABLE meshy_jobs ADD COLUMN provider TEXT DEFAULT 'meshy';
ALTER TABLE meshy_jobs ADD COLUMN aux_task_id TEXT;

CREATE INDEX IF NOT EXISTS idx_meshy_jobs_provider ON meshy_jobs(provider);
