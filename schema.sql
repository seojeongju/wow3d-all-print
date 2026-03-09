-- Wow3D D1 Database Schema
-- Phase 2: 장바구니, 회원, 주문 관리 시스템

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 이메일 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 견적 테이블 (저장된 견적)
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id TEXT, -- 비회원용 세션 ID
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT, -- R2 스토리지 URL
  
  -- 지오메트리 정보
  volume_cm3 REAL NOT NULL,
  surface_area_cm2 REAL NOT NULL,
  dimensions_x REAL NOT NULL,
  dimensions_y REAL NOT NULL,
  dimensions_z REAL NOT NULL,
  
  -- 출력 방식 및 옵션
  print_method TEXT NOT NULL CHECK(print_method IN ('fdm', 'sla', 'dlp')),
  
  -- FDM 옵션
  fdm_material TEXT CHECK(fdm_material IN ('PLA', 'ABS', 'PETG', 'TPU')),
  fdm_infill INTEGER CHECK(fdm_infill >= 10 AND fdm_infill <= 100),
  fdm_layer_height REAL CHECK(fdm_layer_height IN (0.1, 0.2, 0.3)),
  fdm_support BOOLEAN,
  
  -- SLA/DLP 옵션
  resin_type TEXT CHECK(resin_type IN ('Standard', 'Tough', 'Clear', 'Flexible')),
  layer_thickness REAL CHECK(layer_thickness IN (0.025, 0.05, 0.1)),
  post_processing BOOLEAN,
  
  -- 가격 정보
  total_price REAL NOT NULL,
  estimated_time_hours REAL NOT NULL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 견적 인덱스
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_session_id ON quotes(session_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);

-- 장바구니 테이블
CREATE TABLE IF NOT EXISTS cart (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id TEXT, -- 비회원용
  quote_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK(quantity > 0),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

-- 장바구니 인덱스
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_session_id ON cart(session_id);

-- 주문 테이블
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  order_number TEXT UNIQUE NOT NULL,
  
  -- 배송 정보
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_postal_code TEXT,
  
  -- 주문 금액
  total_amount REAL NOT NULL,
  
  -- 주문 상태
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'production', 'shipping', 'completed', 'cancelled')),
  
  -- 결제 정보
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  
  -- 메모
  customer_note TEXT,
  admin_note TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 주문 인덱스
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 주문 상세 테이블 (주문 내 각 견적 항목)
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

-- 주문 상세 인덱스
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 배송 추적 테이블
CREATE TABLE IF NOT EXISTS shipments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  tracking_number TEXT,
  carrier TEXT,
  shipped_at DATETIME,
  delivered_at DATETIME,
  status TEXT DEFAULT 'preparing' CHECK(status IN ('preparing', 'shipped', 'in_transit', 'delivered')),
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 배송 추적 인덱스
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);

-- 문의 테이블
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  category TEXT CHECK(category IN ('general', 'quote', 'tech', 'partnership', 'other')),
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK(status IN ('new', 'read', 'replied', 'closed')),
  admin_note TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);
