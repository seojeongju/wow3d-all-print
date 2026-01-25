-- 비회원 주문 지원: orders에 session_id, guest_email 추가, user_id nullable
-- D1/SQLite: user_id NOT NULL 변경을 위해 테이블 재생성
--
-- 실행: wrangler d1 execute <DB> --remote --file=schema_orders_guest.sql
-- (또는 문장별로 실행. PRAGMA foreign_keys는 연결마다 다를 수 있음.)
--
-- 1) FK 비활성화 (D1에서 지원하는 경우)
PRAGMA foreign_keys=OFF;

-- 2) 새 테이블 생성 (user_id nullable, session_id, guest_email 추가)
CREATE TABLE IF NOT EXISTS orders_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id TEXT,
  guest_email TEXT,
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

-- 3) 기존 데이터 이전
INSERT INTO orders_new (id, user_id, session_id, guest_email, order_number, recipient_name, recipient_phone, shipping_address, shipping_postal_code, total_amount, status, payment_method, payment_status, customer_note, admin_note, created_at, updated_at)
SELECT id, user_id, NULL, NULL, order_number, recipient_name, recipient_phone, shipping_address, shipping_postal_code, total_amount, status, payment_method, payment_status, customer_note, admin_note, created_at, updated_at
FROM orders;

-- 4) 기존 테이블 삭제 후 이름 변경
DROP TABLE orders;
ALTER TABLE orders_new RENAME TO orders;

-- 5) 인덱스 재생성
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id);

-- 6) FK 재활성화
PRAGMA foreign_keys=ON;
