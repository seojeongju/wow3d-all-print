-- inquiries 멀티테넌시: store_id 컬럼 추가 (기존 운영 DB 호환)
ALTER TABLE inquiries ADD COLUMN store_id INTEGER DEFAULT 1;

UPDATE inquiries SET store_id = 1 WHERE store_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_inquiries_store_id ON inquiries(store_id);
