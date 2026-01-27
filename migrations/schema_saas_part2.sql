ALTER TABLE orders ADD COLUMN store_id INTEGER DEFAULT 1 REFERENCES stores(id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
