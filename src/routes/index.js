const express = require("express");
const router = express.Router();
const authRoutes = require("./auth.routes");
const customerRoutes = require("./customer.routes");
const productRoutes = require("./product.routes");
const invoiceRoutes = require("./invoice.routes");
const reportRoutes = require("./report.routes");
const shopRoutes = require("./shop.routes");

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/shop", shopRoutes);
router.use("/customers", customerRoutes);
router.use("/products", productRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/reports", reportRoutes);

module.exports = router;
