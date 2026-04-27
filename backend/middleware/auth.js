const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ success: false, message: "Authorization header missing. Send: Authorization: Bearer <token>" });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Invalid token format. Must be: Bearer <token>" });
    }

    const token = authHeader.split(" ")[1];

    if (!token || token.trim() === "") {
      return res.status(401).json({ success: false, message: "Token is empty. Login again to get a fresh token." });
    }

    if (!process.env.JWT_ACCESS_SECRET) {
      console.error("JWT_ACCESS_SECRET is not set in .env");
      return res.status(500).json({ success: false, message: "Server misconfiguration: JWT secret not set." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired. Use POST /api/auth/refresh with your refreshToken to get a new one.",
          expiredAt: err.expiredAt,
          fix: "Call POST /api/auth/refresh with body: { refreshToken: '<your_refresh_token>' }"
        });
      }
      return res.status(401).json({ success: false, message: `Invalid token: ${err.message}. Login again.` });
    }

    if (!decoded.userId) {
      return res.status(401).json({ success: false, message: "Token payload malformed. Login again." });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "User associated with this token no longer exists." });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: "Account deactivated. Contact support." });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated." });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Your role: " + req.user.role + ". Required: " + roles.join(" or ") + ".",
      });
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return next();
    const token = authHeader.split(" ")[1];
    if (!token || !process.env.JWT_ACCESS_SECRET) return next();
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    if (user && user.isActive) req.user = user;
    next();
  } catch { next(); }
};

module.exports = { protect, authorize, optionalAuth };