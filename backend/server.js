require('dotenv').config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { globalLimiter } = require("./middleware/rateLimiter");
const { errorHandler } = require("./middleware/errorHandler");
const logger = require("./utils/logger");

// ── Routes ───────────────────────────────────────────────
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const staffRoutes = require("./routes/staff.routes");
const serviceRoutes = require("./routes/service.routes");
const appointmentRoutes = require("./routes/appointment.routes");
const paymentRoutes = require("./routes/payment.routes");
const reviewRoutes = require("./routes/review.routes");
const photoRoutes = require("./routes/photo.routes");
const couponRoutes = require("./routes/coupon.routes");
const adminRoutes = require("./routes/admin.routes");
const notificationRoutes = require("./routes/notification.routes");

const app = express();

// ── Security headers ─────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Body parsers ─────────────────────────────────────────
// Raw body needed for Razorpay webhook signature verification
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10kb" })); // Prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── Request logging ──────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

// ── Global rate limiter (all routes) ────────────────────
app.use("/api", globalLimiter);

// ── Health check (no auth, no rate limit) ───────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API Routes ───────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);

// ── 404 handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global error handler ─────────────────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;