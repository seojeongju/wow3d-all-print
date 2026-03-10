-- 마이그레이션: 기존 "단위" 금액을 원화(KRW)로 일괄 변환
-- 배경: 과거에는 금액을 1300으로 나눈 값으로 저장하고 표시 시 ×1300으로 원화처럼 보여줌.
--       이제부터는 금액을 원화로만 저장·표시하므로, 기존 데이터를 원화로 바꿀 때 1회만 실행.
--
-- 실행 방법 (Cloudflare D1):
--   npx wrangler d1 execute <DB_NAME> --remote --file=./migrations/legacy_amounts_to_krw.sql
--
-- 주의: 이 스크립트는 한 번만 실행하세요. 이미 원화로 저장된 DB에서 다시 실행하면 금액이 1300배로 불어납니다.

-- quotes / orders / order_items 가 없을 수 있으므로 있으면 생성 (없으면 UPDATE는 0건 적용)
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id TEXT,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT,
  volume_cm3 REAL NOT NULL,
  surface_area_cm2 REAL NOT NULL,
  dimensions_x REAL NOT NULL,
  dimensions_y REAL NOT NULL,
  dimensions_z REAL NOT NULL,
  print_method TEXT NOT NULL CHECK(print_method IN ('fdm', 'sla', 'dlp')),
  fdm_material TEXT CHECK(fdm_material IN ('PLA', 'ABS', 'PETG', 'TPU')),
  fdm_infill INTEGER CHECK(fdm_infill >= 10 AND fdm_infill <= 100),
  fdm_layer_height REAL CHECK(fdm_layer_height IN (0.1, 0.2, 0.3)),
  fdm_support BOOLEAN,
  resin_type TEXT CHECK(resin_type IN ('Standard', 'Tough', 'Clear', 'Flexible')),
  layer_thickness REAL CHECK(layer_thickness IN (0.025, 0.05, 0.1)),
  post_processing BOOLEAN,
  total_price REAL NOT NULL,
  estimated_time_hours REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_session_id ON quotes(session_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);

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

UPDATE quotes
SET total_price = ROUND(total_price * 1300)
WHERE total_price IS NOT NULL AND total_price > 0 AND total_price < 100000;

UPDATE orders
SET total_amount = ROUND(total_amount * 1300)
WHERE total_amount IS NOT NULL AND total_amount > 0 AND total_amount < 100000;

UPDATE order_items
SET unit_price = ROUND(unit_price * 1300),
    subtotal = ROUND(subtotal * 1300)
WHERE (unit_price IS NOT NULL AND unit_price > 0 AND unit_price < 100000)
   OR (subtotal IS NOT NULL AND subtotal > 0 AND subtotal < 100000);
