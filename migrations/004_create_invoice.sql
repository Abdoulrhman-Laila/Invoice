BEGIN;

CREATE TABLE IF NOT EXISTS invoice (
  id SERIAL PRIMARY KEY,
  shop_id INT NOT NULL,
  customer_id INT NOT NULL,
  invoice_number VARCHAR(100) NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_invoice_shop
    FOREIGN KEY (shop_id)
    REFERENCES shop (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_invoice_customer
    FOREIGN KEY (customer_id)
    REFERENCES customer (id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_invoice_total_non_negative CHECK (total_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_invoice_shop_id ON invoice (shop_id);
CREATE INDEX IF NOT EXISTS idx_invoice_customer_id ON invoice (customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_invoice_shop_number ON invoice (shop_id, invoice_number);

COMMIT;

