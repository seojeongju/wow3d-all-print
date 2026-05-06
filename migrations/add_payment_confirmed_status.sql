-- orders 테이블 status CHECK 제약에 'payment_confirmed' 추가
-- SQLite는 ALTER TABLE로 CHECK 변경 불가 → 테이블 재생성 방식 사용

-- 1. 기존 데이터를 임시 테이블로 복사
CREATE TABLE orders_backup AS SELECT * FROM orders;

-- 2. 기존 테이블 삭제
DROP TABLE orders;

-- 3. payment_confirmed를 포함한 새 테이블 생성
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
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'quote_sent', 'payment_confirmed', 'production', 'shipping', 'completed', 'cancelled')),
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

-- 4. 백업 데이터 복원
INSERT INTO orders SELECT * FROM orders_backup;

-- 5. 임시 백업 테이블 삭제
DROP TABLE orders_backup;
