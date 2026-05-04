require("../config/loadEnv");

const fs = require("fs");
const path = require("path");
const { pool } = require("../config/database");

const MIGRATIONS_DIR = path.join(__dirname, "..", "..", "migrations");
const MIGRATIONS_TABLE = "schema_migrations";

function parseArgs(argv) {
  return {
    status: argv.includes("--status"),
  };
}

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations() {
  const res = await pool.query(`SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY name ASC`);
  return new Set(res.rows.map((r) => r.name));
}

function listMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d+.*\.sql$/i.test(f))
    .sort((a, b) => a.localeCompare(b));
}

async function applyMigration(fileName) {
  const fullPath = path.join(MIGRATIONS_DIR, fileName);
  const sql = fs.readFileSync(fullPath, "utf8");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query(`INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`, [fileName]);
    await client.query("COMMIT");
    console.log(`Applied migration: ${fileName}`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  const allFiles = listMigrationFiles();
  const pending = allFiles.filter((f) => !applied.has(f));

  if (args.status) {
    console.log(`Migrations dir: ${MIGRATIONS_DIR}`);
    console.log(`Applied: ${applied.size}`);
    console.log(`Pending: ${pending.length}`);
    if (pending.length) {
      for (const f of pending) console.log(`- ${f}`);
    }
    return;
  }

  if (pending.length === 0) {
    console.log("No pending migrations.");
    return;
  }

  for (const fileName of pending) {
    await applyMigration(fileName);
  }
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error("Migration failed:", err.message);
    try {
      await pool.end();
    } catch {
      // ignore
    }
    process.exitCode = 1;
  });

