const rateLimit = require("express-rate-limit");

// ── Helper ────────────────────────────────────────────────
const buildLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting in development so testing is smooth
    skip: () => process.env.NODE_ENV === "development",
    message: { success: false, message },
  });

// ── Global: very generous for development ────────────────
// In production these tighten automatically (NODE_ENV=production)
const globalLimiter = buildLimiter(
  15 * 60 * 1000,
  process.env.NODE_ENV === "production" ? 200 : 10000,
  "Too many requests, please try again after 15 minutes."
);

// ── Auth: relaxed for dev testing ────────────────────────
const authLimiter = buildLimiter(
  15 * 60 * 1000,
  process.env.NODE_ENV === "production" ? 10 : 10000,
  "Too many login attempts, please try again after 15 minutes."
);

// ── Register ─────────────────────────────────────────────
const registerLimiter = buildLimiter(
  60 * 60 * 1000,
  process.env.NODE_ENV === "production" ? 5 : 10000,
  "Too many accounts created from this IP."
);

// ── Password reset ────────────────────────────────────────
const passwordResetLimiter = buildLimiter(
  60 * 60 * 1000,
  process.env.NODE_ENV === "production" ? 5 : 10000,
  "Too many password reset requests."
);

// ── Appointments ──────────────────────────────────────────
const appointmentLimiter = buildLimiter(
  60 * 60 * 1000,
  process.env.NODE_ENV === "production" ? 20 : 10000,
  "Too many booking requests."
);

// ── Payments ──────────────────────────────────────────────
const paymentLimiter = buildLimiter(
  60 * 60 * 1000,
  process.env.NODE_ENV === "production" ? 30 : 10000,
  "Too many payment requests."
);

// ── Uploads ───────────────────────────────────────────────
const uploadLimiter = buildLimiter(
  60 * 60 * 1000,
  process.env.NODE_ENV === "production" ? 30 : 10000,
  "Upload limit reached."
);

// ── Admin ─────────────────────────────────────────────────
const adminLimiter = buildLimiter(
  15 * 60 * 1000,
  process.env.NODE_ENV === "production" ? 500 : 10000,
  "Too many admin requests."
);

module.exports = {
  globalLimiter,
  authLimiter,
  registerLimiter,
  passwordResetLimiter,
  appointmentLimiter,
  paymentLimiter,
  uploadLimiter,
  adminLimiter,
};