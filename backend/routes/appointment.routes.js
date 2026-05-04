const router = require("express").Router();
const { body, query, param } = require("express-validator");
const { validate } = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");
const { appointmentLimiter } = require("../middleware/rateLimiter");
const c = require("../controllers/appointment.controller");
const { PrismaClient } = require("@prisma/client");
const { createError } = require("../middleware/errorHandler");
const { auditLog } = require("../utils/auditLog");
const prisma = new PrismaClient();

// All appointment routes require login
router.use(protect);

// ── GET /api/appointments ─────────────────────────────────
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
    query("status").optional(),
    query("date").optional().isISO8601(),
  ],
  validate,
  c.getAppointments
);

// ── POST /api/appointments ─── Book (Fix 8: payment optional)
router.post(
  "/",
  appointmentLimiter,
  [
    body("serviceId").notEmpty().withMessage("Service ID required."),
    body("staffId").notEmpty().withMessage("Staff ID required."),
    body("scheduledAt").isISO8601().withMessage("Valid date-time required."),
    body("notes").optional().isLength({ max: 500 }),
    body("couponCode").optional().isString(),
  ],
  validate,
  c.createAppointment
);

// ── GET /api/appointments/check/availability ─────────────
router.get(
  "/check/availability",
  [
    query("staffId").notEmpty(),
    query("date").isISO8601(),
    query("serviceId").notEmpty(),
  ],
  validate,
  c.checkAvailability
);

// ── GET /api/appointments/:id ────────────────────────────
router.get("/:id", [param("id").notEmpty()], validate, c.getAppointment);

// ── PATCH /api/appointments/:id/status ── Admin/Staff only
router.patch(
  "/:id/status",
  authorize("ADMIN", "STAFF"),
  [
    param("id").notEmpty(),
    body("status").isIn(["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]),
  ],
  validate,
  c.updateStatus
);

// ── PATCH /api/appointments/:id/reschedule ── Fix 3: Admin/Staff reschedule
router.patch(
  "/:id/reschedule",
  authorize("ADMIN", "STAFF"),
  [
    param("id").notEmpty(),
    body("scheduledAt").isISO8601().withMessage("Valid ISO date-time required."),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { scheduledAt } = req.body;
      const existing = await prisma.appointment.findUnique({ where: { id: req.params.id } });
      if (!existing) return next(createError("Appointment not found.", 404));

      if (["COMPLETED", "CANCELLED", "NO_SHOW"].includes(existing.status)) {
        return next(createError(`Cannot reschedule a ${existing.status} appointment.`, 400));
      }

      const newDate = new Date(scheduledAt);
      if (newDate < new Date()) {
        return next(createError("Cannot reschedule to a past date.", 400));
      }

      const updated = await prisma.appointment.update({
        where: { id: req.params.id },
        data: { scheduledAt: newDate },
        include: {
          user: { select: { name: true, email: true } },
          service: { select: { name: true } },
        },
      });

      // Notify customer
      await prisma.notification.create({
        data: {
          userId: existing.userId,
          type: "appointment_rescheduled",
          title: "Appointment Rescheduled",
          body: `Your ${updated.service.name} appointment has been moved to ${newDate.toLocaleString("en-IN")}.`,
        },
      });

      auditLog({
        userId: req.user.id,
        action: "RESCHEDULE",
        entityType: "Appointment",
        entityId: existing.id,
        oldValues: { scheduledAt: existing.scheduledAt },
        newValues: { scheduledAt: newDate },
        ipAddress: req.ip,
      });

      res.json({ success: true, data: updated, message: "Appointment rescheduled successfully." });
    } catch (err) { next(err); }
  }
);

// ── DELETE /api/appointments/:id ─── Customer cancels own
router.delete("/:id", [param("id").notEmpty()], validate, c.cancelAppointment);

module.exports = router;