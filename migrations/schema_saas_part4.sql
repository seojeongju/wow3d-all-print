-- Part 4: 설정(Settings) 및 장비(Equipment) 테이블 마이그레이션

-- 1. Equipment 테이블에 store_id 추가
ALTER TABLE equipment ADD COLUMN store_id INTEGER DEFAULT 1 REFERENCES stores(id);
CREATE INDEX IF NOT EXISTS idx_equipment_store_id ON equipment(store_id);

-- 2. Print Settings 테이블 마이그레이션
-- 기존 print_settings 테이블은 key가 PK/Unique일 가능성이 높으므로,
-- store_id를 포함한 복합키(Composite Key) 구성을 위해 테이블을 재생성합니다.

CREATE TABLE IF NOT EXISTS print_settings_new (
    key TEXT NOT NULL,
    value TEXT,
    description TEXT,
    store_id INTEGER DEFAULT 1 REFERENCES stores(id),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (store_id, key) -- 스토어별로 설정 키값 중복 가능
);

-- 기존 데이터 마이그레이션 (Store #1로 할당)
INSERT INTO print_settings_new (key, value, description, store_id, updated_at)
SELECT key, value, description, 1, updated_at FROM print_settings;

-- 테이블 교체
DROP TABLE print_settings;
ALTER TABLE print_settings_new RENAME TO print_settings;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_print_settings_store_id ON print_settings(store_id);
