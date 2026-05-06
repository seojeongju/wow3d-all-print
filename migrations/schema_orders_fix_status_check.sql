PRAGMA foreign_keys=off;

CREATE TABLE "orders_new" (
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
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'production', 'quote_sent', 'shipping', 'completed', 'cancelled')),
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO orders_new SELECT * FROM orders;

DROP TABLE orders;

ALTER TABLE orders_new RENAME TO orders;

PRAGMA foreign_keys=on;
