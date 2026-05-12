const { pool } = require("../../config/database");
const repo = require("./invoice.repo");

function roundMoney(n) {
  return Math.round(Number(n) * 100) / 100;
}

function buildInvoiceNumber(shopId) {
  return `INV-${shopId}-${Date.now()}`;
}

/**
 * @param {object} params
 * @param {number} params.shopId
 * @param {number} params.customerId
 * @param {Array<{ productId: number, quantity: number, price?: number }>} params.items
 */
async function createInvoice({ shopId, customerId, items }) {
  const customer = await repo.findCustomerInShop({ shopId, customerId });
  if (!customer) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }

  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error("items must be a non-empty array");
    err.statusCode = 400;
    throw err;
  }

  const normalized = items.map((it, idx) => {
    const productId = Number(it.productId);
    const quantity = Number(it.quantity);
    const price =
      it.price !== undefined && it.price !== null ? Number(it.price) : undefined;
    return { productId, quantity, price, _idx: idx };
  });

  for (const it of normalized) {
    if (!Number.isInteger(it.productId) || it.productId <= 0) {
      const err = new Error("Each item must have a valid productId");
      err.statusCode = 400;
      throw err;
    }
    if (!Number.isInteger(it.quantity) || it.quantity <= 0) {
      const err = new Error("Each item must have quantity > 0");
      err.statusCode = 400;
      throw err;
    }
    if (it.price !== undefined && (!Number.isFinite(it.price) || it.price < 0)) {
      const err = new Error("Item price must be a non-negative number when provided");
      err.statusCode = 400;
      throw err;
    }
  }

  normalized.sort((a, b) => a.productId - b.productId);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const linePrepared = [];
    let total = 0;

    for (const it of normalized) {
      const pr = await client.query(
        `SELECT id, price, stock
         FROM product
         WHERE id = $1 AND shop_id = $2
         FOR UPDATE`,
        [it.productId, shopId]
      );
      if (!pr.rows.length) {
        const err = new Error(`Product not found: ${it.productId}`);
        err.statusCode = 404;
        throw err;
      }
      const row = pr.rows[0];
      const unitPrice =
        it.price !== undefined ? roundMoney(it.price) : roundMoney(row.price);
      const lineTotal = roundMoney(it.quantity * unitPrice);
      total += lineTotal;

      if (row.stock < it.quantity) {
        const err = new Error(
          `Insufficient stock for product ${it.productId} (available ${row.stock})`
        );
        err.statusCode = 400;
        throw err;
      }

      linePrepared.push({
        productId: it.productId,
        quantity: it.quantity,
        price: unitPrice,
        total: lineTotal,
      });
    }

    total = roundMoney(total);
    const invoiceNumber = buildInvoiceNumber(shopId);

    const invRes = await client.query(
      `INSERT INTO invoice (shop_id, customer_id, invoice_number, total_amount, status)
       VALUES ($1, $2, $3, $4, 'unpaid')
       RETURNING id, shop_id, customer_id, invoice_number, total_amount, status, created_at`,
      [shopId, customerId, invoiceNumber, total]
    );
    const invoice = invRes.rows[0];
    const invoiceId = invoice.id;

    for (const line of linePrepared) {
      await client.query(
        `INSERT INTO invoice_item (invoice_id, product_id, quantity, price, total)
         VALUES ($1, $2, $3, $4, $5)`,
        [invoiceId, line.productId, line.quantity, line.price, line.total]
      );

      const up = await client.query(
        `UPDATE product
         SET stock = stock - $1
         WHERE id = $2 AND shop_id = $3 AND stock >= $1
         RETURNING id`,
        [line.quantity, line.productId, shopId]
      );
      if (up.rowCount !== 1) {
        const err = new Error(`Could not update stock for product ${line.productId}`);
        err.statusCode = 409;
        throw err;
      }
    }

    await client.query("COMMIT");

    const itemsOut = await repo.findItemsWithProduct({ invoiceId });
    const customerRow = await repo.findCustomerForShopById({
      shopId,
      customerId,
    });
    return {
      invoice: {
        ...invoice,
        customer_name: customerRow ? customerRow.name : null,
      },
      items: itemsOut,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function listInvoices({ shopId, limit, offset }) {
  return await repo.list({ shopId, limit, offset });
}

async function getInvoiceDetail({ shopId, id }) {
  const invoice = await repo.findByIdForShop({ shopId, id });
  if (!invoice) {
    return null;
  }
  const items = await repo.findItemsWithProduct({ invoiceId: id });
  return { invoice, items };
}

module.exports = {
  createInvoice,
  listInvoices,
  getInvoiceDetail,
};
