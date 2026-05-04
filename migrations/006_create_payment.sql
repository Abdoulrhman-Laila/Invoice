BEGIN;

CREATE TABLE IF NOT EXISTS payment (
  id SERIAL PRIMARY KEY,
  invoice_id INT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  method VARCHAR(50),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_payment_invoice
    FOREIGN KEY (invoice_id)
    REFERENCES invoice (id)
    ON DELETE CASCADE,
  CONSTRAINT chk_payment_amount_non_negative CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_payment_invoice_id ON payment (invoice_id);

COMMIT;

