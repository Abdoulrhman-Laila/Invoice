const express = require("express");
const controller = require("../controllers/report.controller");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.use(authRequired);

router.get("/sales", controller.sales);

module.exports = router;
