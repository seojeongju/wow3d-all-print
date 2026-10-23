-- 견적 확인 기록: 저장 전에도 원본을 남겨 관리자가 3D로 볼 수 있게 한다
-- 값은 R2 키 (estimate-logs/{id}/{fileName}). 견적으로 저장된 건은 quotes.file_url로도 연다.
ALTER TABLE quote_estimate_logs ADD COLUMN file_key TEXT;
