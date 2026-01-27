-- SaaS 전환을 위한 스토어(Tenant) 테이블 생성 및 기존 테이블 마이그레이션

-- 1. Stores 테이블 생성
CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE, -- URL 서브도메인 또는 경로 식별자
    domain TEXT,               -- 커스텀 도메인 (예: print.company.com)
    owner_id INTEGER,          -- 스토어 소유자(관리자) ID
    plan TEXT DEFAULT 'starter', -- 구독 플랜 (starter, pro, enterprise)
    settings TEXT DEFAULT '{}', -- JSON: 로고, 테마색상, 사업자정보, 결제설정 등
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 기본 스토어(본점) 생성 (기존 데이터 귀속용)
-- ID=1인 스토어를 생성하여 기존 데이터가 고아(Orphan)가 되지 않도록 함
INSERT INTO stores (id, name, slug, plan, settings)
VALUES (1, 'Wow3D 기본 스토어', 'main', 'enterprise', '{"theme_color": "#2563eb", "business_name": "와우쓰리디"}')
ON CONFLICT(id) DO NOTHING; -- 이미 있으면 패스

-- 3. 주요 테이블에 store_id 컬럼 추가 (멀티 테넌시 적용)
-- SQLite는 ALTER TABLE에서 IF NOT EXISTS 지원이 제한적일 수 있으므로 주의
-- 만약 이미 컬럼이 있다면 이 부분에서 에러가 발생할 수 있음 (최초 1회만 실행)

-- Users (사용자 소속)
ALTER TABLE users ADD COLUMN store_id INTEGER DEFAULT 1 REFERENCES stores(id);

-- Orders (주문 소속)
ALTER TABLE orders ADD COLUMN store_id INTEGER DEFAULT 1 REFERENCES stores(id);

-- Inquiries (문의 소속)
ALTER TABLE inquiries ADD COLUMN store_id INTEGER DEFAULT 1 REFERENCES stores(id);

-- Pricing Presets (가격 설정 소속 - 업체별 다른 가격 정책)
ALTER TABLE pricing_presets ADD COLUMN store_id INTEGER DEFAULT 1 REFERENCES stores(id);

-- Materials (재료 설정 소속 - 업체별 보유 재료 다름)
ALTER TABLE materials ADD COLUMN store_id INTEGER DEFAULT 1 REFERENCES stores(id);

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);
CREATE INDEX IF NOT EXISTS idx_pricing_presets_store_id ON pricing_presets(store_id);
