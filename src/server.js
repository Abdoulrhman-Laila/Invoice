require("./config/loadEnv");

const app = require("./app");
const { testConnection } = require("./config/database");

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);

  try {
    await testConnection();
    console.log("DB connected successfully");
  } catch (err) {
    console.error("DB connection failed:", err.message);
  }
});