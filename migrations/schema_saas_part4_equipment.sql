-- Printer Equipment 테이블 마이그레이션
-- 기존 type PK 제거하고 (store_id, type) 복합키 적용

CREATE TABLE IF NOT EXISTS printer_equipment_new (
    type TEXT NOT NULL,
    name TEXT,
    max_x_mm REAL, max_y_mm REAL, max_z_mm REAL,
    hourly_rate REAL,
    layer_heights_json TEXT,
    layer_costs_json TEXT,
    is_active INTEGER DEFAULT 1,
    
    -- Calculation Params (FDM)
    fdm_layer_hours_factor REAL, 
    fdm_labor_cost_krw REAL, 
    fdm_support_per_cm2_krw REAL,
    
    -- Calculation Params (SLA)
    sla_layer_exposure_sec REAL, 
    sla_labor_cost_krw REAL, 
    sla_consumables_krw REAL, 
    sla_post_process_krw REAL,
    
    -- Calculation Params (DLP)
    dlp_layer_exposure_sec REAL, 
    dlp_labor_cost_krw REAL, 
    dlp_consumables_krw REAL, 
    dlp_post_process_krw REAL,
    
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    store_id INTEGER DEFAULT 1 REFERENCES stores(id),
    PRIMARY KEY (store_id, type)
);

-- 기존 데이터 복사 (Store ID = 1)
INSERT INTO printer_equipment_new (
    type, name, max_x_mm, max_y_mm, max_z_mm, hourly_rate, layer_heights_json, layer_costs_json, is_active,
    fdm_layer_hours_factor, fdm_labor_cost_krw, fdm_support_per_cm2_krw,
    sla_layer_exposure_sec, sla_labor_cost_krw, sla_consumables_krw, sla_post_process_krw,
    dlp_layer_exposure_sec, dlp_labor_cost_krw, dlp_consumables_krw, dlp_post_process_krw,
    updated_at, store_id
)
SELECT 
    type, name, max_x_mm, max_y_mm, max_z_mm, hourly_rate, layer_heights_json, layer_costs_json, is_active,
    fdm_layer_hours_factor, fdm_labor_cost_krw, fdm_support_per_cm2_krw,
    sla_layer_exposure_sec, sla_labor_cost_krw, sla_consumables_krw, sla_post_process_krw,
    dlp_layer_exposure_sec, dlp_labor_cost_krw, dlp_consumables_krw, dlp_post_process_krw,
    updated_at, 1
FROM printer_equipment;

-- 테이블 교체
DROP TABLE printer_equipment;
ALTER TABLE printer_equipment_new RENAME TO printer_equipment;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_printer_equipment_store_id ON printer_equipment(store_id);
