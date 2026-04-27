const router = require("express").Router();
const { query } = require("express-validator");
const { validate } = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");
const { adminLimiter } = require("../middleware/rateLimiter");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// All admin routes require ADMIN role
router.use(protect, authorize("ADMIN"), adminLimiter);

// ── GET /api/admin/dashboard ─── Overview stats
router.get("/dashboard", async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const [
      totalCustomers,
      totalStaff,
      todayAppointments,
      pendingAppointments,
      monthRevenue,
      totalRevenue,
      recentAppointments,
      topServices,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER", isActive: true } }),
      prisma.staff.count({ where: { isAvailable: true } }),
      prisma.appointment.count({ where: { scheduledAt: { gte: today, lte: todayEnd } } }),
      prisma.appointment.count({ where: { status: "PENDING" } }),

      // This month's revenue
      prisma.payment.aggregate({
        where: { status: "SUCCESS", paidAt: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),

      // All-time revenue
      prisma.payment.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true },
      }),

      // Recent 5 appointments
      prisma.appointment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          service: { select: { name: true } },
          staff: { include: { user: { select: { name: true } } } },
          payment: { select: { status: true, amount: true } },
        },
      }),

      // Top 5 booked services
      prisma.service.findMany({
        take: 5,
        include: { _count: { select: { appointments: true } } },
        orderBy: { appointments: { _count: "desc" } },
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalCustomers,
          totalStaff,
          todayAppointments,
          pendingAppointments,
          monthRevenue: Number(monthRevenue._sum.amount) || 0,
          totalRevenue: Number(totalRevenue._sum.amount) || 0,
        },
        recentAppointments,
        topServices,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/revenue ─── Monthly revenue chart data
router.get(
  "/revenue",
  [
    query("year").optional().isInt({ min: 2020, max: 2100 }),
    query("months").optional().isInt({ min: 1, max: 12 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const months = parseInt(req.query.months) || 12;

      // Build monthly buckets
      const data = [];
      for (let m = 0; m < months; m++) {
        const start = new Date(year, m, 1);
        const end = new Date(year, m + 1, 0, 23, 59, 59);

        const [revenue, count] = await Promise.all([
          prisma.payment.aggregate({
            where: { status: "SUCCESS", paidAt: { gte: start, lte: end } },
            _sum: { amount: true },
          }),
          prisma.appointment.count({
            where: { scheduledAt: { gte: start, lte: end }, status: { not: "CANCELLED" } },
          }),
        ]);

        data.push({
          month: start.toLocaleString("en-IN", { month: "short" }),
          monthIndex: m + 1,
          revenue: Number(revenue._sum.amount) || 0,
          appointments: count,
        });
      }

      res.json({ success: true, data, year });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/admin/appointments ─── Full appointment list with filters
router.get(
  "/appointments",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status").optional(),
    query("staffId").optional(),
    query("from").optional().isISO8601(),
    query("to").optional().isISO8601(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20, status, staffId, from, to } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      if (status) where.status = status;
      if (staffId) where.staffId = staffId;
      if (from || to) {
        where.scheduledAt = {};
        if (from) where.scheduledAt.gte = new Date(from);
        if (to) where.scheduledAt.lte = new Date(to);
      }

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { scheduledAt: "desc" },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            service: { select: { id: true, name: true, price: true } },
            staff: { include: { user: { select: { name: true } } } },
            payment: { select: { status: true, amount: true, method: true } },
          },
        }),
        prisma.appointment.count({ where }),
      ]);

      res.json({
        success: true,
        data: appointments,
        meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/admin/audit-logs ─── Security log
router.get(
  "/audit-logs",
  [
    query("page").optional().isInt({ min: 1 }),
    query("entityType").optional().isString(),
    query("action").optional().isString(),
    query("userId").optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { page = 1, limit = 50, entityType, action, userId } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      if (entityType) where.entityType = entityType;
      if (action) where.action = action;
      if (userId) where.userId = userId;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true, email: true } } },
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.json({ success: true, data: logs, meta: { total, page: parseInt(page) } });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/admin/staff-performance ─── Revenue + bookings per staff
router.get("/staff-performance", async (req, res, next) => {
  try {
    const staff = await prisma.staff.findMany({
      include: {
        user: { select: { name: true, avatarUrl: true } },
        reviews: { select: { rating: true } },
        appointments: {
          where: { status: "COMPLETED" },
          include: { payment: { select: { amount: true, status: true } } },
        },
        _count: { select: { appointments: true } },
      },
    });

    const performance = staff.map((s) => {
      const completedRevenue = s.appointments.reduce((sum, a) => {
        return a.payment?.status === "SUCCESS" ? sum + Number(a.payment.amount) : sum;
      }, 0);
      const ratings = s.reviews.map((r) => r.rating);
      const avgRating = ratings.length
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;

      return {
        id: s.id,
        name: s.user.name,
        avatarUrl: s.user.avatarUrl,
        totalAppointments: s._count.appointments,
        completedAppointments: s.appointments.length,
        revenue: Math.round(completedRevenue * 100) / 100,
        avgRating,
        totalReviews: ratings.length,
      };
    });

    res.json({ success: true, data: performance });
  } catch (err) {
    next(err);
  }
});

module.exports = router;