-- Kakao OAuth 로그인: users 테이블에 kakao_id 추가
ALTER TABLE users ADD COLUMN kakao_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_kakao_id ON users(kakao_id) WHERE kakao_id IS NOT NULL;
