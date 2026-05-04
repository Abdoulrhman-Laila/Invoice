const { pool } = require("../../config/database");

async function create({ shopId, name, price, stock }) {
  const res = await pool.query(
    `INSERT INTO product (shop_id, name, price, stock)
     VALUES ($1, $2, $3, $4)
     RETURNING id, shop_id, name, price, stock, created_at`,
    [shopId, name, price, stock]
  );
  return res.rows[0];
}

async function list({ shopId, limit = 50, offset = 0, q }) {
  const params = [shopId];
  let where = "WHERE shop_id = $1";

  if (q) {
    params.push(`%${q}%`);
    where += ` AND name ILIKE $${params.length}`;
  }

  params.push(limit);
  params.push(offset);

  const res = await pool.query(
    `SELECT id, shop_id, name, price, stock, created_at
     FROM product
     ${where}
     ORDER BY id DESC
     LIMIT $${params.length - 1}
     OFFSET $${params.length}`,
    params
  );
  return res.rows;
}

async function findById({ shopId, id }) {
  const res = await pool.query(
    `SELECT id, shop_id, name, price, stock, created_at
     FROM product
     WHERE shop_id = $1 AND id = $2
     LIMIT 1`,
    [shopId, id]
  );
  return res.rows[0] || null;
}

async function updateById({ shopId, id, patch }) {
  const fields = [];
  const values = [];

  const allowed = ["name", "price", "stock"];
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      fields.push(`${key} = $${fields.length + 1}`);
      values.push(patch[key]);
    }
  }

  if (fields.length === 0) {
    return await findById({ shopId, id });
  }

  values.push(shopId);
  values.push(id);

  const res = await pool.query(
    `UPDATE product
     SET ${fields.join(", ")}
     WHERE shop_id = $${values.length - 1} AND id = $${values.length}
     RETURNING id, shop_id, name, price, stock, created_at`,
    values
  );
  return res.rows[0] || null;
}

async function deleteById({ shopId, id }) {
  const res = await pool.query(
    `DELETE FROM product
     WHERE shop_id = $1 AND id = $2
     RETURNING id`,
    [shopId, id]
  );
  return Boolean(res.rows[0]);
}

module.exports = {
  create,
  list,
  findById,
  updateById,
  deleteById,
};

