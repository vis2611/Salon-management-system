const router = require("express").Router();
const { body, param, query } = require("express-validator");
const { validate } = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");
const { uploadPhoto } = require("../middleware/upload");
const { uploadLimiter } = require("../middleware/rateLimiter");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createError } = require("../middleware/errorHandler");
const { deleteFromCloudinary } = require("../middleware/upload");

// ── GET /api/photos ─── Public: gallery
router.get(
  "/",
  [
    query("category").optional().isString(),
    query("serviceId").optional().isString(),
    query("featured").optional().isBoolean(),
    query("page").optional().isInt({ min: 1 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { category, serviceId, featured, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      if (category) where.category = category;
      if (serviceId) where.serviceId = serviceId;
      if (featured === "true") where.isFeatured = true;

      const [photos, total] = await Promise.all([
        prisma.photo.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
          include: { service: { select: { name: true } } },
        }),
        prisma.photo.count({ where }),
      ]);

      res.json({ success: true, data: photos, meta: { total, page: parseInt(page) } });
    } catch (err) { next(err); }
  }
);

// ── POST /api/photos ─── Admin/Staff: upload photo
router.post(
  "/",
  protect,
  authorize("ADMIN", "STAFF"),
  uploadLimiter,
  uploadPhoto,
  [
    body("title").optional().isString().isLength({ max: 191 }),
    body("category").optional().isString().isLength({ max: 100 }),
    body("serviceId").optional().isString(),
    body("isFeatured").optional().isBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      if (!req.file) return next(createError("No file uploaded.", 400));

      const { title, category, serviceId, isFeatured } = req.body;

      const photo = await prisma.photo.create({
        data: {
          uploadedBy: req.user.id,
          url: req.file.path,
          thumbnailUrl: req.file.path.replace("/upload/", "/upload/w_400,h_300,c_fill/"),
          publicId: req.file.filename,
          title: title || null,
          category: category || null,
          serviceId: serviceId || null,
          isFeatured: isFeatured === "true" || isFeatured === true,
        },
      });

      res.status(201).json({ success: true, data: photo });
    } catch (err) { next(err); }
  }
);

// ── PATCH /api/photos/:id ─── Admin: update metadata
router.patch(
  "/:id",
  protect,
  authorize("ADMIN"),
  [
    param("id").notEmpty(),
    body("isFeatured").optional().isBoolean(),
    body("sortOrder").optional().isInt({ min: 0 }),
    body("category").optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { isFeatured, sortOrder, category, title } = req.body;
      const photo = await prisma.photo.update({
        where: { id: req.params.id },
        data: {
          ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
          ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) }),
          ...(category !== undefined && { category }),
          ...(title !== undefined && { title }),
        },
      });
      res.json({ success: true, data: photo });
    } catch (err) { next(err); }
  }
);

// ── DELETE /api/photos/:id ─── Admin
router.delete("/:id", protect, authorize("ADMIN"), async (req, res, next) => {
  try {
    const photo = await prisma.photo.findUnique({ where: { id: req.params.id } });
    if (!photo) return next(createError("Photo not found.", 404));

    if (photo.publicId) await deleteFromCloudinary(photo.publicId);
    await prisma.photo.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: "Photo deleted." });
  } catch (err) { next(err); }
});

module.exports = router;