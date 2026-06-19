import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import {getSessionUsage} from "../utils/checkSessionLimit.js";
// ── Get Own Profile ───────────────────────────────────────────
// GET /api/clients/profile
export const getMyProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        clientProfile: {
          select: {
            id: true,
            weight: true,
            height: true,
            phone: true,
            notes: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, "Client profile not found.");
    }

    res.json({ success: true, profile: user });
  } catch (err) {
    next(err);
  }
};

// ── Update Own Profile ────────────────────────────────────────
// PATCH /api/clients/profile
export const updateMyProfile = async (req, res, next) => {
  try {
    const { weight, height, phone, notes } = req.body;

    // At least one field must be provided
    if (
      weight === undefined &&
      height === undefined &&
      phone === undefined &&
      notes === undefined
    ) {
      throw new ApiError(400, "At least one field is required to update.");
    }

    const profile = await prisma.clientProfile.update({
      where: { userId: req.user.id },
      data: {
        ...(weight !== undefined && { weight: parseFloat(weight) }),
        ...(height !== undefined && { height: parseFloat(height) }),
        ...(phone !== undefined && { phone }),
        ...(notes !== undefined && { notes }),
      },
    });

    res.json({ success: true, message: "Profile updated.", profile });
  } catch (err) {
    next(err);
  }
};

// ── Get Assigned Trainer ──────────────────────────────────────
// GET /api/clients/trainer
export const getMyTrainer = async (req, res, next) => {
  try {
    const assignment = await prisma.clientTrainerAssignment.findFirst({
      where: {
        clientId: req.user.id,
        active: true,
      },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            trainerProfile: {
              select: {
                specialization: true,
                experienceYears: true,
                bio: true,
              },
            },
            trainerAvailabilities: {
              orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
            },
          },
        },
      },
    });

    if (!assignment) {
      return res.json({
        success: true,
        message: "You have not been assigned a trainer yet.",
        trainer: null,
      });
    }

    res.json({ success: true, trainer: assignment.trainer });
  } catch (err) {
    next(err);
  }
};

// ── Get Assigned Workout Plan ─────────────────────────────────
// GET /api/clients/workout-plan
export const getMyWorkoutPlan = async (req, res, next) => {
  try {
    const assignment = await prisma.clientTrainerAssignment.findFirst({
      where: {
        clientId: req.user.id,
        active: true,
      },
      include: {
        workout: true,
      },
    });

    // No active assignment at all
    if (!assignment) {
      return res.json({
        success: true,
        message: "You have not been assigned a trainer yet.",
        workoutPlan: null,
      });
    }

    // Assignment exists but no workout plan linked
    if (!assignment.workout) {
      return res.json({
        success: true,
        message: "No workout plan has been assigned yet.",
        workoutPlan: null,
      });
    }

    res.json({ success: true, workoutPlan: assignment.workout });
  } catch (err) {
    next(err);
  }
};

// ── Get Session Allowances ────────────────────────────────────
// GET /api/clients/allowances
export const getMyAllowances = async (req, res, next) => {
  try {
    const clientId = req.user.id;
    const now = new Date();
 
    // Always get usage stats
    const usage = await getSessionUsage(clientId);
 
    // Get active allowances
    const allowances = await prisma.clientSessionAllowance.findMany({
      where: {
        clientId,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { createdAt: "desc" },
    });

    // No limit set — return usage only
    if (allowances.length === 0) {
      return res.json({
        success: true,
        hasLimit: false,
        usage,
      });
    }
 
    // Has limits — calculate usage per allowance
    const allowancesWithUsage = await Promise.all(
      allowances.map(async (allowance) => {

       // Replace the getPeriodBoundaries block inside the allowances.map() in BOTH controllers
const sessionsUsed = await prisma.booking.count({
  where: {
    clientId,
    startTime: {
      gte: allowance.startDate,
      ...(allowance.endDate && { lte: allowance.endDate }),
    },
    status: { in: ["BOOKED", "COMPLETED"] },
  },
});
 
        return {
          id: allowance.id,
          limitType: allowance.limitType,
          maxSessions: allowance.maxSessions,
          isUnlimited: allowance.isUnlimited,
          startDate: allowance.startDate,
          endDate: allowance.endDate,
          sessionsUsed,
          sessionsRemaining: Math.max(0, allowance.maxSessions - sessionsUsed),
        };
      })
    );
 
    res.json({
      success: true,
      hasLimit: true,
      allowances: allowancesWithUsage,
      usage, // overall stats always included
    });
  } catch (err) {
    next(err);
  }
};
 