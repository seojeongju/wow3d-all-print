/**
 * SLA/DLP layer_costs_json을 hourly_rate 튜닝값과 동기화
 * layer_costs가 hourly_rate보다 우선 적용되므로 함께 갱신 필요
 *
 * 적용: npx wrangler d1 execute wow3d-production --remote --file=./migrations/update_layer_costs_sla_dlp_20260730.sql
 */

UPDATE printer_equipment
SET
    layer_costs_json = '{"0.025":11100,"0.05":11100,"0.1":11100}',
    updated_at = CURRENT_TIMESTAMP
WHERE UPPER(type) = 'SLA' AND (is_active = 1 OR is_active IS NULL);

UPDATE printer_equipment
SET
    layer_costs_json = '{"0.025":7100,"0.05":7100,"0.1":7100}',
    updated_at = CURRENT_TIMESTAMP
WHERE UPPER(type) = 'DLP' AND (is_active = 1 OR is_active IS NULL);
