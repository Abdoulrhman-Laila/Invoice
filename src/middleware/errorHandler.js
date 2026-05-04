function notFoundHandler(req, res, next) {
  res.status(404).json({ message: "Not found" });
}

function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const env = process.env.NODE_ENV || "development";
  const message =
    status === 500 && env === "production"
      ? "Internal server error"
      : err.message || "Internal server error";

  if (env !== "production") {
    console.error(err);
  }
  res.status(status).json({ message });
}

module.exports = { notFoundHandler, errorHandler };
