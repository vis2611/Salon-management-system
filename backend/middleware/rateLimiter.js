const rateLimit = require("express-rate-limit");

// ── Helper to build a limiter ────────────────────────────
const buildLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,  // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,
    message: { success: false, message },
    skipSuccessfulRequests: false,
  });

// ── Global: 100 req / 15 min per IP ─────────────────────
const globalLimiter = buildLimiter(
  15 * 60 * 1000,
  100,
  "Too many requests, please try again after 15 minutes."
);

// ── Auth: 5 attempts / 15 min (brute-force protection) ──
const authLimiter = buildLimiter(
  15 * 60 * 1000,
  5,
  "Too many login attempts, please try again after 15 minutes."
);

// ── Register: 3 accounts / hour per IP ──────────────────
const registerLimiter = buildLimiter(
  60 * 60 * 1000,
  3,
  "Too many accounts created from this IP, please try again after 1 hour."
);

// ── Password reset: 3 attempts / hour ───────────────────
const passwordResetLimiter = buildLimiter(
  60 * 60 * 1000,
  3,
  "Too many password reset requests, please try again after 1 hour."
);

// ── Appointment: 10 bookings / hour per user ────────────
const appointmentLimiter = buildLimiter(
  60 * 60 * 1000,
  10,
  "Too many booking requests, please slow down."
);

// ── Payment: 20 payment requests / hour ─────────────────
const paymentLimiter = buildLimiter(
  60 * 60 * 1000,
  20,
  "Too many payment requests, please try again later."
);

// ── Upload: 20 uploads / hour per user ──────────────────
const uploadLimiter = buildLimiter(
  60 * 60 * 1000,
  20,
  "Upload limit reached, please try again after 1 hour."
);

// ── Admin: 200 req / 15 min (higher for dashboard) ──────
const adminLimiter = buildLimiter(
  15 * 60 * 1000,
  200,
  "Too many admin requests, please try again after 15 minutes."
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