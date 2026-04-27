const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// All routes require auth
router.use(protect);

// ── GET /api/notifications ─── Own notifications
router.get("/", async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where: { userId: req.user.id } }),
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
    ]);

    res.json({ success: true, data: notifications, meta: { total, unreadCount, page: parseInt(page) } });
  } catch (err) { next(err); }
});

// ── PATCH /api/notifications/:id/read ─── Mark one as read
router.patch("/:id/read", async (req, res, next) => {
  try {
    const notification = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { isRead: true },
    });
    res.json({ success: true, data: notification });
  } catch (err) { next(err); }
});

// ── PATCH /api/notifications/read-all ─── Mark all as read
router.patch("/read-all", async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true, message: "All notifications marked as read." });
  } catch (err) { next(err); }
});

module.exports = router;