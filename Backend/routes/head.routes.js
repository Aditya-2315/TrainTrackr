import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";
import {
  getAllClients,
  getClientById,
  updateClientStatus,
  getAllAssignments,
  createAssignment,
  updateAssignment,
  deactivateAssignment,
  getAllWorkoutPlans,
  getWorkoutPlanById,
  createWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  getClientAllowances,
  createSessionAllowance,
  deleteSessionAllowance,
  getClientSessions
} from "../controllers/head.controller.js";

const router = Router();

// All head routes require authentication + HEAD_TRAINER role
router.use(protect);
router.use(restrictTo("HEAD_TRAINER"));

// ── Client Management ─────────────────────────────────────────
router.get("/clients", getAllClients);
router.get("/clients/:id/sessions", getClientSessions);
router.get("/clients/:id", getClientById);
router.patch("/clients/:id/status", updateClientStatus);

// ── Session Allowances ────────────────────────────────────────
router.get("/clients/:id/allowances", getClientAllowances);
router.post("/clients/:id/allowances", createSessionAllowance);
router.delete("/allowances/:id", deleteSessionAllowance);

// ── Assignments ───────────────────────────────────────────────
router.get("/assignments", getAllAssignments);
router.post("/assignments", createAssignment);
router.patch("/assignments/:id", updateAssignment);
router.delete("/assignments/:id", deactivateAssignment);

// ── Workout Plans ─────────────────────────────────────────────
router.get("/workout-plans", getAllWorkoutPlans);
router.get("/workout-plans/:id", getWorkoutPlanById);
router.post("/workout-plans", upload.single("file"), createWorkoutPlan);
router.patch("/workout-plans/:id", upload.single("file"), updateWorkoutPlan);
router.delete("/workout-plans/:id", deleteWorkoutPlan);

export default router;