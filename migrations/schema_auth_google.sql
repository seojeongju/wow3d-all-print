-- Google OAuth 로그인: users 테이블에 google_id 추가 (구글 계정으로 가입/로그인)
ALTER TABLE users ADD COLUMN google_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
