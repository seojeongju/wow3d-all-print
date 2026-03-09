-- materials 테이블에 store_id 컬럼 추가
ALTER TABLE materials ADD COLUMN store_id INTEGER DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_materials_store_id ON materials(store_id);
