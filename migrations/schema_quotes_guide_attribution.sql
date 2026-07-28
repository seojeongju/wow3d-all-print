-- quotes: 가이드 유입 출처/주제 저장
ALTER TABLE quotes ADD COLUMN guide_source TEXT;
ALTER TABLE quotes ADD COLUMN guide_topic TEXT;

CREATE INDEX IF NOT EXISTS idx_quotes_guide_source ON quotes(guide_source);
