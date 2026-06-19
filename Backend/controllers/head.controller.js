import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import { getSessionUsage } from "../utils/checkSessionLimit.js";
import fs from "fs";
import cloudinary from "../config/cloudinary.js";

// ============================================================
// CLIENT MANAGEMENT
// ============================================================

// ── Get All Clients ───────────────────────────────────────────
// GET /api/head/clients
export const getAllClients = async (req, res, next) => {
  try {
    const clients = await prisma.user.findMany({
      where: { role: "CLIENT" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        clientProfile: true,
        clientAssignments: {
          where: { active: true },
          include: {
            trainer: {
              select: { id: true, name: true, email: true },
            },
            workout: {
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, clients });
  } catch (err) {
    next(err);
  }
};

// ── Get Single Client ─────────────────────────────────────────
// GET /api/head/clients/:id
export const getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        clientProfile: true,
        clientAssignments: {
          include: {
            trainer: {
              select: { id: true, name: true, email: true },
            },
            workout: {
              select: { id: true, title: true, description: true },
            },
          },
          orderBy: { assignedAt: "desc" },
        },
        sessionAllowances: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!client || client.role === "TRAINER") {
      throw new ApiError(404, "Client not found.");
    }

    res.json({ success: true, client });
  } catch (err) {
    next(err);
  }
};

// ── Update Client Status ──────────────────────────────────────
// PATCH /api/head/clients/:id/status
export const updateClientStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "SUSPENDED"].includes(status)) {
      throw new ApiError(400, "Status must be ACTIVE or SUSPENDED.");
    }

    const client = await prisma.user.findUnique({ where: { id } });

    if (!client || client.role !== "CLIENT") {
      throw new ApiError(404, "Client not found.");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    res.json({
      success: true,
      message: `Client ${status === "SUSPENDED" ? "suspended" : "activated"} successfully.`,
      client: updated,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ASSIGNMENTS
// ============================================================

// ── Get All Assignments ───────────────────────────────────────
// GET /api/head/assignments
export const getAllAssignments = async (req, res, next) => {
  try {
    // Optional query param: ?active=true or ?active=false
    const { active } = req.query;

    const where = {};
    if (active === "true") where.active = true;
    if (active === "false") where.active = false;

    const assignments = await prisma.clientTrainerAssignment.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        trainer: {
          select: { id: true, name: true, email: true },
        },
        workout: {
          select: { id: true, title: true },
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    res.json({ success: true, assignments });
  } catch (err) {
    next(err);
  }
};

// ── Assign Trainer to Client ──────────────────────────────────
// POST /api/head/assignments
export const createAssignment = async (req, res, next) => {
  try {
    const { clientId, trainerId, workoutPlanId } = req.body;

    if (!clientId || !trainerId) {
      throw new ApiError(400, "clientId and trainerId are required.");
    }

    // 1. Verify client exists
    const client = await prisma.user.findUnique({ where: { id: clientId } });
    if (!client || client.role !== "CLIENT") {
      throw new ApiError(404, "Client not found.");
    }

    // 2. Verify trainer exists
    const trainer = await prisma.user.findUnique({ where: { id: trainerId } });
    if (!trainer || (trainer.role !== "TRAINER" && trainer.role !== "HEAD_TRAINER")) {
      throw new ApiError(404, "Trainer not found.");
    }

    // 3. Verify workout plan exists if provided
    if (workoutPlanId) {
      const plan = await prisma.workoutPlan.findUnique({
        where: { id: workoutPlanId },
      });
      if (!plan) {
        throw new ApiError(404, "Workout plan not found.");
      }
    }

    // 4. Check if client already has an active assignment
    const existingAssignment = await prisma.clientTrainerAssignment.findFirst({
      where: { clientId, active: true },
    });

    if (existingAssignment) {
      throw new ApiError(
        409,
        "This client already has an active trainer assignment. Deactivate it first."
      );
    }

    // 5. Create assignment
    const assignment = await prisma.clientTrainerAssignment.create({
      data: {
        clientId,
        trainerId,
        ...(workoutPlanId && { workoutPlanId }),
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        trainer: { select: { id: true, name: true, email: true } },
        workout: { select: { id: true, title: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: `${client.name} has been assigned to ${trainer.name}.`,
      assignment,
    });
  } catch (err) {
    next(err);
  }
};

// ── Update Assignment (change workout plan) ───────────────────
// PATCH /api/head/assignments/:id
export const updateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { workoutPlanId } = req.body;

    const assignment = await prisma.clientTrainerAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new ApiError(404, "Assignment not found.");
    }

    // Verify workout plan exists if provided
    if (workoutPlanId) {
      const plan = await prisma.workoutPlan.findUnique({
        where: { id: workoutPlanId },
      });
      if (!plan) {
        throw new ApiError(404, "Workout plan not found.");
      }
    }

    const updated = await prisma.clientTrainerAssignment.update({
      where: { id },
      data: {
        ...(workoutPlanId !== undefined && { workoutPlanId }),
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        trainer: { select: { id: true, name: true, email: true } },
        workout: { select: { id: true, title: true } },
      },
    });

    res.json({ success: true, message: "Assignment updated.", assignment: updated });
  } catch (err) {
    next(err);
  }
};

// ── Deactivate Assignment ─────────────────────────────────────
// DELETE /api/head/assignments/:id
export const deactivateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.clientTrainerAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new ApiError(404, "Assignment not found.");
    }

    if (!assignment.active) {
      throw new ApiError(400, "This assignment is already inactive.");
    }

    // We deactivate instead of deleting to preserve history
    await prisma.clientTrainerAssignment.update({
      where: { id },
      data: { active: false },
    });

    res.json({ success: true, message: "Assignment deactivated." });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// WORKOUT PLANS
// ============================================================

// ── Get All Workout Plans ─────────────────────────────────────
// GET /api/head/workout-plans
export const getAllWorkoutPlans = async (req, res, next) => {
  try {
    const plans = await prisma.workoutPlan.findMany({
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, plans });
  } catch (err) {
    next(err);
  }
};

// ── Get Single Workout Plan ───────────────────────────────────
// GET /api/head/workout-plans/:id
export const getWorkoutPlanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await prisma.workoutPlan.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignments: {
          where: { active: true },
          include: {
            client: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!plan) {
      throw new ApiError(404, "Workout plan not found.");
    }

    res.json({ success: true, plan });
  } catch (err) {
    next(err);
  }
};

// ── Create Workout Plan ───────────────────────────────────────
// POST /api/head/workout-plans
export const createWorkoutPlan = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title) throw new ApiError(400, "Title is required.");

    // Cloudinary URL comes from req.file.path when using multer-storage-cloudinary
    const fileUrl = req.file ? req.file.path : null;
    // Cloudinary public_id needed later for deletion
    const filePublicId = req.file ? req.file.filename : null;

    const plan = await prisma.workoutPlan.create({
      data: {
        title,
        description: description || null,
        fileUrl,
        filePublicId,   // store so we can delete from Cloudinary later
        createdById: req.user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ success: true, plan });
  } catch (err) {
    // If Cloudinary upload succeeded but DB write failed, clean up the orphaned file
    if (req.file?.filename) {
      await cloudinary.uploader.destroy(req.file.filename, {
        resource_type: "raw",
      }).catch(() => {}); // fire and forget
    }
    next(err);
  }
};

