const router = require("express").Router();
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authLimiter, registerLimiter, passwordResetLimiter } = require("../middleware/rateLimiter");
const { protect } = require("../middleware/auth");
const authController = require("../controllers/auth.controller");

// ── Validators ───────────────────────────────────────────
const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required.").isLength({ max: 100 }),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required."),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
    .matches(/[A-Z]/).withMessage("Password must contain an uppercase letter.")
    .matches(/[0-9]/).withMessage("Password must contain a number."),
  body("phone").optional().isMobilePhone("en-IN").withMessage("Valid Indian phone number required."),
];

const loginRules = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required."),
  body("password").notEmpty().withMessage("Password is required."),
];

// ── POST /api/auth/register ──────────────────────────────
router.post("/register", registerLimiter, registerRules, validate, authController.register);

// ── POST /api/auth/login ─────────────────────────────────
router.post("/login", authLimiter, loginRules, validate, authController.login);

// ── POST /api/auth/refresh ───────────────────────────────
router.post("/refresh", authController.refreshToken);

// ── POST /api/auth/logout ────────────────────────────────
router.post("/logout", protect, authController.logout);

// ── POST /api/auth/logout-all ────────────────────────────
router.post("/logout-all", protect, authController.logoutAll);

// ── GET  /api/auth/me ─────────────────────────────────────
router.get("/me", protect, authController.getMe);

// ── POST /api/auth/forgot-password ──────────────────────
router.post(
  "/forgot-password",
  passwordResetLimiter,
  [body("email").isEmail().normalizeEmail()],
  validate,
  authController.forgotPassword
);

// ── POST /api/auth/reset-password ───────────────────────
router.post(
  "/reset-password",
  [
    body("token").notEmpty(),
    body("password").isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/),
  ],
  validate,
  authController.resetPassword
);

module.exports = router;