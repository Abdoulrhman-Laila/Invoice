const express = require("express");
const cors = require("cors"); // ✅ أضف هذا

const routes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

// ✅ CORS لازم يكون هون
app.use(cors({
  origin: "http://localhost:8081",
  credentials: true
}));

app.use(express.json());

// routes
app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;