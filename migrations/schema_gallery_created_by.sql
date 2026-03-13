-- 갤러리 업로더 추적 (보안 감사용)
-- 업로드한 관리자 user id (감사용)
ALTER TABLE gallery_items ADD COLUMN created_by_user_id INTEGER;
