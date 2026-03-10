-- 보정: 원화인데 1300을 한 번 더 곱해 잘못 들어간 금액 복구
-- 원인: legacy_amounts_to_krw.sql 실행 시 이미 원화(예: 24,259원)로 저장된 건이
--       total_amount < 100000 조건에 걸려 24,259 * 1300 = 31,536,700으로 잘못 변환됨.
--
-- 복구 조건: 금액이 2,600만~1억 400만 원 구간이면서 (금액/1300)이 2만~8만 원인 경우
--
-- 실행 전 반드시 백업 후, 1회만 실행하세요.
--   npx wrangler d1 execute wow3d-production --remote --file=./migrations/fix_double_converted_amounts.sql

-- orders / order_items 가 없을 수 있으므로 있으면 생성 (없으면 UPDATE는 0건 적용)
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  order_number TEXT UNIQUE NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_postal_code TEXT,
  total_amount REAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'production', 'shipping', 'completed', 'cancelled')),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  customer_note TEXT,
  admin_note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  quote_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (quote_id) REFERENCES quotes(id)
);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 1) order_items 먼저 복구 (단가/소계가 비정상 큰 항목만)
UPDATE order_items
SET unit_price = ROUND(unit_price / 1300),
    subtotal = ROUND(subtotal / 1300)
WHERE (unit_price BETWEEN 26000000 AND 104000000 AND ROUND(unit_price / 1300) BETWEEN 20000 AND 80000)
   OR (subtotal BETWEEN 26000000 AND 104000000 AND ROUND(subtotal / 1300) BETWEEN 20000 AND 80000);

-- 2) 주문 총액 복구
UPDATE orders
SET total_amount = ROUND(total_amount / 1300),
    updated_at = CURRENT_TIMESTAMP
WHERE total_amount BETWEEN 26000000 AND 104000000
  AND ROUND(total_amount / 1300) BETWEEN 20000 AND 80000;
