import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import connectToDB from "./database/mongodb.js";
import { CLIENT_ORIGIN, PORT } from "./config/env.js";
import productRoutes from "./routes/product.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import { requireAuth } from "./middlewares/auth.middleware.js";

const app = express();
const origins = (
  CLIENT_ORIGIN ||
  "https://credit-stock.vercel.app,http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
)
  .split(",")
  .map((value) => value.trim().replace(/\/+$/, ""))
  .filter(Boolean);
app.use(cors({ origin: origins, credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    if (req.get("origin") && !origins.includes(req.get("origin")))
      return res
        .status(403)
        .json({ message: "Request origin is not allowed." });
    if (
      req.get("sec-fetch-site") === "cross-site" &&
      !origins.includes(req.get("origin"))
    )
      return res
        .status(403)
        .json({ message: "Cross-site requests are not allowed." });
    if (!req.is("application/json"))
      return res
        .status(415)
        .json({ message: "Use application/json for requests." });
  }
  next();
});
app.get("/", (_req, res) =>
  res.json({
    status: "ok",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  }),
);
app.use("/api/auth", authRoutes);
app.get("/api/health", (_req, res) =>
  res.json({
    status: "ok",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  }),
);
app.use("/api/products", requireAuth, productRoutes);
app.use("/api/customers", requireAuth, customerRoutes);
app.use("/api/transactions", requireAuth, transactionRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.name === "ValidationError")
    return res.status(400).json({ message: error.message });
  if (error.name === "CastError")
    return res.status(400).json({ message: "Invalid record ID" });
  if (error.code === 11000)
    return res.status(409).json({
      message: error.keyPattern?.email
        ? "An account with this email already exists. Please sign in."
        : "SKU already exists",
    });
  if (error.type === "entity.parse.failed")
    return res.status(400).json({ message: "Invalid JSON body" });
  if (error.status === 413)
    return res.status(413).json({ message: "Request is too large" });
  console.error(error);
  res.status(500).json({ message: "Something went wrong on the server" });
});
if (process.env.NODE_ENV !== "test") {
  connectToDB()
    .then(() =>
      app.listen(PORT || 5000, () => console.log("CreditStock API ready")),
    )
    .catch(() => {
      console.error("Unable to start: database connection failed");
      process.exitCode = 1;
    });
}
export default app;
