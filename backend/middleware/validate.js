const { validationResult } = require("express-validator");

// Run after validator chains - throws structured error if validation fails
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error("Validation failed");
    err.isValidationError = true;
    err.errors = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(err);
  }
  next();
};

module.exports = { validate };