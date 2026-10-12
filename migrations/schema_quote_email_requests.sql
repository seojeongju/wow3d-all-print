-- 견적 메일 받기: 손님이 견적 결과를 이메일로 받고, 동의한 경우 3일 뒤 1회 리마인드 메일을 받는다.
-- 개인정보처리방침 제3조: 신청일로부터 90일 후 자동 파기 (cron /api/cron/quote-reminders)
CREATE TABLE IF NOT EXISTS quote_email_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    locale TEXT NOT NULL DEFAULT 'ko',
    remind_opt_in INTEGER NOT NULL DEFAULT 0,
    token TEXT NOT NULL,
    user_id INTEGER,
    session_id TEXT,
    sent_at TEXT,
    send_error TEXT,
    remind_after TEXT,
    reminded_at TEXT,
    remind_error TEXT,
    unsubscribed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_quote_email_requests_quote_id ON quote_email_requests(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_email_requests_email ON quote_email_requests(email);
CREATE INDEX IF NOT EXISTS idx_quote_email_requests_remind ON quote_email_requests(remind_after);
CREATE UNIQUE INDEX IF NOT EXISTS idx_quote_email_requests_token ON quote_email_requests(token);
