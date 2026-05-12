const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const invoiceRepo = require("./invoice.repo");
const shopRepo = require("../shop/shop.repo");
const {
  PdfBrowserUnavailableError,
  PdfRenderFailedError,
} = require("./invoicePdf.errors");

const PDF_OPERATION_TIMEOUT_MS = Math.max(
  5_000,
  Number(process.env.PDF_OPERATION_TIMEOUT_MS) || 45_000
);
const PDF_MAX_CONCURRENT = Math.max(
  1,
  Math.min(20, Number(process.env.PDF_MAX_CONCURRENT) || 4)
);

let browserPromise;

/** @type {Promise<void>[]} */
const waitQueue = [];
let activePdfJobs = 0;

function useRemoteFonts() {
  const v = process.env.PDF_USE_REMOTE_FONTS;
  if (v === undefined || v === "") return true;
  return !["0", "false", "no", "off"].includes(String(v).toLowerCase());
}

function findChromeExecutable() {
  const fromEnv =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.GOOGLE_CHROME_BIN ||
    process.env.CHROME_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv;
  }

  const candidates = [];
  if (process.platform === "win32") {
    const pf = process.env.PROGRAMFILES || "C:\\Program Files";
    const pf86 =
      process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
    const local = process.env.LOCALAPPDATA || "";
    candidates.push(
      path.join(pf, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(pf86, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(local, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(pf, "Microsoft", "Edge", "Application", "msedge.exe"),
      path.join(pf86, "Microsoft", "Edge", "Application", "msedge.exe")
    );
  } else if (process.platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
    );
  } else {
    candidates.push(
      "/usr/bin/google-chrome-stable",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/snap/bin/chromium"
    );
  }

  for (const p of candidates) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function isTimeoutLikeError(err) {
  if (!err) return false;
  if (err.name === "TimeoutError") return true;
  const m = String(err.message || "");
  return /timeout|timed out|Navigation timeout/i.test(m);
}

async function acquirePdfSlot() {
  if (activePdfJobs < PDF_MAX_CONCURRENT) {
    activePdfJobs += 1;
    return;
  }
  await new Promise((resolve) => {
    waitQueue.push(resolve);
  });
  activePdfJobs += 1;
}

function releasePdfSlot() {
  activePdfJobs -= 1;
  const next = waitQueue.shift();
  if (next) next();
}

async function withPdfConcurrency(fn) {
  await acquirePdfSlot();
  try {
    return await fn();
  } finally {
    releasePdfSlot();
  }
}

async function getBrowser() {
  if (!browserPromise) {
    const executablePath = findChromeExecutable();
    if (!executablePath) {
      throw new PdfBrowserUnavailableError(
        "لم يُعثر على Chrome أو Edge لإنشاء PDF."
      );
    }
    const launchOpts = {
      executablePath,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-extensions",
        "--disable-background-networking",
      ],
    };
    browserPromise = puppeteer.launch(launchOpts).catch((err) => {
      browserPromise = null;
      throw new PdfBrowserUnavailableError("تعذر تشغيل متصفح PDF.", {
        cause: err,
      });
    });
  }
  return browserPromise;
}

function fontHeadLinks() {
  if (!useRemoteFonts()) {
    return "";
  }
  return `<link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap" rel="stylesheet" />`;
}

function bodyFontFamilyCss() {
  if (useRemoteFonts()) {
    return `"Noto Sans Arabic", "Segoe UI", Tahoma, system-ui, sans-serif`;
  }
  return `"Segoe UI", Tahoma, "Noto Sans Arabic", "Noto Sans", "DejaVu Sans", "Arial Unicode MS", system-ui, sans-serif`;
}

function buildInvoiceHtml({ shop, customer, invoice, items }) {
  const shopName = shop ? shop.name : "";
  const custName = customer ? customer.name : `#${invoice.customer_id}`;
  const custPhone = customer && customer.phone ? escapeHtml(customer.phone) : "";
  const created = invoice.created_at
    ? new Date(invoice.created_at).toLocaleString("ar")
    : "";

  const rows = items
    .map((row) => {
      const name = escapeHtml(row.product_name || `#${row.product_id}`);
      return `<tr>
        <td>${name}</td>
        <td>${escapeHtml(String(row.quantity))}</td>
        <td>${escapeHtml(formatMoney(row.price))}</td>
        <td>${escapeHtml(formatMoney(row.total))}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${fontHeadLinks()}
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: ${bodyFontFamilyCss()};
      margin: 0;
      padding: 24px;
      color: #111;
      background: #fff;
      -webkit-font-smoothing: antialiased;
    }
    h1 { text-align: center; font-size: 1.6rem; margin: 0 0 20px; }
    .meta { margin: 0 0 16px; line-height: 1.9; }
    .meta div { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .label { color: #444; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #ccc; padding: 10px 8px; text-align: right; vertical-align: top; }
    th { background: #f3f4f6; font-weight: 700; }
    tfoot td { font-weight: 700; border-top-width: 2px; }
    .total { text-align: left; }
  </style>
</head>
<body>
  <h1>فاتورة مبيعات</h1>
  <section class="meta">
    <div><span class="label">المتجر</span><span>${escapeHtml(shopName)}</span></div>
    <div><span class="label">العميل</span><span>${escapeHtml(custName)}</span></div>
    ${
      custPhone
        ? `<div><span class="label">الهاتف</span><span>${custPhone}</span></div>`
        : ""
    }
    <div><span class="label">رقم الفاتورة</span><span>${escapeHtml(
      invoice.invoice_number
    )}</span></div>
    <div><span class="label">التاريخ</span><span>${escapeHtml(
      created
    )}</span></div>
    <div><span class="label">الحالة</span><span>${escapeHtml(
      statusAr(invoice.status)
    )}</span></div>
  </section>

  <table>
    <thead>
      <tr>
        <th>المنتج</th>
        <th>الكمية</th>
        <th>سعر الوحدة</th>
        <th>الإجمالي</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3" class="total">المجموع</td>
        <td>${escapeHtml(formatMoney(invoice.total_amount))}</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;
}

/**
 * PDF عبر Chromium + HTML (RTL للعربية عبر lang/dir + خطوط عربية).
 * @returns {Promise<{ buffer: Buffer, filename: string } | null>}
 */
async function buildInvoicePdf({ shopId, invoiceId }) {
  return withPdfConcurrency(async () => {
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

    const html = buildInvoiceHtml({ shop, customer, invoice, items });
    const browser = await getBrowser();
    const page = await browser.newPage();

    page.setDefaultTimeout(PDF_OPERATION_TIMEOUT_MS);
    page.setDefaultNavigationTimeout(PDF_OPERATION_TIMEOUT_MS);

    try {
      await page.setContent(html, {
        waitUntil: "domcontentloaded",
        timeout: PDF_OPERATION_TIMEOUT_MS,
      });
      if (useRemoteFonts()) {
        await page.evaluate(() => document.fonts.ready).catch(() => {});
      }

      const buffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "16mm", right: "12mm", bottom: "16mm", left: "12mm" },
      });

      const filename = `${safeFileName(invoice.invoice_number)}.pdf`;
      return { buffer, filename };
    } catch (err) {
      if (isTimeoutLikeError(err)) {
        throw new PdfRenderFailedError("انتهت مهلة إنشاء PDF.", { cause: err });
      }
      throw err;
    } finally {
      await page.close().catch(() => {});
    }
  });
}

/**
 * إغلاق متصفح Puppeteer عند إيقاف العملية (SIGTERM / SIGINT).
 */
async function shutdownPdfBrowser() {
  if (!browserPromise) {
    return;
  }
  try {
    const browser = await browserPromise;
    await browser.close();
  } catch (_) {
    // يتجاهل إن كان الإغلاق قد تم أو فشل التشغيل
  } finally {
    browserPromise = null;
  }
}

module.exports = {
  buildInvoicePdf,
  shutdownPdfBrowser,
};
