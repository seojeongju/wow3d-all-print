-- printer_equipment에 레이어별 시간당 비용 (JSON: {"0.1":6000,"0.2":5000})
-- 실행: npx wrangler d1 execute wow3d-production --remote --file=./schema_equipment_layer_costs.sql
-- (이미 컬럼이 있으면 오류 발생 → 한 번만 실행)

ALTER TABLE printer_equipment ADD COLUMN layer_costs_json TEXT;
