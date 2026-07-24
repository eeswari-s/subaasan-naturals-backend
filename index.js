import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import { filterXSS } from "xss";
import mongoose from "mongoose";

import env from "./config/env.js";
import connectDB from "./config/db.js";
import "./config/cloudinary.js";
import "./config/razorpay.js";

import apiRoutes from "./routes/index.js";
import { razorpayWebhook } from "./controllers/payment.controller.js";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js";
import ApiResponse from "./utils/ApiResponse.js";
import HTTP_STATUS from "./constants/httpStatusCodes.js";

await connectDB();

const app = express();

app.use(helmet());

// Any localhost/127.0.0.1 origin (any port) is always allowed — it can only ever be
// reached from the developer's own machine, so this carries no real security risk and
// keeps local frontend dev working regardless of what CLIENT_URL is set to on the host.
const isLocalDevOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(
  cors({
    origin: (origin, callback) => {
      // no origin = same-origin/non-browser requests (curl, Postman, server-to-server)
      if (!origin || isLocalDevOrigin(origin) || env.CLIENT_URLS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

// Razorpay webhook needs the raw request body for signature verification,
// so it must be mounted before the global JSON body parser.
app.post("/api/v1/payments/webhook", express.raw({ type: "application/json" }), razorpayWebhook);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.COOKIE_SECRET));
app.use(mongoSanitize());

const sanitizeXss = (value) => {
  if (typeof value === "string") return filterXSS(value);
  if (Array.isArray(value)) return value.map(sanitizeXss);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, sanitizeXss(val)]));
  }
  return value;
};

app.use((req, res, next) => {
  if (req.body) req.body = sanitizeXss(req.body);
  next();
});

app.get("/health", (req, res) => {
  res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { uptime: process.uptime() }, "Server is healthy"));
});

app.use("/api/v1", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`[Server] Subaasan Naturals backend running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

const gracefulShutdown = (signal) => {
  console.log(`[Server] ${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    console.log("[Server] HTTP server closed");
    await mongoose.connection.close(false);
    console.log("[MongoDB] Connection closed");
    process.exit(0);
  });
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