// ── Update Workout Plan ───────────────────────────────────────
// PATCH /api/head/workout-plans/:id
export const updateWorkoutPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const existing = await prisma.workoutPlan.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Workout plan not found.");

    let fileUrl = existing.fileUrl;
    let filePublicId = existing.filePublicId;

    if (req.file) {
      // Delete old file from Cloudinary if one existed
      if (existing.filePublicId) {
        await cloudinary.uploader.destroy(existing.filePublicId, {
          resource_type: "raw",
        }).catch(() => {}); // don't block update if deletion fails
      }
      fileUrl = req.file.path;
      filePublicId = req.file.filename;
    }

    const plan = await prisma.workoutPlan.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        fileUrl,
        filePublicId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, plan });
  } catch (err) {
    if (req.file?.filename) {
      await cloudinary.uploader.destroy(req.file.filename, {
        resource_type: "raw",
      }).catch(() => {});
    }
    next(err);
  }
};

// ── Delete Workout Plan ───────────────────────────────────────
// DELETE /api/head/workout-plans/:id
export const deleteWorkoutPlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await prisma.workoutPlan.findUnique({ where: { id } });
    if (!plan) throw new ApiError(404, "Workout plan not found.");

    // Delete file from Cloudinary first
    if (plan.filePublicId) {
      await cloudinary.uploader.destroy(plan.filePublicId, {
        resource_type: "raw",
      }).catch(() => {}); // don't block DB deletion if Cloudinary fails
    }

    await prisma.workoutPlan.delete({ where: { id } });

    res.json({ success: true, message: "Workout plan deleted." });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// SESSION ALLOWANCES
