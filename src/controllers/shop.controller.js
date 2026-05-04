const shopService = require("../modules/shop/shop.service");

async function getMe(req, res, next) {
  try {
    const shop = await shopService.getShopProfile(req.shopId);
    return res.json({ shop });
  } catch (err) {
    const code = err.statusCode || 500;
    if (code >= 400 && code < 500) {
      return res.status(code).json({ message: err.message });
    }
    return next(err);
  }
}

async function patchMe(req, res, next) {
  try {
    const { name, phone } = req.body || {};
    const shop = await shopService.updateShopProfile(req.shopId, { name, phone });
    return res.json({ shop });
  } catch (err) {
    const code = err.statusCode || 500;
    if (code >= 400 && code < 500) {
      return res.status(code).json({ message: err.message });
    }
    return next(err);
  }
}

async function patchPassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    await shopService.changeShopPassword(
      req.shopId,
      currentPassword,
      newPassword
    );
    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    const code = err.statusCode || 500;
    if (code >= 400 && code < 500) {
      return res.status(code).json({ message: err.message });
    }
    return next(err);
  }
}

module.exports = {
  getMe,
  patchMe,
  patchPassword,
};
