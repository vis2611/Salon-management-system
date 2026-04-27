// ══════════════════════════════════════════════════════════
//  ROUTES  —  src/routes/review.routes.js
// ══════════════════════════════════════════════════════════
const router = require("express").Router();
const { body, param, query } = require("express-validator");
const { validate } = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createError } = require("../middleware/errorHandler");

// ── GET /api/reviews ─── Public: reviews for a staff member
router.get(
  "/",
  [query("staffId").optional(), query("page").optional().isInt({ min: 1 })],
  validate,
  async (req, res, next) => {
    try {
      const { staffId, page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = { isPublished: true };
      if (staffId) where.staffId = staffId;

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, avatarUrl: true } },
            staff: { include: { user: { select: { name: true } } } },
          },
        }),
        prisma.review.count({ where }),
      ]);
      res.json({ success: true, data: reviews, meta: { total, page: parseInt(page) } });
    } catch (err) { next(err); }
  }
);

// ── POST /api/reviews ─── Auth: submit review for completed appointment
router.post(
  "/",
  protect,
  [
    body("appointmentId").notEmpty(),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be 1–5."),
    body("comment").optional().isLength({ max: 1000 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { appointmentId, rating, comment } = req.body;

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { review: true },
      });
      if (!appointment) return next(createError("Appointment not found.", 404));
      if (appointment.userId !== req.user.id) return next(createError("Access denied.", 403));
      if (appointment.status !== "COMPLETED") return next(createError("You can only review completed appointments.", 400));
      if (appointment.review) return next(createError("You have already reviewed this appointment.", 409));

      const review = await prisma.review.create({
        data: { appointmentId, userId: req.user.id, staffId: appointment.staffId, rating, comment: comment || null },
        include: { user: { select: { name: true, avatarUrl: true } } },
      });
      res.status(201).json({ success: true, data: review });
    } catch (err) { next(err); }
  }
);

// ── PATCH /api/reviews/:id/publish ─── Admin: moderate
router.patch(
  "/:id/publish",
  protect,
  authorize("ADMIN"),
  async (req, res, next) => {
    try {
      const review = await prisma.review.update({
        where: { id: req.params.id },
        data: { isPublished: req.body.isPublished ?? true },
      });
      res.json({ success: true, data: review });
    } catch (err) { next(err); }
  }
);

module.exports = router;