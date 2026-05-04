BEGIN;

CREATE TABLE IF NOT EXISTS customer (
  id SERIAL PRIMARY KEY,
  shop_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_customer_shop
    FOREIGN KEY (shop_id)
    REFERENCES shop (id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_customer_shop_id ON customer (shop_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_customer_shop_email
  ON customer (shop_id, email)
  WHERE email IS NOT NULL;

COMMIT;

