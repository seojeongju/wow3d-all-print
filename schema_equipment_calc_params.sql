-- printer_equipment: 견적 산출 기준 (출력시간, 인건비, 지지/소모품/후가공 등)
-- 실행: npx wrangler d1 execute wow3d-production --remote --file=./schema_equipment_calc_params.sql

-- FDM: 레이어당 소요 시간(h), 인건비(원), 지지 구조 단가(원/cm²)
ALTER TABLE printer_equipment ADD COLUMN fdm_layer_hours_factor REAL DEFAULT 0.02;
ALTER TABLE printer_equipment ADD COLUMN fdm_labor_cost_krw REAL DEFAULT 6500;
ALTER TABLE printer_equipment ADD COLUMN fdm_support_per_cm2_krw REAL DEFAULT 26;

-- SLA: 레이어당 노출 시간(초), 인건비(원), 소모품비(원), 후가공 비용(원)
ALTER TABLE printer_equipment ADD COLUMN sla_layer_exposure_sec REAL DEFAULT 8;
ALTER TABLE printer_equipment ADD COLUMN sla_labor_cost_krw REAL DEFAULT 9100;
ALTER TABLE printer_equipment ADD COLUMN sla_consumables_krw REAL DEFAULT 3900;
ALTER TABLE printer_equipment ADD COLUMN sla_post_process_krw REAL DEFAULT 10400;

-- DLP: 레이어당 노출 시간(초), 인건비(원), 소모품비(원), 후가공 비용(원)
ALTER TABLE printer_equipment ADD COLUMN dlp_layer_exposure_sec REAL DEFAULT 3;
ALTER TABLE printer_equipment ADD COLUMN dlp_labor_cost_krw REAL DEFAULT 9100;
ALTER TABLE printer_equipment ADD COLUMN dlp_consumables_krw REAL DEFAULT 3900;
ALTER TABLE printer_equipment ADD COLUMN dlp_post_process_krw REAL DEFAULT 10400;
