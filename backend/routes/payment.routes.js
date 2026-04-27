// ══════════════════════════════════════════════════════════
//  ROUTES  —  src/routes/payment.routes.js
// ══════════════════════════════════════════════════════════
const router = require("express").Router();
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");
const { paymentLimiter } = require("../middleware/rateLimiter");
const c = require("../controllers/payment.controller");

// ── POST /api/payments/create-order ─── Initiate Razorpay order
router.post(
  "/create-order",
  protect,
  paymentLimiter,
  [body("appointmentId").notEmpty().withMessage("Appointment ID is required.")],
  validate,
  c.createOrder
);

// ── POST /api/payments/verify ─── Verify payment after Razorpay callback
router.post(
  "/verify",
  protect,
  [
    body("appointmentId").notEmpty(),
    body("razorpay_order_id").notEmpty(),
    body("razorpay_payment_id").notEmpty(),
    body("razorpay_signature").notEmpty(),
  ],
  validate,
  c.verifyPayment
);

// ── POST /api/payments/webhook ─── Razorpay webhook (raw body, no auth)
// Note: raw body parsing is set up in index.js for this route
router.post("/webhook", c.webhook);

// ── GET /api/payments/my ─── Customer: own payment history
router.get("/my", protect, c.getMyPayments);

// ── GET /api/payments/:id ─── Admin: any payment details
router.get("/:id", protect, authorize("ADMIN"), [param("id").notEmpty()], validate, c.getPayment);

// ── POST /api/payments/:id/refund ─── Admin: initiate refund
router.post(
  "/:id/refund",
  protect,
  authorize("ADMIN"),
  [param("id").notEmpty()],
  validate,
  c.refundPayment
);

module.exports = router;