import multer from "multer";
import fs from "fs";
import ApiError from "../utils/ApiError.js";

// ── Ensure upload directory exists ────────────────────────────
const uploadDir = "uploads/workout-plans";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ── Storage config ────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // e.g. workoutplan-1714000000000-originalname.pdf
    const uniqueName = `workoutplan-${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, uniqueName);
  },
});

// ── File filter — only allow PDFs and images ──────────────────
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only PDF, JPG, and PNG files are allowed."), false);
  }
};

// ── Multer instance ───────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

export default upload;