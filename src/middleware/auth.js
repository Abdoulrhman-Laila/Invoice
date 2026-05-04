const jwt = require("jsonwebtoken");

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    const err = new Error(`Missing env var: ${name}`);
    err.statusCode = 500;
    throw err;
  }
  return v;
}

function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({ message: "Missing Bearer token" });
    }

    const secret = requireEnv("JWT_SECRET");
    const payload = jwt.verify(token, secret);

    const shopId = Number(payload && payload.shopId);
    if (!Number.isInteger(shopId) || shopId <= 0) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.shopId = shopId;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = {
  authRequired,
};

