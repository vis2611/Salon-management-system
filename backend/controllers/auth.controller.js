const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { sendWelcomeEmail } = require("../utils/email");
const { auditLog } = require("../utils/auditLog");
const { createError } = require("../middleware/errorHandler");

// ── POST /api/auth/register ──────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return next(createError("Email already in use.", 409));

    const passwordHash = await bcrypt.hash(password, 12);

    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "ADMIN" : "CUSTOMER";

    const user = await prisma.user.create({
      data: { name, email, phone: phone || null, passwordHash, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    // Fire-and-forget
    sendWelcomeEmail(user);
    auditLog({ userId: user.id, action: "REGISTER", entityType: "User", entityId: user.id, ipAddress: req.ip });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({ success: true, data: { user, accessToken, refreshToken } });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ─────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true, passwordHash: true, isActive: true },
    });

    // Use constant-time comparison to prevent user-enumeration
    const dummyHash = "$2a$12$dummyhashfortimingattackprevention";
    const isMatch = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, dummyHash);

    if (!user || !isMatch) {
      return next(createError("Invalid email or password.", 401));
    }

    if (!user.isActive) {
      return next(createError("Your account has been deactivated. Contact support.", 403));
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    auditLog({ userId: user.id, action: "LOGIN", entityType: "User", entityId: user.id, ipAddress: req.ip });

    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, data: { user: safeUser, accessToken, refreshToken } });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/refresh ───────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return next(createError("Refresh token required.", 400));

    // Verify JWT signature first
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return next(createError("Invalid or expired refresh token.", 401));
    }

    // Check token exists in DB (detect token reuse)
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      // Potential token reuse attack — revoke all tokens for this user
      if (decoded?.userId) {
        await prisma.refreshToken.deleteMany({ where: { userId: decoded.userId } });
      }
      return next(createError("Refresh token invalid. Please log in again.", 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) return next(createError("User not found.", 401));

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { token: refreshToken } });

    const newAccessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({ success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/logout ────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken, userId: req.user.id } });
    }
    auditLog({ userId: req.user.id, action: "LOGOUT", entityType: "User", entityId: req.user.id, ipAddress: req.ip });
    res.json({ success: true, message: "Logged out successfully." });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/logout-all ────────────────────────────
exports.logoutAll = async (req, res, next) => {
  try {
    await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } });
    res.json({ success: true, message: "Logged out from all devices." });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/me ─────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, avatarUrl: true, createdAt: true,
        staff: { select: { id: true, specialization: true, isAvailable: true } },
      },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/forgot-password ──────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond the same way to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: "If that email exists, a reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Store hashed token as a notification (or add a passwordReset table if you prefer)
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "PASSWORD_RESET",
        title: "Password Reset Token",
        body: hashedToken,
      },
    });

    // In production, send email with: `${CLIENT_URL}/reset-password?token=${resetToken}`
    // sendPasswordResetEmail(user, resetToken);

    res.json({ success: true, message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/reset-password ───────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const notification = await prisma.notification.findFirst({
      where: { type: "PASSWORD_RESET", body: hashedToken },
    });

    if (!notification) return next(createError("Invalid or expired reset token.", 400));

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: notification.userId }, data: { passwordHash } });

    // Invalidate the token and all refresh tokens
    await prisma.notification.delete({ where: { id: notification.id } });
    await prisma.refreshToken.deleteMany({ where: { userId: notification.userId } });

    res.json({ success: true, message: "Password reset successfully. Please log in." });
  } catch (err) {
    next(err);
  }
};