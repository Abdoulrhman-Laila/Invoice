/**
 * أخطاء تصدير PDF — تُربَط بـ HTTP في الـ controller عبر code + statusCode.
 */
class PdfExportError extends Error {
  /**
   * @param {string} message
   * @param {{ statusCode?: number, code?: string, hint?: string, cause?: Error }} [opts]
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = "PdfExportError";
    this.statusCode = opts.statusCode ?? 503;
    this.code = opts.code ?? "PDF_EXPORT_ERROR";
    if (opts.hint) this.hint = opts.hint;
    if (opts.cause) this.cause = opts.cause;
  }
}

class PdfBrowserUnavailableError extends PdfExportError {
  constructor(message, opts = {}) {
    super(message, {
      statusCode: 503,
      code: "PDF_BROWSER_UNAVAILABLE",
      hint:
        opts.hint ??
        "ثبّت Chrome أو Edge على السيرفر، أو عيّن PUPPETEER_EXECUTABLE_PATH لمسار chrome.exe أو msedge.exe",
      cause: opts.cause,
    });
    this.name = "PdfBrowserUnavailableError";
  }
}

class PdfRenderFailedError extends PdfExportError {
  constructor(message, opts = {}) {
    super(message, {
      statusCode: 502,
      code: "PDF_RENDER_FAILED",
      hint: opts.hint,
      cause: opts.cause,
    });
    this.name = "PdfRenderFailedError";
  }
}

module.exports = {
  PdfExportError,
  PdfBrowserUnavailableError,
  PdfRenderFailedError,
};
