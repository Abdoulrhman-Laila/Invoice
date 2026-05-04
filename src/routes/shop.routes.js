const express = require("express");
const controller = require("../controllers/shop.controller");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.use(authRequired);

router.get("/me", controller.getMe);
router.patch("/me", controller.patchMe);
router.patch("/me/password", controller.patchPassword);

module.exports = router;
