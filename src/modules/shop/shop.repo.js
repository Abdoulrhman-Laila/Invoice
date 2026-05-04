const { pool } = require("../../config/database");

async function findByEmail(email) {
  const res = await pool.query(
    `SELECT id, name, email, password, phone, created_at
     FROM shop
     WHERE email = $1
     LIMIT 1`,
    [email]
  );
  return res.rows[0] || null;
}

async function create({ name, email, passwordHash, phone }) {
  const res = await pool.query(
    `INSERT INTO shop (name, email, password, phone)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, phone, created_at`,
    [name, email, passwordHash, phone]
  );
  return res.rows[0];
}

async function findById(id) {
  const res = await pool.query(
    `SELECT id, name, email, phone, created_at
     FROM shop
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return res.rows[0] || null;
}

async function findPasswordRowById(id) {
  const res = await pool.query(
    `SELECT id, password FROM shop WHERE id = $1 LIMIT 1`,
    [id]
  );
  return res.rows[0] || null;
}

async function updateById(id, patch) {
  const fields = [];
  const values = [];
  let i = 1;

  if (patch.name !== undefined) {
    fields.push(`name = $${i++}`);
    values.push(patch.name);
  }
  if (patch.phone !== undefined) {
    fields.push(`phone = $${i++}`);
    values.push(patch.phone);
  }

  if (fields.length === 0) {
    return await findById(id);
  }

  values.push(id);
  const res = await pool.query(
    `UPDATE shop SET ${fields.join(", ")}
     WHERE id = $${i}
     RETURNING id, name, email, phone, created_at`,
    values
  );
  return res.rows[0] || null;
}

async function updatePasswordById(id, passwordHash) {
  await pool.query(`UPDATE shop SET password = $1 WHERE id = $2`, [
    passwordHash,
    id,
  ]);
}

module.exports = {
  findByEmail,
  create,
  findById,
  findPasswordRowById,
  updateById,
  updatePasswordById,
};

