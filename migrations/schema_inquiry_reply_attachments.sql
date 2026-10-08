-- 문의 답변 첨부파일 (관리자 화면에서 답변에 첨부한 파일 목록)
-- attachments: JSON 배열 [{ "key": R2 키, "name": 파일명, "size": 바이트, "type": MIME }]
-- 실제 파일은 R2 inquiry-replies/{inquiry_id}/ 아래에 보관하며, 재발송 시 다시 읽어 메일에 첨부한다.

ALTER TABLE inquiry_replies ADD COLUMN attachments TEXT;
