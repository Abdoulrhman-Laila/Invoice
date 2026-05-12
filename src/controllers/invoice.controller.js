const invoiceService = require("../modules/invoice/invoice.service");
const invoicePdfService = require("../modules/invoice/invoicePdf.service");

function asPositiveInt(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function create(req, res, next) {
  try {
    const shopId = req.shopId;
    const { customerId, items } = req.body || {};
    const cid = asPositiveInt(customerId);
    if (!cid) {
      return res.status(400).json({ message: "customerId is required" });
    }

    const result = await invoiceService.createInvoice({
      shopId,
      customerId: cid,
      items: items || [],
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

async function list(req, res, next) {
  try {
    const shopId = req.shopId;
    const limit = Math.min(asPositiveInt(req.query.limit) || 50, 200);
    const offset = asPositiveInt(req.query.offset) || 0;
    const invoices = await invoiceService.listInvoices({ shopId, limit, offset });
    return res.json({ invoices, limit, offset });
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const shopId = req.shopId;
    const id = asPositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const detail = await invoiceService.getInvoiceDetail({ shopId, id });
    if (!detail) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    return res.json(detail);
  } catch (err) {
    return next(err);
  }
}

async function downloadPdf(req, res, next) {
  try {
    const shopId = req.shopId;
    const id = asPositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const result = await invoicePdfService.buildInvoicePdf({
      shopId,
      invoiceId: id,
    });
    if (!result) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    const asciiName = result.filename.replace(/[^\x20-\x7E]/g, "_");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(
        result.filename
      )}`
    );
    res.send(result.buffer);
  } catch (err) {
    if (err && err.code === "MODULE_NOT_FOUND") {
      return res.status(503).json({
        message:
          "تعذر تحميل مكتبة PDF. نفّذ npm install في جذر المشروع ثم أعد تشغيل السيرفر.",
        code: "PDF_MODULE_MISSING",
      });
    }
    if (err && typeof err.code === "string" && err.code.startsWith("PDF_")) {
      const status = Number(err.statusCode) || 502;
      const body = {
        message: err.message,
        code: err.code,
      };
      if (err.hint) {
        body.hint = err.hint;
      }
      return res.status(status).json(body);
    }
    const msg = String(err && err.message ? err.message : "");
    if (
      msg.includes("Browser") ||
      msg.includes("Executable") ||
      msg.includes("Chromium") ||
      msg.includes("Failed to launch") ||
      msg.includes("لم يُعثر على Chrome")
    ) {
      return res.status(503).json({
        message: msg,
        code: "PDF_BROWSER_LEGACY",
        hint: "عيّن PUPPETEER_EXECUTABLE_PATH لمسار chrome.exe أو msedge.exe",
      });
    }
    return next(err);
  }
}

module.exports = {
  create,
  list,
  getById,
  downloadPdf,
};
