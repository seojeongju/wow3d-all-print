-- SLA/DLP 견적 비율 캘리브레이션 (목표: SLA≈FDM×6, DLP≈FDM×3.5)
-- 적용: npx wrangler d1 execute wow3d-production --remote --file=./migrations/update_sla_dlp_calibration_20260730.sql

UPDATE printer_equipment
SET
    hourly_rate = 11100,
    sla_labor_cost_krw = 10700,
    sla_layer_exposure_sec = 9,
    updated_at = CURRENT_TIMESTAMP
WHERE UPPER(type) = 'SLA' AND (is_active = 1 OR is_active IS NULL);

UPDATE printer_equipment
SET
    hourly_rate = 7100,
    updated_at = CURRENT_TIMESTAMP
WHERE UPPER(type) = 'DLP' AND (is_active = 1 OR is_active IS NULL);
