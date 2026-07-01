-- 배송완료(delivered) 상태 및 자동 전환용 타임스탬프 추가
-- 배송중 5일 → 배송완료, 배송완료 2일 → 완료됨

PRAGMA foreign_keys=off;

CREATE TABLE orders_backup_delivered AS SELECT * FROM orders;

DROP TABLE orders;

CREATE TABLE "orders" (
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
  status TEXT DEFAULT 'pending' CHECK(status IN (
    'pending', 'confirmed', 'quote_sent', 'payment_confirmed',
    'production', 'shipping', 'delivered', 'completed', 'cancelled'
  )),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  customer_note TEXT,
  admin_note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  store_id INTEGER DEFAULT 1,
  expert_quote_data TEXT,
  has_expert_quote BOOLEAN DEFAULT 0,
  quotation_sent_at DATETIME NULL,
  shipping_started_at DATETIME NULL,
  delivered_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO orders (
  id, user_id, session_id, guest_email, order_number, recipient_name, recipient_phone,
  shipping_address, shipping_postal_code, total_amount, status, payment_method, payment_status,
  customer_note, admin_note, created_at, updated_at, store_id, expert_quote_data,
  has_expert_quote, quotation_sent_at, shipping_started_at, delivered_at
)
SELECT
  id, user_id, session_id, guest_email, order_number, recipient_name, recipient_phone,
  shipping_address, shipping_postal_code, total_amount, status, payment_method, payment_status,
  customer_note, admin_note, created_at, updated_at, store_id, expert_quote_data,
  has_expert_quote, quotation_sent_at,
  CASE WHEN status = 'shipping' THEN COALESCE(updated_at, created_at) ELSE NULL END,
  NULL
FROM orders_backup_delivered;

DROP TABLE orders_backup_delivered;

PRAGMA foreign_keys=on;
