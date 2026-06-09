import { Router } from "express";
import passport from "../config/passport.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  register,
  registerTrainer,
  login,
  googleCallback,
  getMe,
  updateMe,
  changePassword,
  inviteTrainer,
} from "../controllers/auth.controller.js";

const router = Router();

// ── Public Routes ─────────────────────────────────────────────
router.post("/register", register);
router.post("/trainer/register", registerTrainer);
router.post("/login", login);

// ── Google OAuth ──────────────────────────────────────────────
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/auth/google/failure",
    session: false,
  }),
  googleCallback
);

router.get("/google/failure", (req, res) => {
  res.status(401).json({ success: false, message: "Google login failed." });
});

// ── Protected Routes ──────────────────────────────────────────
router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);
router.patch("/me/password", protect, changePassword);

// ── Head Trainer Only ─────────────────────────────────────────
router.post("/invite-trainer", protect, restrictTo("HEAD_TRAINER"), inviteTrainer);

export default router;