-- 문의 이메일 답장 연동용 토큰
ALTER TABLE inquiries ADD COLUMN reply_token TEXT;

CREATE INDEX IF NOT EXISTS idx_inquiries_reply_token ON inquiries(reply_token);
