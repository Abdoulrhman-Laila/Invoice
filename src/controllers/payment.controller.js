const paymentService = require("../modules/payment/payment.service");

function asPositiveInt(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function asPositiveAmount(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function addToInvoice(req, res, next) {
  try {
    const shopId = req.shopId;
    const invoiceId = asPositiveInt(req.params.id);
    if (!invoiceId) {
      return res.status(400).json({ message: "Invalid invoice id" });
    }

    const { amount, method, paidAt } = req.body || {};
    const amt = asPositiveAmount(amount);
    if (!amt) {
      return res.status(400).json({ message: "amount is required and must be positive" });
    }

    const result = await paymentService.addPayment({
      shopId,
      invoiceId,
      amount: amt,
      method: typeof method === "string" && method.trim() ? method.trim() : undefined,
      paidAt,
    });

    return res.status(201).json(result);
  } catch (err) {
    const code = err.statusCode || 500;
    if (code >= 400 && code < 500) {
      return res.status(code).json({ message: err.message });
    }
    return next(err);
  }
}

async function listForInvoice(req, res, next) {
  try {
    const shopId = req.shopId;
    const invoiceId = asPositiveInt(req.params.id);
    if (!invoiceId) {
      return res.status(400).json({ message: "Invalid invoice id" });
    }

    const result = await paymentService.listPaymentsForInvoice({
      shopId,
      invoiceId,
    });
    if (!result) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  addToInvoice,
  listForInvoice,
};
