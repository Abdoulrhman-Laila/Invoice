const authService = require("../modules/auth/auth.service");

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function sanitizeShop(shop) {
  if (!shop) return shop;
  const { password, ...safe } = shop;
  return safe;
}

async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body || {};

    if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: "name, email, password are required" });
    }

    const result = await authService.registerShop({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: isNonEmptyString(phone) ? phone.trim() : null,
    });

    return res.status(201).json({ shop: sanitizeShop(result.shop) });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const result = await authService.loginShop({
      email: email.trim().toLowerCase(),
      password,
    });

    return res.status(200).json({ shop: sanitizeShop(result.shop), token: result.token });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  register,
  login,
};

