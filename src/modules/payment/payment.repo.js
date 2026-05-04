const { pool } = require("../../config/database");

async function listForInvoice({ invoiceId }) {
  const res = await pool.query(
    `SELECT id, invoice_id, amount, method, paid_at
     FROM payment
     WHERE invoice_id = $1
     ORDER BY id ASC`,
    [invoiceId]
  );
  return res.rows;
}

module.exports = {
  listForInvoice,
};
