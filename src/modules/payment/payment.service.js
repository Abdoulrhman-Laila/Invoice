const { pool } = require("../../config/database");
const invoiceRepo = require("../invoice/invoice.repo");
const paymentRepo = require("./payment.repo");

function roundMoney(n) {
  return Math.round(Number(n) * 100) / 100;
}

async function sumPaidForInvoice(client, invoiceId) {
  const res = await client.query(
    `SELECT COALESCE(SUM(amount), 0) AS s FROM payment WHERE invoice_id = $1`,
    [invoiceId]
  );
  return roundMoney(res.rows[0].s);
}

/**
 * @param {object} params
 * @param {number} params.shopId
 * @param {number} params.invoiceId
 * @param {number} params.amount
 * @param {string} [params.method]
 * @param {string} [params.paidAt] ISO date string
 */
async function addPayment({ shopId, invoiceId, amount, method, paidAt }) {
  const amt = roundMoney(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    const err = new Error("amount must be a positive number");
    err.statusCode = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const invRes = await client.query(
      `SELECT id, total_amount, status
       FROM invoice
       WHERE id = $1 AND shop_id = $2
       FOR UPDATE`,
      [invoiceId, shopId]
    );
    if (!invRes.rows.length) {
      const err = new Error("Invoice not found");
      err.statusCode = 404;
      throw err;
    }

    const invoice = invRes.rows[0];
    const total = roundMoney(invoice.total_amount);
    const paidSoFar = await sumPaidForInvoice(client, invoiceId);
    const remaining = roundMoney(total - paidSoFar);

    if (remaining <= 0) {
      const err = new Error("Invoice is already fully paid");
      err.statusCode = 400;
      throw err;
    }

    if (amt > remaining + 0.0001) {
      const err = new Error(
        `Payment exceeds remaining balance (${remaining})`
      );
      err.statusCode = 400;
      throw err;
    }

    const paidAtParam =
      paidAt !== undefined && paidAt !== null && paidAt !== ""
        ? paidAt
        : null;

    const ins = await client.query(
      `INSERT INTO payment (invoice_id, amount, method, paid_at)
       VALUES ($1, $2, $3, COALESCE($4::timestamptz, NOW()))
       RETURNING id, invoice_id, amount, method, paid_at`,
      [invoiceId, amt, method || null, paidAtParam]
    );
    const payment = ins.rows[0];

    const newPaid = roundMoney(paidSoFar + amt);
    let newStatus = "unpaid";
    if (newPaid >= total - 0.0001) {
      newStatus = "paid";
    } else if (newPaid > 0) {
      newStatus = "partial";
    }

    await client.query(`UPDATE invoice SET status = $1 WHERE id = $2`, [
      newStatus,
      invoiceId,
    ]);

    await client.query("COMMIT");

    return {
      payment,
      invoice: {
        id: invoiceId,
        total_amount: total,
        paid_total: newPaid,
        remaining: roundMoney(total - newPaid),
        status: newStatus,
      },
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function listPaymentsForInvoice({ shopId, invoiceId }) {
  const invoice = await invoiceRepo.findByIdForShop({ shopId, id: invoiceId });
  if (!invoice) {
    return null;
  }
  const sumRes = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS s FROM payment WHERE invoice_id = $1`,
    [invoiceId]
  );
  const paidTotal = roundMoney(Number(sumRes.rows[0].s));
  const total = roundMoney(invoice.total_amount);
  const remaining = roundMoney(total - paidTotal);
  const payments = await paymentRepo.listForInvoice({ invoiceId });
  return {
    invoice: {
      id: invoice.id,
      total_amount: invoice.total_amount,
      status: invoice.status,
    },
    payments,
    paid_total: paidTotal,
    remaining,
  };
}

module.exports = {
  addPayment,
  listPaymentsForInvoice,
};
