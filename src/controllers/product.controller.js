const productService = require("../modules/product/product.service");

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function asPositiveInt(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function asNonNegativeNumber(v) {
  if (v === undefined || v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function asNonNegativeIntOrZero(v) {
  const n = asNonNegativeNumber(v);
  if (n === undefined) return undefined;
  if (n === null) return null;
  return Number.isInteger(n) ? n : Math.trunc(n);
}

async function create(req, res, next) {
  try {
    const shopId = req.shopId;
    const { name, price, stock } = req.body || {};

    if (!isNonEmptyString(name)) {
      return res.status(400).json({ message: "name is required" });
    }

    const p = asNonNegativeNumber(price);
    const s = stock === undefined ? 0 : asNonNegativeIntOrZero(stock);
    if (p === null || s === null) {
      return res.status(400).json({ message: "price and stock must be non-negative numbers" });
    }

    const product = await productService.createProduct({
      shopId,
      name: name.trim(),
      price: p === undefined ? 0 : p,
      stock: s,
    });

    return res.status(201).json({ product });
  } catch (err) {
    if (err && err.code === "23505") {
      return res.status(409).json({ message: "Product name already exists" });
    }
    return next(err);
  }
}

async function list(req, res, next) {
  try {
    const shopId = req.shopId;
    const limit = Math.min(asPositiveInt(req.query.limit) || 50, 200);
    const offset = asPositiveInt(req.query.offset) || 0;
    const q = isNonEmptyString(req.query.q) ? String(req.query.q).trim() : null;

    const products = await productService.listProducts({ shopId, limit, offset, q });
    return res.json({ products, limit, offset });
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const shopId = req.shopId;
    const id = asPositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const product = await productService.getProductById({ shopId, id });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json({ product });
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const shopId = req.shopId;
    const id = asPositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const patch = {};
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "name")) {
      if (!isNonEmptyString(req.body.name)) {
        return res.status(400).json({ message: "name must be a non-empty string" });
      }
      patch.name = req.body.name.trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "price")) {
      const p = asNonNegativeNumber(req.body.price);
      if (p === null) {
        return res.status(400).json({ message: "price must be a non-negative number" });
      }
      patch.price = p;
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "stock")) {
      const s = asNonNegativeIntOrZero(req.body.stock);
      if (s === null) {
        return res.status(400).json({ message: "stock must be a non-negative number" });
      }
      patch.stock = s;
    }

    const product = await productService.updateProduct({ shopId, id, patch });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json({ product });
  } catch (err) {
    if (err && err.code === "23505") {
      return res.status(409).json({ message: "Product name already exists" });
    }
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const shopId = req.shopId;
    const id = asPositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const ok = await productService.deleteProduct({ shopId, id });
    if (!ok) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
};

