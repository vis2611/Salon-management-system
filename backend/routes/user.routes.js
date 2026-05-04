// ══════════════════════════════════════════════════════════
//  ROUTES  —  src/routes/user.routes.js
// ══════════════════════════════════════════════════════════
const router = require("express").Router();
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");
const { uploadAvatar } = require("../middleware/upload");
const { uploadLimiter } = require("../middleware/rateLimiter");
const c = require("../controllers/user.controller");

// All routes require auth
router.use(protect);

// ── GET  /api/users/profile ─── Own profile
router.get("/profile", c.getProfile);

// ── PUT  /api/users/profile ─── Update own profile
router.put(
  "/profile",
  [
    body("name").optional().trim().notEmpty().isLength({ max: 100 }),
    body("phone").optional().isMobilePhone("en-IN"),
  ],
  validate,
  c.updateProfile
);

// ── POST /api/users/avatar ─── Upload own avatar
router.post("/avatar", uploadLimiter, uploadAvatar, c.uploadAvatar);

// ── PUT  /api/users/change-password
router.put(
  "/change-password",
  [
    body("currentPassword").notEmpty(),
    body("newPassword")
      .isLength({ min: 8 })
      .matches(/[A-Z]/)
      .matches(/[0-9]/)
      .withMessage("Password must be 8+ chars with uppercase and number."),
  ],
  validate,
  c.changePassword
);

// ── Admin only ────────────────────────────────────────────
// ── GET  /api/users ─── Admin: list all users
router.get("/", authorize("ADMIN"), c.getAllUsers);

// ── GET  /api/users/:id ─── Admin: get user by ID
router.get("/:id", authorize("ADMIN"), [param("id").notEmpty()], validate, c.getUserById);

// ── PATCH /api/users/:id/status ─── Admin: activate/deactivate
router.patch(
  "/:id/status",
  authorize("ADMIN"),
  [param("id").notEmpty(), body("isActive").isBoolean()],
  validate,
  c.setUserStatus
);

module.exports = router;


// ══════════════════════════════════════════════════════════
//  CONTROLLER  —  src/controllers/user.controller.js
// ══════════════════════════════════════════════════════════
// (Inlined here to keep files manageable — split if preferred)