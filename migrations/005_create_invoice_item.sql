BEGIN;

CREATE TABLE IF NOT EXISTS invoice_item (
  id SERIAL PRIMARY KEY,
  invoice_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_invoice_item_invoice
    FOREIGN KEY (invoice_id)
    REFERENCES invoice (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_invoice_item_product
    FOREIGN KEY (product_id)
    REFERENCES product (id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_invoice_item_quantity_positive CHECK (quantity > 0),
  CONSTRAINT chk_invoice_item_price_non_negative CHECK (price >= 0),
  CONSTRAINT chk_invoice_item_total_non_negative CHECK (total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_invoice_item_invoice_id ON invoice_item (invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_item_product_id ON invoice_item (product_id);

COMMIT;

