import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "traintrackr/workout-plans",
      resource_type: "raw",      // raw = non-image files like PDFs
      format: "pdf",
      public_id: `workoutplan-${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`,
      // PDFs are delivered as attachments so the browser downloads rather than tries to render inline
      type: "upload",
    };
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

export default upload;