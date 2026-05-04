const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const ArabicReshaper = require("arabic-reshaper");

const invoiceRepo = require("./invoice.repo");
const shopRepo = require("../shop/shop.repo");

const FONT_PATH = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "assets",
  "fonts",
  "NotoSansArabic-Regular.ttf"
);

const MARGIN = 40;
const PAGE_WIDTH = 595.28;
const COL_W = PAGE_WIDTH - MARGIN * 2;

function ar(text) {
  if (text === undefined || text === null) {
    return "";
  }
  return ArabicReshaper.convertArabic(String(text));
}

function formatMoney(n) {
  return Number(n).toFixed(2);
}

function statusAr(status) {
  const map = {
    unpaid: "غير مدفوع",
    partial: "جزئي",
    paid: "مدفوع",
  };
  return map[status] || String(status);
}

function safeFileName(s) {
  const base = String(s || "invoice").replace(/[<>:"/\\|?*\x00-\x1f]+/g, "_");
  return base.slice(0, 100) || "invoice";
}

/**
 * @returns {Promise<{ buffer: Buffer, filename: string } | null>}
 */
async function buildInvoicePdf({ shopId, invoiceId }) {
  const invoice = await invoiceRepo.findByIdForShop({ shopId, id: invoiceId });
  if (!invoice) {
    return null;
  }

  const [items, shop, customer] = await Promise.all([
    invoiceRepo.findItemsWithProduct({ invoiceId: invoiceId }),
    shopRepo.findById(shopId),
    invoiceRepo.findCustomerForShopById({
      shopId,
      customerId: invoice.customer_id,
    }),
  ]);

  if (!fs.existsSync(FONT_PATH)) {
    const err = new Error(
      `Missing Arabic font file. Place NotoSansArabic-Regular.ttf at: ${FONT_PATH}`
    );
    err.statusCode = 500;
    throw err;
  }

  const buffer = await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGIN });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.registerFont("Ar", FONT_PATH);
    doc.font("Ar");

    let y = MARGIN;

    doc
      .font("Ar")
      .fontSize(20)
      .text(ar("فاتورة مبيعات"), MARGIN, y, {
        width: COL_W,
        align: "center",
      });
    y += 36;

    doc.fontSize(11);
    const shopLine = shop ? `${shop.name}` : `#${shopId}`;
    doc.text(ar(`المتجر: ${shopLine}`), MARGIN, y, {
      width: COL_W,
      align: "right",
    });
    y += 18;

    const custName = customer ? customer.name : `#${invoice.customer_id}`;
    doc.text(ar(`العميل: ${custName}`), MARGIN, y, {
      width: COL_W,
      align: "right",
    });
    y += 18;

    if (customer && customer.phone) {
      doc.text(ar(`الهاتف: ${customer.phone}`), MARGIN, y, {
        width: COL_W,
        align: "right",
      });
      y += 18;
    }

    doc.text(ar(`رقم الفاتورة: ${invoice.invoice_number}`), MARGIN, y, {
      width: COL_W,
      align: "right",
    });
    y += 18;

    const created = invoice.created_at
      ? new Date(invoice.created_at).toLocaleString("ar")
      : "";
    doc.text(ar(`التاريخ: ${created}`), MARGIN, y, {
      width: COL_W,
      align: "right",
    });
    y += 18;

    doc.text(ar(`الحالة: ${statusAr(invoice.status)}`), MARGIN, y, {
      width: COL_W,
      align: "right",
    });
    y += 24;

    const wTot = 62;
    const wPrice = 62;
    const wQty = 44;
    const wName = COL_W - wTot - wPrice - wQty - 12;
    const rightEdge = PAGE_WIDTH - MARGIN;

    doc.fontSize(10).fillColor("#333333");
    doc.text(ar("البنود"), MARGIN, y, { width: COL_W, align: "right" });
    y += 16;
    doc.fillColor("#000000");

    const rowH = 18;
    doc.fontSize(9);
    let xh = rightEdge - wTot;
    doc.text(ar("الإجمالي"), xh, y, { width: wTot, align: "right" });
    xh -= wPrice;
    doc.text(ar("السعر"), xh, y, { width: wPrice, align: "right" });
    xh -= wQty;
    doc.text(ar("الكمية"), xh, y, { width: wQty, align: "right" });
    xh -= wName;
    doc.text(ar("المنتج"), xh, y, { width: wName, align: "right" });
    y += rowH;

    doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke();
    y += 6;

    doc.fontSize(10);
    for (const row of items) {
      if (y > 720) {
        doc.addPage();
        doc.font("Ar");
        y = MARGIN;
      }
      const name = row.product_name || `#${row.product_id}`;
      let x = rightEdge - wTot;
      doc.text(formatMoney(row.total), x, y, { width: wTot, align: "right" });
      x -= wPrice;
      doc.text(formatMoney(row.price), x, y, { width: wPrice, align: "right" });
      x -= wQty;
      doc.text(String(row.quantity), x, y, { width: wQty, align: "right" });
      x -= wName;
      doc.text(ar(name), x, y, { width: wName, align: "right" });
      y += rowH;
    }

    y += 10;
    doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke();
    y += 14;

    doc.fontSize(12);
    doc.text(
      ar(`المجموع: ${formatMoney(invoice.total_amount)}`),
      MARGIN,
      y,
      { width: COL_W, align: "right" }
    );

    doc.end();
  });

  const filename = `${safeFileName(invoice.invoice_number)}.pdf`;
  return { buffer, filename };
}

module.exports = {
  buildInvoicePdf,
};
