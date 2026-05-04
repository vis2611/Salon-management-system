// ══════════════════════════════════════════════════════════
//  ROUTES  —  src/routes/service.routes.js
// ══════════════════════════════════════════════════════════
const router = require("express").Router();
const { body, param, query } = require("express-validator");
const { validate } = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");
const { uploadPhoto } = require("../middleware/upload");
const c = require("../controllers/service.controller");

// ── GET  /api/services ────── Public: browse all services
router.get(
  "/",
  [
    query("categoryId").optional().isString(),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().toInt().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("search").optional().isString().isLength({ max: 100 }),
  ],
  validate,
  c.getServices
);

// ── GET  /api/services/categories ─── Public: all categories
router.get("/categories", c.getCategories);

// ── GET  /api/services/:id ─── Public: single service
router.get("/:id", [param("id").notEmpty()], validate, c.getService);

// ── POST /api/services ─── Admin only: create
router.post(
  "/",
  protect,
  authorize("ADMIN"),
  uploadPhoto,
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("categoryId").notEmpty().withMessage("Category is required."),
    body("price").isFloat({ min: 0 }).withMessage("Valid price required."),
    body("durationMins").isInt({ min: 5 }).withMessage("Duration must be at least 5 minutes."),
    body("description").optional().isLength({ max: 1000 }),
  ],
  validate,
  c.createService
);

// ── PUT /api/services/:id ─── Admin only: update
router.put(
  "/:id",
  protect,
  authorize("ADMIN"),
  uploadPhoto,
  [
    param("id").notEmpty(),
    body("name").optional().trim().notEmpty(),
    body("price").optional().isFloat({ min: 0 }),
    body("durationMins").optional().isInt({ min: 5 }),
  ],
  validate,
  c.updateService
);

// ── DELETE /api/services/:id ─── Admin only
router.delete("/:id", protect, authorize("ADMIN"), [param("id").notEmpty()], validate, c.deleteService);

// ── POST /api/services/categories ─── Admin: create category
router.post(
  "/categories",
  protect,
  authorize("ADMIN"),
  [
    body("name").trim().notEmpty(),
    body("slug").trim().notEmpty().isSlug().withMessage("Slug must be URL-friendly."),
  ],
  validate,
  c.createCategory
);

module.exports = router;