require("./config/loadEnv");

const http = require("http");
const app = require("./app");
const { testConnection } = require("./config/database");
const invoicePdfService = require("./modules/invoice/invoicePdf.service");

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer(app);

let shuttingDown = false;

async function gracefulShutdown(signal) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  console.log(`${signal}: closing HTTP server and PDF browser...`);
  try {
    await invoicePdfService.shutdownPdfBrowser();
  } catch (e) {
    console.error("PDF browser shutdown:", e && e.message ? e.message : e);
  }
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => {
  gracefulShutdown("SIGTERM").catch(() => process.exit(1));
});
process.on("SIGINT", () => {
  gracefulShutdown("SIGINT").catch(() => process.exit(1));
});

server.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);

  try {
    await testConnection();
    console.log("DB connected successfully");
  } catch (err) {
    console.error("DB connection failed:", err.message);
  }
});