require("./loadEnv");

const { Pool } = require("pg");
const parseConnectionString = require("pg-connection-string");

/**
 * في pg، إذا كانت كلمة المرور "" تُهمَل لأن val() يستخدم if (config.password)
 * فيصبح الحقل null فيتحطم SCRAM (typeof null !== 'string').
 * نضمن هنا كلمة مرور نصية غير فارغة عندما يطلب السيرفر SCRAM.
 */
function postgresPasswordFromEnv() {
  return (
    process.env.PGPASSWORD ||
    process.env.POSTGRES_PASSWORD ||
    process.env.DB_PASSWORD
  );
}

function resolvePassword(fromParsedUrl) {
  const fromEnv = postgresPasswordFromEnv();
  const raw =
    fromParsedUrl !== undefined && fromParsedUrl !== null && fromParsedUrl !== ""
      ? fromParsedUrl
      : fromEnv;
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    throw new Error(
      "PostgreSQL password missing: set PGPASSWORD in .env or include user:password in DATABASE_URL."
    );
  }
  return String(raw);
}

function resolveSsl(parsed) {
  if (process.env.PGSSL === "true") {
    return { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== "false" };
  }
  if (parsed && parsed.ssl !== undefined) {
    return parsed.ssl;
  }
  return false;
}

function buildPoolConfig() {
  if (process.env.DATABASE_URL) {
    const parsed = parseConnectionString(process.env.DATABASE_URL);
    const password = resolvePassword(parsed.password);
    const portRaw = parsed.port !== undefined && parsed.port !== "" ? parsed.port : process.env.PGPORT;
    const port = Number(portRaw) || 5432;

    return {
      user: parsed.user || process.env.PGUSER || "postgres",
      host: parsed.host || process.env.PGHOST || "localhost",
      port,
      database: parsed.database || process.env.PGDATABASE || "invoice_db",
      password,
      ssl: resolveSsl(parsed),
    };
  }

  const host = process.env.PGHOST || "localhost";
  const port = Number(process.env.PGPORT) || 5432;
  const database = process.env.PGDATABASE || "invoice_db";
  const user = process.env.PGUSER || "postgres";
  const password = resolvePassword(undefined);

  return {
    host,
    port,
    database,
    user,
    password,
    ssl: resolveSsl(null),
  };
}

const pool = new Pool(buildPoolConfig());

pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err.message);
});

async function testConnection() {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  testConnection,
};
