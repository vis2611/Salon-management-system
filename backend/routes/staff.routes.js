// ══════════════════════════════════════════════════════════
//  ROUTES  —  src/routes/staff.routes.js
// ══════════════════════════════════════════════════════════
const router = require("express").Router();
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");
const c = require("../controllers/staff.controller");

// ── GET  /api/staff ─── Public: list all active staff
router.get("/", c.getStaff);

// ── GET  /api/staff/:id ─── Public: staff profile + services + reviews
router.get("/:id", [param("id").notEmpty()], validate, c.getStaffById);

// ── POST /api/staff ─── Admin: promote a user to staff
router.post(
  "/",
  protect,
  authorize("ADMIN"),
  [
    body("userId").notEmpty().withMessage("User ID is required."),
    body("specialization").optional().isString().isLength({ max: 191 }),
    body("bio").optional().isString().isLength({ max: 2000 }),
    body("experienceYears").optional().isInt({ min: 0 }),
  ],
  validate,
  c.createStaff
);

// ── PUT /api/staff/:id ─── Admin or the staff member themselves
router.put(
  "/:id",
  protect,
  authorize("ADMIN", "STAFF"),
  [
    param("id").notEmpty(),
    body("bio").optional().isString().isLength({ max: 2000 }),
    body("specialization").optional().isString(),
    body("isAvailable").optional().isBoolean(),
    body("experienceYears").optional().isInt({ min: 0 }),
  ],
  validate,
  c.updateStaff
);

// ── PUT /api/staff/:id/services ─── Admin: assign services to staff
router.put(
  "/:id/services",
  protect,
  authorize("ADMIN"),
  [
    param("id").notEmpty(),
    body("serviceIds").isArray({ min: 1 }).withMessage("At least one service ID required."),
  ],
  validate,
  c.assignServices
);

// ── PUT /api/staff/:id/working-hours ─── Admin or staff themselves
router.put(
  "/:id/working-hours",
  protect,
  authorize("ADMIN", "STAFF"),
  [
    param("id").notEmpty(),
    body("hours").isArray().withMessage("Hours must be an array."),
    body("hours.*.dayOfWeek").isInt({ min: 0, max: 6 }),
    body("hours.*.startTime").matches(/^\d{2}:\d{2}$/),
    body("hours.*.endTime").matches(/^\d{2}:\d{2}$/),
    body("hours.*.isDayOff").isBoolean(),
  ],
  validate,
  c.setWorkingHours
);

module.exports = router;