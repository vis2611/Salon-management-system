const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createError } = require("../middleware/errorHandler");
const { deleteFromCloudinary } = require("../middleware/upload");

// ── GET /api/services ────────────────────────────────────
exports.getServices = async (req, res, next) => {
  try {
    const { categoryId, page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    if (search) where.name = { contains: search };

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { name: "asc" },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          staffServices: {
            include: { staff: { include: { user: { select: { name: true, avatarUrl: true } } } } },
          },
          _count: { select: { appointments: true } },
        },
      }),
      prisma.service.count({ where }),
    ]);

    res.json({
      success: true,
      data: services,
      meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/services/categories ─────────────────────────
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { services: true } } },
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/services/:id ────────────────────────────────
exports.getService = async (req, res, next) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        staffServices: {
          include: {
            staff: {
              include: {
                user: { select: { name: true, avatarUrl: true } },
                workingHours: true,
                reviews: { select: { rating: true } },
              },
            },
          },
        },
        photos: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!service || !service.isActive) return next(createError("Service not found.", 404));

    // Compute average rating per staff
    const enriched = {
      ...service,
      staffServices: service.staffServices.map((ss) => {
        const ratings = ss.staff.reviews.map((r) => r.rating);
        const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
        return { ...ss, staff: { ...ss.staff, avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null } };
      }),
    };

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/services ───────────────────────────────────
exports.createService = async (req, res, next) => {
  try {
    const { name, categoryId, price, durationMins, description } = req.body;
    const imageUrl = req.file?.path || null;
    const publicId = req.file?.filename || null;

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return next(createError("Category not found.", 404));

    const service = await prisma.service.create({
      data: {
        name,
        categoryId,
        price: parseFloat(price),
        durationMins: parseInt(durationMins),
        description: description || null,
        imageUrl,
      },
    });

    if (imageUrl) {
      await prisma.photo.create({
        data: {
          uploadedBy: req.user.id,
          serviceId: service.id,
          url: imageUrl,
          publicId,
          category: "service",
        },
      });
    }

    res.status(201).json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/services/:id ────────────────────────────────
exports.updateService = async (req, res, next) => {
  try {
    const existing = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(createError("Service not found.", 404));

    const { name, categoryId, price, durationMins, description, isActive } = req.body;
    const imageUrl = req.file?.path || undefined;

    // Delete old image from Cloudinary if replaced
    if (req.file && existing.imageUrl) {
      const oldPublicId = existing.imageUrl.split("/").slice(-2).join("/").split(".")[0];
      await deleteFromCloudinary(oldPublicId);
    }

    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(categoryId && { categoryId }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(durationMins !== undefined && { durationMins: parseInt(durationMins) }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive: isActive === "true" || isActive === true }),
        ...(imageUrl && { imageUrl }),
      },
    });

    res.json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/services/:id ─────────────────────────────
exports.deleteService = async (req, res, next) => {
  try {
    const service = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!service) return next(createError("Service not found.", 404));

    // Soft delete — don't break existing appointment records
    await prisma.service.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: "Service deactivated successfully." });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/services/categories ────────────────────────
exports.createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, sortOrder } = req.body;

    const category = await prisma.category.create({
      data: { name, slug, description: description || null, sortOrder: sortOrder ? parseInt(sortOrder) : 0 },
    });

    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};