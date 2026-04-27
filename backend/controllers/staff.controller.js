const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createError } = require("../middleware/errorHandler");

// ── GET /api/staff ────────────────────────────────────────
exports.getStaff = async (req, res, next) => {
  try {
    const staff = await prisma.staff.findMany({
      where: { isAvailable: true },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        services: { include: { service: { select: { id: true, name: true, price: true } } } },
        reviews: { select: { rating: true } },
        workingHours: true,
      },
    });

    const enriched = staff.map((s) => {
      const ratings = s.reviews.map((r) => r.rating);
      const avgRating = ratings.length
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;
      return { ...s, avgRating, totalReviews: ratings.length };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/staff/:id ────────────────────────────────────
exports.getStaffById = async (req, res, next) => {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        services: { include: { service: true } },
        workingHours: { orderBy: { dayOfWeek: "asc" } },
        reviews: {
          where: { isPublished: true },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { user: { select: { name: true, avatarUrl: true } } },
        },
        _count: { select: { appointments: true } },
      },
    });

    if (!staff) return next(createError("Staff member not found.", 404));

    const ratings = staff.reviews.map((r) => r.rating);
    const avgRating = ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null;

    res.json({ success: true, data: { ...staff, avgRating } });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/staff ───────────────────────────────────────
exports.createStaff = async (req, res, next) => {
  try {
    const { userId, specialization, bio, experienceYears } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return next(createError("User not found.", 404));

    const existing = await prisma.staff.findUnique({ where: { userId } });
    if (existing) return next(createError("This user is already a staff member.", 409));

    // Promote user role to STAFF
    await prisma.user.update({ where: { id: userId }, data: { role: "STAFF" } });

    const staff = await prisma.staff.create({
      data: {
        userId,
        specialization: specialization || null,
        bio: bio || null,
        experienceYears: experienceYears ? parseInt(experienceYears) : 0,
      },
      include: { user: { select: { name: true, email: true } } },
    });

    // Seed default working hours (Mon–Sat 9am–6pm, Sunday off)
    const defaultHours = Array.from({ length: 7 }, (_, i) => ({
      staffId: staff.id,
      dayOfWeek: i,
      startTime: "09:00",
      endTime: "18:00",
      isDayOff: i === 0, // Sunday off
    }));
    await prisma.workingHour.createMany({ data: defaultHours });

    res.status(201).json({ success: true, data: staff });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/staff/:id ────────────────────────────────────
exports.updateStaff = async (req, res, next) => {
  try {
    const staff = await prisma.staff.findUnique({ where: { id: req.params.id } });
    if (!staff) return next(createError("Staff member not found.", 404));

    // Staff can only update their own profile
    if (req.user.role === "STAFF" && staff.userId !== req.user.id) {
      return next(createError("Access denied.", 403));
    }

    const { bio, specialization, isAvailable, experienceYears } = req.body;

    const updated = await prisma.staff.update({
      where: { id: req.params.id },
      data: {
        ...(bio !== undefined && { bio }),
        ...(specialization !== undefined && { specialization }),
        ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
        ...(experienceYears !== undefined && { experienceYears: parseInt(experienceYears) }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/staff/:id/services ───────────────────────────
exports.assignServices = async (req, res, next) => {
  try {
    const { serviceIds } = req.body;

    const staff = await prisma.staff.findUnique({ where: { id: req.params.id } });
    if (!staff) return next(createError("Staff member not found.", 404));

    // Replace all services in a transaction
    await prisma.$transaction([
      prisma.staffService.deleteMany({ where: { staffId: req.params.id } }),
      prisma.staffService.createMany({
        data: serviceIds.map((serviceId) => ({ staffId: req.params.id, serviceId })),
        skipDuplicates: true,
      }),
    ]);

    const updated = await prisma.staff.findUnique({
      where: { id: req.params.id },
      include: { services: { include: { service: true } } },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/staff/:id/working-hours ─────────────────────
exports.setWorkingHours = async (req, res, next) => {
  try {
    const { hours } = req.body;

    const staff = await prisma.staff.findUnique({ where: { id: req.params.id } });
    if (!staff) return next(createError("Staff member not found.", 404));

    if (req.user.role === "STAFF" && staff.userId !== req.user.id) {
      return next(createError("Access denied.", 403));
    }

    // Upsert each day
    await prisma.$transaction(
      hours.map((h) =>
        prisma.workingHour.upsert({
          where: { staffId_dayOfWeek: { staffId: req.params.id, dayOfWeek: h.dayOfWeek } },
          update: { startTime: h.startTime, endTime: h.endTime, isDayOff: h.isDayOff },
          create: {
            staffId: req.params.id,
            dayOfWeek: h.dayOfWeek,
            startTime: h.startTime,
            endTime: h.endTime,
            isDayOff: h.isDayOff,
          },
        })
      )
    );

    const updated = await prisma.workingHour.findMany({
      where: { staffId: req.params.id },
      orderBy: { dayOfWeek: "asc" },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};