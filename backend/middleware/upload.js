const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// ── Configure Cloudinary ─────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Cloudinary storage for photos ────────────────────────
const photoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "salon/photos",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 900, crop: "limit", quality: "auto" }],
  },
});

// ── Cloudinary storage for avatars (smaller size) ────────
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "salon/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 200, height: 200, crop: "fill", gravity: "face", quality: "auto" }],
  },
});

// ── File type filter ─────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("INVALID_FILE_TYPE"), false);
  }
  cb(null, true);
};

// ── Upload middlewares ────────────────────────────────────
const uploadPhoto = multer({
  storage: photoStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("photo");

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}).single("avatar");

// ── Delete from Cloudinary ───────────────────────────────
const deleteFromCloudinary = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

module.exports = { uploadPhoto, uploadAvatar, deleteFromCloudinary };