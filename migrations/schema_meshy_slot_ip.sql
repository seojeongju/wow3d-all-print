-- 사진→AI 3D: 사용한 슬롯 종류(daily | bonus | admin)와 요청 IP 해시 기록
-- IP 기준 일일 무료 한도 집계용 (원본 IP는 저장하지 않음)
ALTER TABLE meshy_jobs ADD COLUMN slot TEXT;
ALTER TABLE meshy_jobs ADD COLUMN ip_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_meshy_jobs_ip_created ON meshy_jobs(ip_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_meshy_bonus_note ON meshy_bonus_credits(note);
