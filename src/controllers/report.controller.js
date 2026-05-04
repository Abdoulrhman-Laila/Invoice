const reportService = require("../modules/report/report.service");

function asPositiveInt(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function sales(req, res, next) {
  try {
    const shopId = req.shopId;
    const { from, to, top } = req.query || {};
    const topN = asPositiveInt(top) || 10;

    const report = await reportService.getSalesReport({
      shopId,
      from: typeof from === "string" ? from : undefined,
      to: typeof to === "string" ? to : undefined,
      top: topN,
    });

    return res.json(report);
  } catch (err) {
    const code = err.statusCode || 500;
    if (code >= 400 && code < 500) {
      return res.status(code).json({ message: err.message });
    }
    return next(err);
  }
}

module.exports = {
  sales,
};
