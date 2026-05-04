const customerService = require("../modules/customer/customer.service");

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function asNullableString(v) {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s.length ? s : null;
}

function asPositiveInt(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function create(req, res, next) {
  try {
    const shopId = req.shopId;
    const { name, phone, email, address } = req.body || {};

    if (!isNonEmptyString(name)) {
      return res.status(400).json({ message: "name is required" });
    }

    const customer = await customerService.createCustomer({
      shopId,
      name: name.trim(),
      phone: asNullableString(phone),
      email: asNullableString(email) ? asNullableString(email).toLowerCase() : asNullableString(email),
      address: asNullableString(address),
    });

    return res.status(201).json({ customer });
  } catch (err) {
    // unique email per shop
    if (err && err.code === "23505") {
      return res.status(409).json({ message: "Customer email already exists" });
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

    const customers = await customerService.listCustomers({ shopId, limit, offset, q });
    return res.json({ customers, limit, offset });
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

    const customer = await customerService.getCustomerById({ shopId, id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.json({ customer });
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
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "phone")) {
      patch.phone = asNullableString(req.body.phone);
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "email")) {
      const e = asNullableString(req.body.email);
      patch.email = e ? e.toLowerCase() : e;
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "address")) {
      patch.address = asNullableString(req.body.address);
    }

    const customer = await customerService.updateCustomer({ shopId, id, patch });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.json({ customer });
  } catch (err) {
    if (err && err.code === "23505") {
      return res.status(409).json({ message: "Customer email already exists" });
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

    const ok = await customerService.deleteCustomer({ shopId, id });
    if (!ok) {
      return res.status(404).json({ message: "Customer not found" });
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

