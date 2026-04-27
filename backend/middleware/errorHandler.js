const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  // Log the full error server-side
  logger.error(`${err.message} | ${req.method} ${req.originalUrl}`, {
    stack: err.stack,
    user: req.user?.id,
  });

  // Prisma unique constraint violation (e.g. duplicate email)
  if (err.code === "P2002") {
    const field = err.meta?.target?.[0] || "field";
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    });
  }

  // Prisma record not found
  if (err.code === "P2025") {
    return res.status(404).json({ success: false, message: "Record not found." });
  }

  // Prisma foreign key constraint
  if (err.code === "P2003") {
    return res.status(400).json({ success: false, message: "Invalid reference ID provided." });
  }

  // JWT errors (shouldn't reach here but just in case)
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Invalid token." });
  }

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File too large. Max size is 5MB." });
  }

  // Multer file type error (custom thrown error)
  if (err.message === "INVALID_FILE_TYPE") {
    return res.status(400).json({ success: false, message: "Only JPG, PNG and WEBP images are allowed." });
  }

  // Validation errors from express-validator (thrown manually)
  if (err.isValidationError) {
    return res.status(422).json({ success: false, message: "Validation failed.", errors: err.errors });
  }

  // Custom app errors (thrown with new Error + statusCode)
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Something went wrong. Please try again later."
      : err.message;

  res.status(statusCode).json({ success: false, message });
};

// Helper to create app errors cleanly in controllers
const createError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

module.exports = { errorHandler, createError };