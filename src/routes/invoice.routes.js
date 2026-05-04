const express = require("express");
const controller = require("../controllers/invoice.controller");
const paymentController = require("../controllers/payment.controller");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.use(authRequired);

router.get("/", controller.list);
router.post("/", controller.create);

router.post("/:id/payments", paymentController.addToInvoice);
router.get("/:id/payments", paymentController.listForInvoice);

router.get("/:id/pdf", controller.downloadPdf);
router.get("/:id", controller.getById);

module.exports = router;
