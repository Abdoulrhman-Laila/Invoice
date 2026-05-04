const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const shopRepo = require("../shop/shop.repo");

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env var: ${name}`);
  }
  return v;
}

function signToken(payload) {
  const secret = requireEnv("JWT_SECRET");
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

async function registerShop({ name, email, password, phone }) {
  const existing = await shopRepo.findByEmail(email);
  if (existing) {
    const err = new Error("Email already in use");
    err.statusCode = 409;
    throw err;
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const shop = await shopRepo.create({
    name,
    email,
    passwordHash,
    phone: phone || null,
  });

  // التسجيل لا يعيد توكن؛ التوكن فقط من login
  return { shop };
}

async function loginShop({ email, password }) {
  const shop = await shopRepo.findByEmail(email);
  if (!shop) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, shop.password);
  if (!ok) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const token = signToken({ shopId: shop.id });
  return { shop, token };
}

module.exports = {
  registerShop,
  loginShop,
};

