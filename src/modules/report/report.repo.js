const { pool } = require("../../config/database");

async function summaryInvoiced({ shopId, from, to }) {
  const res = await pool.query(
    `SELECT
       COALESCE(SUM(total_amount), 0) AS total_invoiced,
       COUNT(*)::int AS invoice_count
     FROM invoice
     WHERE shop_id = $1
       AND created_at >= $2::timestamptz
       AND created_at <= $3::timestamptz`,
    [shopId, from, to]
  );
  return res.rows[0];
}

async function summaryPaymentsCollected({ shopId, from, to }) {
  const res = await pool.query(
    `SELECT
       COALESCE(SUM(p.amount), 0) AS total_paid,
       COUNT(*)::int AS payment_count
     FROM payment p
     INNER JOIN invoice i ON i.id = p.invoice_id
     WHERE i.shop_id = $1
       AND p.paid_at >= $2::timestamptz
       AND p.paid_at <= $3::timestamptz`,
    [shopId, from, to]
  );
  return res.rows[0];
}

async function topProducts({ shopId, from, to, limit }) {
  const res = await pool.query(
    `SELECT
       pr.id AS product_id,
       pr.name AS product_name,
       SUM(ii.quantity)::bigint AS units_sold,
       COALESCE(SUM(ii.total), 0) AS revenue
     FROM invoice_item ii
     INNER JOIN invoice inv ON inv.id = ii.invoice_id
     INNER JOIN product pr ON pr.id = ii.product_id
     WHERE inv.shop_id = $1
       AND inv.created_at >= $2::timestamptz
       AND inv.created_at <= $3::timestamptz
     GROUP BY pr.id, pr.name
     ORDER BY revenue DESC
     LIMIT $4`,
    [shopId, from, to, limit]
  );
  return res.rows;
}

async function topCustomers({ shopId, from, to, limit }) {
  const res = await pool.query(
    `SELECT
       c.id AS customer_id,
       c.name AS customer_name,
       COALESCE(SUM(inv.total_amount), 0) AS total_invoiced,
       COUNT(inv.id)::int AS invoice_count
     FROM invoice inv
     INNER JOIN customer c ON c.id = inv.customer_id
     WHERE inv.shop_id = $1
       AND inv.created_at >= $2::timestamptz
       AND inv.created_at <= $3::timestamptz
     GROUP BY c.id, c.name
     ORDER BY total_invoiced DESC
     LIMIT $4`,
    [shopId, from, to, limit]
  );
  return res.rows;
}

module.exports = {
  summaryInvoiced,
  summaryPaymentsCollected,
  topProducts,
  topCustomers,
};
