import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
  completeBooking,
  getAllBookings,
} from "../controllers/booking.controller.js";

const router = Router();

// All booking routes require authentication
router.use(protect);

// ── Head Trainer Only ─────────────────────────────────────────
// Must be before /:id to avoid conflict
router.get("/all", restrictTo("HEAD_TRAINER"), getAllBookings);

// ── Client + Trainer (own bookings) ──────────────────────────
router.get("/", restrictTo("CLIENT", "TRAINER","HEAD_TRAINER"), getMyBookings);

router.post("/", protect, restrictTo("CLIENT", "HEAD_TRAINER"), createBooking);
router.patch("/:id/cancel", protect, restrictTo("CLIENT", "TRAINER", "HEAD_TRAINER"), cancelBooking);
router.patch("/:id/reschedule", protect, restrictTo("CLIENT", "TRAINER", "HEAD_TRAINER"), rescheduleBooking);
// ── Trainer Only ──────────────────────────────────────────────
router.patch("/:id/complete", restrictTo("TRAINER","HEAD_TRAINER"), completeBooking);

// ── Client + Trainer + Head Trainer ──────────────────────────
// /:id must be last
router.get("/:id", restrictTo("CLIENT", "TRAINER", "HEAD_TRAINER"), getBookingById);

export default router;