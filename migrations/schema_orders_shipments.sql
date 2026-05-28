-- 주문 배송(출고) 정보 초기화용 테이블
-- 주문 생성 시 INSERT INTO shipments (order_id) VALUES (?) 를 사용하므로
-- 최소한 order_id 고유 제약과 기본 타임스탬프를 보장한다.

CREATE TABLE IF NOT EXISTS shipments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL UNIQUE,
  courier TEXT,
  tracking_number TEXT,
  status TEXT DEFAULT 'pending',
  shipped_at DATETIME,
  delivered_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
