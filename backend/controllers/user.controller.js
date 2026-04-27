const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createError } = require("../middleware/errorHandler");
const { deleteFromCloudinary } = require("../middleware/upload");

const SAFE_USER_SELECT = {
  id: true, name: true, email: true, phone: true,
  role: true, avatarUrl: true, isActive: true,
  emailVerifiedAt: true, createdAt: true,
};

// ── GET /api/users/profile ────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        ...SAFE_USER_SELECT,
        appointments: {
          take: 5,
          orderBy: { scheduledAt: "desc" },
          select: { id: true, scheduledAt: true, status: true, service: { select: { name: true } } },
        },
        _count: { select: { appointments: true } },
      },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/users/profile ────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone: phone || null }),
      },
      select: SAFE_USER_SELECT,
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/users/avatar ────────────────────────────────
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return next(createError("No file uploaded.", 400));

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { avatarUrl: true },
    });

    // Delete old avatar from Cloudinary
    if (currentUser.avatarUrl) {
      const publicId = currentUser.avatarUrl.split("/").slice(-2).join("/").split(".")[0];
      await deleteFromCloudinary(publicId);
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: req.file.path },
      select: SAFE_USER_SELECT,
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/users/change-password ───────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { passwordHash: true },
    });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return next(createError("Current password is incorrect.", 401));

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: newHash } });

    // Revoke all refresh tokens — force re-login everywhere
    await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } });

    res.json({ success: true, message: "Password changed. Please log in again." });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users ─── Admin ──────────────────────────────
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        select: {
          ...SAFE_USER_SELECT,
          _count: { select: { appointments: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users/:id ─── Admin ──────────────────────────
exports.getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        ...SAFE_USER_SELECT,
        staff: true,
        appointments: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { service: { select: { name: true } }, payment: { select: { status: true, amount: true } } },
        },
        _count: { select: { appointments: true } },
      },
    });
    if (!user) return next(createError("User not found.", 404));
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/users/:id/status ── Admin ──────────────────
exports.setUserStatus = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return next(createError("You cannot deactivate your own account.", 400));
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: Boolean(req.body.isActive) },
      select: SAFE_USER_SELECT,
    });

    // If deactivating, revoke all tokens
    if (!req.body.isActive) {
      await prisma.refreshToken.deleteMany({ where: { userId: req.params.id } });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};