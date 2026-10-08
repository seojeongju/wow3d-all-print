-- 문의 답변 이력 + 관리자 알림 발송 상태
-- 내부 메모(inquiries.admin_note)와 고객 답변을 분리하고, 웹·메일 답장 경로의 답변을 모두 기록한다.

CREATE TABLE IF NOT EXISTS inquiry_replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inquiry_id INTEGER NOT NULL,
    -- admin_web: 문의 관리 화면에서 발송 / email_reply: 관리자 알림 메일 답장 / legacy: 이전 방식(관리자 메모) 기록
    channel TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_to TEXT,
    -- sent: 발송 성공 / failed: 발송 실패 / unknown: 이전 방식이라 발송 여부 불명
    send_status TEXT NOT NULL DEFAULT 'sent',
    send_error TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_inquiry_replies_inquiry ON inquiry_replies(inquiry_id, created_at);

-- 관리자 알림 메일 발송 상태 (sent / failed)
ALTER TABLE inquiries ADD COLUMN admin_notify_status TEXT;
ALTER TABLE inquiries ADD COLUMN admin_notify_error TEXT;
ALTER TABLE inquiries ADD COLUMN admin_notified_at DATETIME;
ALTER TABLE inquiries ADD COLUMN admin_notify_attempts INTEGER DEFAULT 0;

-- 이전 방식에서 「답변완료」+관리자 메모로 저장된 건을 이력에 옮겨 표시 (발송 여부는 알 수 없음)
INSERT INTO inquiry_replies (inquiry_id, channel, body, sent_to, send_status, created_at)
SELECT id, 'legacy', admin_note, email, 'unknown', COALESCE(updated_at, created_at)
FROM inquiries
WHERE status = 'replied'
  AND admin_note IS NOT NULL
  AND TRIM(admin_note) != '';
