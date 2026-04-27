const router = require("express").Router();
const { body, query, param } = require("express-validator");
const { validate } = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");
const { appointmentLimiter } = require("../middleware/rateLimiter");
const c = require("../controllers/appointment.controller");

// All appointment routes require login
router.use(protect);

// ── GET  /api/appointments ─── Customer: own | Admin+Staff: all
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
    query("status").optional().isIn(["PENDING","CONFIRMED","IN_PROGRESS","COMPLETED","CANCELLED","NO_SHOW"]),
    query("date").optional().isISO8601(),
  ],
  validate,
  c.getAppointments
);

// ── POST /api/appointments ─── Book a new appointment
router.post(
  "/",
  appointmentLimiter,
  [
    body("serviceId").notEmpty().withMessage("Service ID is required."),
    body("staffId").notEmpty().withMessage("Staff ID is required."),
    body("scheduledAt").isISO8601().withMessage("Valid date-time is required."),
    body("notes").optional().isLength({ max: 500 }),
    body("couponCode").optional().isString(),
  ],
  validate,
  c.createAppointment
);

// ── GET  /api/appointments/:id ───────────────────────────
router.get("/:id", [param("id").notEmpty()], validate, c.getAppointment);

// ── PATCH /api/appointments/:id/status ─── Admin/Staff only
router.patch(
  "/:id/status",
  authorize("ADMIN", "STAFF"),
  [
    param("id").notEmpty(),
    body("status").isIn(["CONFIRMED","IN_PROGRESS","COMPLETED","CANCELLED","NO_SHOW"]),
  ],
  validate,
  c.updateStatus
);

// ── DELETE /api/appointments/:id ─── Customer cancels own
router.delete("/:id", [param("id").notEmpty()], validate, c.cancelAppointment);

// ── GET /api/appointments/availability ──────────────────
router.get(
  "/check/availability",
  [
    query("staffId").notEmpty(),
    query("date").isISO8601().withMessage("Valid date required (YYYY-MM-DD)."),
    query("serviceId").notEmpty(),
  ],
  validate,
  c.checkAvailability
);

module.exports = router;