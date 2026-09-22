-- 팝업 크기·위치 프리셋
-- 실행: npx wrangler d1 execute wow3d-production --remote --file=./migrations/schema_popups_size_position.sql

ALTER TABLE popups ADD COLUMN size_preset TEXT NOT NULL DEFAULT 'md';
ALTER TABLE popups ADD COLUMN position_preset TEXT NOT NULL DEFAULT 'center';
