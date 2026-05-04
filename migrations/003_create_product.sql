BEGIN;

CREATE TABLE IF NOT EXISTS product (
  id SERIAL PRIMARY KEY,
  shop_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_product_shop
    FOREIGN KEY (shop_id)
    REFERENCES shop (id)
    ON DELETE CASCADE,
  CONSTRAINT chk_product_price_non_negative CHECK (price >= 0),
  CONSTRAINT chk_product_stock_non_negative CHECK (stock >= 0)
);

CREATE INDEX IF NOT EXISTS idx_product_shop_id ON product (shop_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_product_shop_name ON product (shop_id, name);

COMMIT;

