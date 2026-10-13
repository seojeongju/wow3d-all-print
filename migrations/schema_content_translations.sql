-- DB 콘텐츠(갤러리·맞춤 상품) 다국어 번역 캐시
-- 적용: npx wrangler d1 execute wow3d-production --remote --file=./migrations/schema_content_translations.sql
CREATE TABLE IF NOT EXISTS content_translations (
    entity_type TEXT NOT NULL,          -- 'gallery' | 'custom_product'
    entity_id TEXT NOT NULL,            -- 갤러리 '123' · 외부 연동 'remote_45' · 맞춤 상품 '3'
    locale TEXT NOT NULL,               -- 'en'
    source_hash TEXT NOT NULL,          -- 번역 당시 한국어 원문 해시 (원문이 바뀌면 재번역)
    fields_json TEXT NOT NULL,          -- 평탄화된 번역 필드 {"title": "...", "tags.0": "..."}
    provider TEXT NOT NULL DEFAULT 'workers-ai', -- 'manual' | 'workers-ai'
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (entity_type, entity_id, locale)
);
