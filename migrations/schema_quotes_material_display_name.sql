-- quotes: 고객이 선택한 소재명을 CHECK 화이트리스트와 별도로 저장
-- (기존 fdm_material / resin_type CHECK는 유지, 표시용 이름 컬럼 추가)
ALTER TABLE quotes ADD COLUMN fdm_material_name TEXT;
ALTER TABLE quotes ADD COLUMN resin_type_name TEXT;

-- 기존 허용 소재는 표시명도 채움
UPDATE quotes SET fdm_material_name = fdm_material WHERE fdm_material IS NOT NULL AND (fdm_material_name IS NULL OR fdm_material_name = '');
UPDATE quotes SET resin_type_name = resin_type WHERE resin_type IS NOT NULL AND (resin_type_name IS NULL OR resin_type_name = '');
