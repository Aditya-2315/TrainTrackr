import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  getMyProfile,
  updateMyProfile,
  getMyTrainer,
  getMyWorkoutPlan,
  getMyAllowances,
} from "../controllers/client.controller.js";

const router = Router();

// All client routes require authentication + CLIENT role
router.use(protect);
router.use(restrictTo("CLIENT"));

// ── Profile ───────────────────────────────────────────────────
router.get("/profile", getMyProfile);
router.patch("/profile", updateMyProfile);

// ── Trainer & Workout Plan ────────────────────────────────────
router.get("/trainer", getMyTrainer);
router.get("/workout-plan", getMyWorkoutPlan);

// ── Session Allowances ────────────────────────────────────────
router.get("/allowances", getMyAllowances);

export default router;