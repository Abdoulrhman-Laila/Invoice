const bcrypt = require("bcrypt");
const shopRepo = require("./shop.repo");

async function getShopProfile(shopId) {
  const shop = await shopRepo.findById(shopId);
  if (!shop) {
    const err = new Error("Shop not found");
    err.statusCode = 404;
    throw err;
  }
  return shop;
}

async function updateShopProfile(shopId, { name, phone }) {
  const patch = {};
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      const err = new Error("name must be a non-empty string");
      err.statusCode = 400;
      throw err;
    }
    patch.name = name.trim();
  }
  if (phone !== undefined) {
    if (phone === null) {
      patch.phone = null;
    } else if (typeof phone === "string") {
      const t = phone.trim();
      patch.phone = t.length ? t : null;
    } else {
      const err = new Error("phone must be a string or null");
      err.statusCode = 400;
      throw err;
    }
  }

  if (Object.keys(patch).length === 0) {
    return await getShopProfile(shopId);
  }

  const updated = await shopRepo.updateById(shopId, patch);
  if (!updated) {
    const err = new Error("Shop not found");
    err.statusCode = 404;
    throw err;
  }
  return updated;
}

async function changeShopPassword(shopId, currentPassword, newPassword) {
  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    !newPassword.trim()
  ) {
    const err = new Error("currentPassword and newPassword are required");
    err.statusCode = 400;
    throw err;
  }

  if (newPassword.length < 6) {
    const err = new Error("newPassword must be at least 6 characters");
    err.statusCode = 400;
    throw err;
  }

  const row = await shopRepo.findPasswordRowById(shopId);
  if (!row) {
    const err = new Error("Shop not found");
    err.statusCode = 404;
    throw err;
  }

  const ok = await bcrypt.compare(currentPassword, row.password);
  if (!ok) {
    const err = new Error("Current password is incorrect");
    err.statusCode = 401;
    throw err;
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);
  await shopRepo.updatePasswordById(shopId, passwordHash);
}

module.exports = {
  getShopProfile,
  updateShopProfile,
  changeShopPassword,
};
