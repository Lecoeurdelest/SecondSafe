const express = require("express");
const cors = require("cors");
const path = require("path");
const routes = require("./routes");
const { errorHandler, notFoundHandler } = require("./common/middlewares/error.middleware");

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  })
);

// Increase body size limit to handle larger payloads.
// Default (~100kb) is too small for large base64 uploads; 50mb is safe for dev.
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Mount API routes
app.use("/api", routes);
app.use("/api", notFoundHandler);
app.use(errorHandler);

module.exports = app;