const { pool } = require("../../config/database");

async function findCustomerInShop({ shopId, customerId }) {
  const res = await pool.query(
    `SELECT id FROM customer WHERE shop_id = $1 AND id = $2 LIMIT 1`,
    [shopId, customerId]
  );
  return res.rows[0] || null;
}

async function list({ shopId, limit, offset }) {
  const res = await pool.query(
    `SELECT id, shop_id, customer_id, invoice_number, total_amount, status, created_at
     FROM invoice
     WHERE shop_id = $1
     ORDER BY id DESC
     LIMIT $2 OFFSET $3`,
    [shopId, limit, offset]
  );
  return res.rows;
}

async function findByIdForShop({ shopId, id }) {
  const res = await pool.query(
    `SELECT id, shop_id, customer_id, invoice_number, total_amount, status, created_at
     FROM invoice
     WHERE shop_id = $1 AND id = $2
     LIMIT 1`,
    [shopId, id]
  );
  return res.rows[0] || null;
}

async function findCustomerForShopById({ shopId, customerId }) {
  const res = await pool.query(
    `SELECT id, name, phone, email, address
     FROM customer
     WHERE shop_id = $1 AND id = $2
     LIMIT 1`,
    [shopId, customerId]
  );
  return res.rows[0] || null;
}

async function findItemsWithProduct({ invoiceId }) {
  const res = await pool.query(
    `SELECT ii.id, ii.invoice_id, ii.product_id, ii.quantity, ii.price, ii.total,
            p.name AS product_name
     FROM invoice_item ii
     JOIN product p ON p.id = ii.product_id
     WHERE ii.invoice_id = $1
     ORDER BY ii.id ASC`,
    [invoiceId]
  );
  return res.rows;
}

module.exports = {
  findCustomerInShop,
  findCustomerForShopById,
  list,
  findByIdForShop,
  findItemsWithProduct,
};
