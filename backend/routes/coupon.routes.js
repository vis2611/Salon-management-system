// ══════════════════════════════════════════════════════════
//  COUPON ROUTES  —  src/routes/coupon.routes.js
// ══════════════════════════════════════════════════════════
const router = require("express").Router();
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createError } = require("../middleware/errorHandler");

// ── POST /api/coupons/validate ─── Auth: check if coupon is usable
router.post(
  "/validate",
  protect,
  [body("code").notEmpty(), body("amount").isFloat({ min: 0 })],
  validate,
  async (req, res, next) => {
    try {
      const { code, amount } = req.body;

      const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase(), isActive: true },
      });

      if (!coupon) return next(createError("Invalid coupon code.", 400));
      if (coupon.expiresAt && coupon.expiresAt < new Date()) return next(createError("Coupon has expired.", 400));
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return next(createError("Coupon limit reached.", 400));
      if (coupon.minOrderAmount && parseFloat(amount) < Number(coupon.minOrderAmount))
        return next(createError(`Minimum order amount is ₹${coupon.minOrderAmount}.`, 400));

      const alreadyUsed = await prisma.couponUsage.findFirst({
        where: { couponId: coupon.id, userId: req.user.id },
      });
      if (alreadyUsed) return next(createError("You have already used this coupon.", 400));

      // Calculate discount
      let discountAmount;
      if (coupon.discountType === "PERCENTAGE") {
        discountAmount = (parseFloat(amount) * Number(coupon.discountValue)) / 100;
      } else {
        discountAmount = Number(coupon.discountValue);
      }
      discountAmount = Math.min(discountAmount, parseFloat(amount));

      res.json({
        success: true,
        data: {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount: Math.round(discountAmount * 100) / 100,
          finalAmount: Math.round((parseFloat(amount) - discountAmount) * 100) / 100,
        },
      });
    } catch (err) { next(err); }
  }
);

// ── GET /api/coupons ─── Admin: list all coupons
router.get("/", protect, authorize("ADMIN"), async (req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { usages: true } } },
    });
    res.json({ success: true, data: coupons });
  } catch (err) { next(err); }
});

// ── POST /api/coupons ─── Admin: create coupon
router.post(
  "/",
  protect,
  authorize("ADMIN"),
  [
    body("code").trim().notEmpty().toUpperCase().isLength({ max: 50 }),
    body("discountType").isIn(["PERCENTAGE", "FLAT"]),
    body("discountValue").isFloat({ min: 0.01 }),
    body("minOrderAmount").optional().isFloat({ min: 0 }),
    body("maxUses").optional().isInt({ min: 1 }),
    body("expiresAt").optional().isISO8601(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const coupon = await prisma.coupon.create({ data: { ...req.body, code: req.body.code.toUpperCase() } });
      res.status(201).json({ success: true, data: coupon });
    } catch (err) { next(err); }
  }
);

// ── PATCH /api/coupons/:id ─── Admin: toggle active status
router.patch("/:id", protect, authorize("ADMIN"), async (req, res, next) => {
  try {
    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: { isActive: req.body.isActive },
    });
    res.json({ success: true, data: coupon });
  } catch (err) { next(err); }
});

module.exports = router;