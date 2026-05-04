const repo = require("./report.repo");

function roundMoney(n) {
  return Math.round(Number(n) * 100) / 100;
}

function parseIsoDateTime(value, isEndDate) {
  if (!value || typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  if (isEndDate && /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    d.setHours(23, 59, 59, 999);
  }
  if (!isEndDate && /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

/**
 * @param {object} params
 * @param {number} params.shopId
 * @param {string} [params.from]
 * @param {string} [params.to]
 * @param {number} [params.top]
 */
async function getSalesReport({ shopId, from, to, top }) {
  const now = new Date();
  let fromDt = parseIsoDateTime(from || "", false);
  let toDt = parseIsoDateTime(to || "", true);

  if (!fromDt) {
    fromDt = new Date(now);
    fromDt.setDate(fromDt.getDate() - 30);
    fromDt.setHours(0, 0, 0, 0);
  }

  if (!toDt) {
    toDt = new Date(now);
    toDt.setHours(23, 59, 59, 999);
  }

  if (fromDt > toDt) {
    const err = new Error("from must be before or equal to to");
    err.statusCode = 400;
    throw err;
  }

  const fromIso = fromDt.toISOString();
  const toIso = toDt.toISOString();

  const limit = Math.min(Math.max(Number(top) || 10, 1), 50);

  const [invoiced, collected, products, customers] = await Promise.all([
    repo.summaryInvoiced({ shopId, from: fromIso, to: toIso }),
    repo.summaryPaymentsCollected({ shopId, from: fromIso, to: toIso }),
    repo.topProducts({ shopId, from: fromIso, to: toIso, limit }),
    repo.topCustomers({ shopId, from: fromIso, to: toIso, limit }),
  ]);

  return {
    period: { from: fromIso, to: toIso },
    summary: {
      total_invoiced: roundMoney(invoiced.total_invoiced),
      invoice_count: invoiced.invoice_count,
      total_paid: roundMoney(collected.total_paid),
      payment_count: collected.payment_count,
    },
    top_products: products.map((r) => ({
      product_id: Number(r.product_id),
      product_name: r.product_name,
      units_sold: Number(r.units_sold),
      revenue: roundMoney(r.revenue),
    })),
    top_customers: customers.map((r) => ({
      customer_id: Number(r.customer_id),
      customer_name: r.customer_name,
      total_invoiced: roundMoney(r.total_invoiced),
      invoice_count: r.invoice_count,
    })),
  };
}

module.exports = {
  getSalesReport,
};
