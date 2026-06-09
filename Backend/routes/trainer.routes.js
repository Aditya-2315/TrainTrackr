import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  getMyProfile,
  updateMyProfile,
  getMyAvailability,
  addAvailability,
  deleteAvailability,
  getExceptions,
  addException,
  deleteException,
  getMyClients,
  getAllTrainers,
  getTrainerById,
  getTrainerAvailability,
  getTrainerExceptions,
  updateTrainerStatus,
} from "../controllers/trainer.controller.js";

const router = Router();

// All trainer routes require authentication
router.use(protect);

// ── IMPORTANT: All static/specific routes MUST come before /:id ──
// Express matches routes top to bottom. If /:id is defined first,
// it will catch "profile", "availability", "clients" as ID parameters.

// ── Trainer + Head Trainer ────────────────────────────────────

// Profile
router.get("/profile", restrictTo("HEAD_TRAINER", "TRAINER"), getMyProfile);
router.patch("/profile", restrictTo("HEAD_TRAINER", "TRAINER"), updateMyProfile);

// Own availability
router.get("/availability", restrictTo("HEAD_TRAINER", "TRAINER"), getMyAvailability);
router.post("/availability", restrictTo("HEAD_TRAINER", "TRAINER"), addAvailability);
router.delete("/availability/:id", restrictTo("HEAD_TRAINER", "TRAINER"), deleteAvailability);

// Own exceptions — must come before /availability/:id to avoid conflict
router.get("/availability/exceptions", restrictTo("HEAD_TRAINER", "TRAINER"), getExceptions);
router.post("/availability/exceptions", restrictTo("HEAD_TRAINER", "TRAINER"), addException);
router.delete("/availability/exceptions/:id", restrictTo("HEAD_TRAINER", "TRAINER"), deleteException);

// Clients
router.get("/clients", restrictTo("HEAD_TRAINER", "TRAINER"), getMyClients);

// ── Head Trainer Only ─────────────────────────────────────────
// These /:id routes come LAST so they don't swallow the routes above

router.get("/", restrictTo("HEAD_TRAINER"), getAllTrainers);

// Specific trainer availability — before /:id
router.get("/:id/availability", restrictTo("HEAD_TRAINER"), getTrainerAvailability);
router.get("/:id/availability/exceptions", restrictTo("HEAD_TRAINER"), getTrainerExceptions);
router.patch("/:id/status", restrictTo("HEAD_TRAINER"), updateTrainerStatus);

// /:id must always be last among GET routes
router.get("/:id", restrictTo("HEAD_TRAINER"), getTrainerById);

export default router;