// ============================================================

// ── Get Client Session Allowances ────────────────────────────
// GET /api/head/clients/:id/allowances
export const getClientAllowances = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await prisma.user.findUnique({ where: { id } });
    if (!client || client.role !== "CLIENT") {
      throw new ApiError(404, "Client not found.");
    }

    const allowances = await prisma.clientSessionAllowance.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, allowances });
  } catch (err) {
    next(err);
  }
};

// ── Set Session Allowance ─────────────────────────────────────
// POST /api/head/clients/:id/allowances
export const createSessionAllowance = async (req, res, next) => {
  try {
    const { id: clientId } = req.params;
    const { limitType, maxSessions, startDate, endDate, isUnlimited } = req.body;

    if (!limitType || !startDate) {
      throw new ApiError(400, "limitType and startDate are required.");
    }
    if (!["WEEKLY", "MONTHLY"].includes(limitType)) {
      throw new ApiError(400, "limitType must be WEEKLY or MONTHLY.");
    }
    // If not unlimited, maxSessions is required and must be >= 1
    if (!isUnlimited && (!maxSessions || parseInt(maxSessions) < 1)) {
      throw new ApiError(400, "maxSessions must be at least 1, or set isUnlimited to true.");
    }

    const client = await prisma.user.findUnique({ where: { id: clientId } });
    if (!client || client.role !== "CLIENT") {
      throw new ApiError(404, "Client not found.");
    }

    const existing = await prisma.clientSessionAllowance.findFirst({
      where: {
        clientId,
        limitType,
        OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
      },
    });
    if (existing) {
      throw new ApiError(
        409,
        `Client already has an active ${limitType.toLowerCase()} allowance. Remove it first.`
      );
    }

    const allowance = await prisma.clientSessionAllowance.create({
      data: {
        clientId,
        limitType,
        isUnlimited: !!isUnlimited,
        maxSessions: isUnlimited ? null : parseInt(maxSessions),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    res.status(201).json({
      success: true,
      message: isUnlimited
        ? `Unlimited sessions enabled for ${client.name}.`
        : `Session limit set: ${maxSessions} sessions for ${client.name}.`,
      allowance,
    });
  } catch (err) {
    next(err);
  }
};

// ── Delete Session Allowance ──────────────────────────────────
// DELETE /api/head/allowances/:id
export const deleteSessionAllowance = async (req, res, next) => {
  try {
    const { id } = req.params;

    const allowance = await prisma.clientSessionAllowance.findUnique({
      where: { id },
    });

    if (!allowance) {
      throw new ApiError(404, "Session allowance not found.");
    }

    await prisma.clientSessionAllowance.delete({ where: { id } });

    res.json({ success: true, message: "Session allowance removed." });
  } catch (err) {
    next(err);
  }
};

// ── Get Client Session Stats (Head Trainer only) ──────────────
export const getClientSessions = async (req, res, next) => {
  try {
    const { id: clientId } = req.params;
    const now = new Date();
 
    // Verify client exists
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, email: true, role: true },
    });
 
    if (!client || client.role !== "CLIENT") {
      throw new ApiError(404, "Client not found.");
    }
 
    // Get usage stats
    const usage = await getSessionUsage(clientId);
 
    // Get active allowances with usage
    const allowances = await prisma.clientSessionAllowance.findMany({
      where: {
        clientId,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
    });
 
    const allowancesWithUsage = await Promise.all(
      allowances.map(async (allowance) => {
        const { periodStart, periodEnd } = getPeriodBoundaries(
          allowance.limitType,
          now
        );
 
        const sessionsUsed = await prisma.booking.count({
          where: {
            clientId,
            startTime: { gte: periodStart, lte: periodEnd },
            status: { in: ["BOOKED", "COMPLETED"] },
          },
        });
 
        return {
  id: allowance.id,
  limitType: allowance.limitType,
  isUnlimited: allowance.isUnlimited,
  maxSessions: allowance.maxSessions,
  startDate: allowance.startDate,
  endDate: allowance.endDate,
  sessionsUsed,
  sessionsRemaining: allowance.isUnlimited
    ? null
    : Math.max(0, allowance.maxSessions - sessionsUsed),
};
      })
    );
 
    res.json({
      success: true,
      client: { id: client.id, name: client.name, email: client.email },
      sessionStats: usage,
      hasLimit: allowances.length > 0,
      allowances: allowancesWithUsage,
    });
  } catch (err) {
    next(err);
  }
};

