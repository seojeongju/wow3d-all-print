-- materials에 description, updated_at 컬럼 추가 (fix_materials/fix_db 기준으로 만든 테이블용)
-- "no such column: description" 503 발생 시 실행
-- npx wrangler d1 execute wow3d-production --remote --file=./schema_materials_alter.sql

ALTER TABLE materials ADD COLUMN description TEXT;
ALTER TABLE materials ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
