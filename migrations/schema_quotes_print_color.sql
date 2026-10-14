-- 견적 출력 색상 (white·black·other) + 기타 색상 메모
-- 배포 전에 실행: npx wrangler d1 execute wow3d-production --remote --file=./migrations/schema_quotes_print_color.sql
ALTER TABLE quotes ADD COLUMN print_color TEXT;
ALTER TABLE quotes ADD COLUMN print_color_note TEXT;
