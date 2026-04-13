-- migration: add file_url and update category constraint for inquiries
PRAGMA foreign_keys=OFF;

CREATE TABLE inquiries_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  category TEXT CHECK(category IN ('general', 'quote', 'tech', 'partnership', 'other', 'development')),
  subject TEXT,
  message TEXT NOT NULL,
  file_url TEXT,
  status TEXT DEFAULT 'new' CHECK(status IN ('new', 'read', 'replied', 'closed')),
  admin_note TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO inquiries_new (id, user_id, name, email, phone, category, subject, message, status, admin_note, ip_address, created_at, updated_at)
SELECT id, user_id, name, email, phone, category, subject, message, status, admin_note, ip_address, created_at, updated_at FROM inquiries;

DROP TABLE inquiries;
ALTER TABLE inquiries_new RENAME TO inquiries;

CREATE INDEX idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_email ON inquiries(email);

PRAGMA foreign_keys=ON;
