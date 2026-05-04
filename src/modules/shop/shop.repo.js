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

module.exports = {
  findByEmail,
  create,
  findById,
};

