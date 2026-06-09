import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";

// ── Get Own Profile ───────────────────────────────────────────
// GET /api/trainers/profile
export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await prisma.trainerProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!profile) {
      throw new ApiError(404, "Trainer profile not found.");
    }

    res.json({ success: true, profile });
  } catch (err) {
    next(err);
  }
};

// ── Update Own Profile ────────────────────────────────────────
// PATCH /api/trainers/profile
export const updateMyProfile = async (req, res, next) => {
  try {
    const { specialization, experienceYears, bio } = req.body;

    const profile = await prisma.trainerProfile.update({
      where: { userId: req.user.id },
      data: {
        ...(specialization !== undefined && { specialization }),
        ...(experienceYears !== undefined && { experienceYears }),
        ...(bio !== undefined && { bio }),
      },
    });

    res.json({ success: true, message: "Profile updated.", profile });
  } catch (err) {
    next(err);
  }
};

// ── Get Own Availability ──────────────────────────────────────
// GET /api/trainers/availability
export const getMyAvailability = async (req, res, next) => {
  try {
    const availability = await prisma.trainerAvailability.findMany({
      where: { trainerId: req.user.id },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    res.json({ success: true, availability });
  } catch (err) {
    next(err);
  }
};

// ── Add Availability Slot ─────────────────────────────────────
// POST /api/trainers/availability
export const addAvailability = async (req, res, next) => {
  try {
    const { dayOfWeek, startTime, endTime } = req.body;

    // 1. Validate input
    if (dayOfWeek === undefined || !startTime || !endTime) {
      throw new ApiError(400, "dayOfWeek, startTime and endTime are required.");
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      throw new ApiError(400, "dayOfWeek must be between 0 (Sunday) and 6 (Saturday).");
    }

    // 2. Validate time format HH:MM
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new ApiError(400, "Times must be in HH:MM format (e.g. 09:00).");
    }

    // 3. Make sure end time is after start time
    if (startTime >= endTime) {
      throw new ApiError(400, "endTime must be after startTime.");
    }

    // 4. Check for overlapping slots on the same day
    const existing = await prisma.trainerAvailability.findMany({
      where: { trainerId: req.user.id, dayOfWeek },
    });

    const hasOverlap = existing.some((slot) => {
      return startTime < slot.endTime && endTime > slot.startTime;
    });

    if (hasOverlap) {
      throw new ApiError(
        409,
        "This slot overlaps with an existing availability slot on the same day."
      );
    }

    // 5. Create the slot
    const slot = await prisma.trainerAvailability.create({
      data: {
        trainerId: req.user.id,
        dayOfWeek,
        startTime,
        endTime,
      },
    });

    res.status(201).json({
      success: true,
      message: "Availability slot added.",
      slot,
    });
  } catch (err) {
    next(err);
  }
};

// ── Delete Availability Slot ──────────────────────────────────
// DELETE /api/trainers/availability/:id
export const deleteAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;

    const slot = await prisma.trainerAvailability.findUnique({
      where: { id },
    });

    if (!slot) {
      throw new ApiError(404, "Availability slot not found.");
    }

    if (slot.trainerId !== req.user.id) {
      throw new ApiError(403, "You do not have permission to delete this slot.");
    }

    await prisma.trainerAvailability.delete({ where: { id } });

    res.json({ success: true, message: "Availability slot removed." });
  } catch (err) {
    next(err);
  }
};

// ── Get Own Exceptions ────────────────────────────────────────
// GET /api/trainers/availability/exceptions
export const getExceptions = async (req, res, next) => {
  try {
    const exceptions = await prisma.availabilityException.findMany({
      where: { trainerId: req.user.id },
      orderBy: { startTime: "asc" },
    });

    res.json({ success: true, exceptions });
  } catch (err) {
    next(err);
  }
};

// ── Add Availability Exception ────────────────────────────────
// POST /api/trainers/availability/exceptions
export const addException = async (req, res, next) => {
  try {
    const { startTime, endTime, type, note } = req.body;

    // 1. Validate input
    if (!startTime || !endTime || !type) {
      throw new ApiError(400, "startTime, endTime and type are required.");
    }

    if (!["BLOCKED", "EXTRA_AVAILABLE"].includes(type)) {
      throw new ApiError(400, "type must be BLOCKED or EXTRA_AVAILABLE.");
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ApiError(400, "Invalid date format. Use ISO 8601 (e.g. 2025-06-10T09:00:00Z).");
    }

    if (start >= end) {
      throw new ApiError(400, "endTime must be after startTime.");
    }

    if (start < new Date()) {
      throw new ApiError(400, "Cannot add exceptions in the past.");
    }

    // 2. Check for overlapping exceptions
    const existing = await prisma.availabilityException.findMany({
      where: {
        trainerId: req.user.id,
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (existing.length > 0) {
      throw new ApiError(409, "This exception overlaps with an existing exception.");
    }

    // 3. Create exception
    const exception = await prisma.availabilityException.create({
      data: {
        trainerId: req.user.id,
        startTime: start,
        endTime: end,
        type,
        note,
      },
    });

    res.status(201).json({
      success: true,
      message: "Availability exception added.",
      exception,
    });
  } catch (err) {
    next(err);
  }
};

// ── Delete Availability Exception ─────────────────────────────
// DELETE /api/trainers/availability/exceptions/:id
export const deleteException = async (req, res, next) => {
  try {
    const { id } = req.params;

    const exception = await prisma.availabilityException.findUnique({
      where: { id },
    });

    if (!exception) {
      throw new ApiError(404, "Exception not found.");
    }

    if (exception.trainerId !== req.user.id) {
      throw new ApiError(403, "You do not have permission to delete this exception.");
    }

    await prisma.availabilityException.delete({ where: { id } });

    res.json({ success: true, message: "Exception removed." });
  } catch (err) {
    next(err);
  }
};

// ── Get My Assigned Clients ───────────────────────────────────
// GET /api/trainers/clients
export const getMyClients = async (req, res, next) => {
  try {
    const assignments = await prisma.clientTrainerAssignment.findMany({
      where: {
        trainerId: req.user.id,
        active: true,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            clientProfile: true,
          },
        },
        workout: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    const clients = assignments.map((a) => ({
      assignmentId: a.id,
      assignedAt: a.assignedAt,
      client: a.client,
      workoutPlan: a.workout,
    }));

    res.json({ success: true, clients });
  } catch (err) {
    next(err);
  }
};

// ── Get All Trainers (Head Trainer only) ──────────────────────
// GET /api/trainers
export const getAllTrainers = async (req, res, next) => {
  try {
    const trainers = await prisma.user.findMany({
      where: { role: "TRAINER" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        trainerProfile: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, trainers });
  } catch (err) {
    next(err);
  }
};

// ── Get Single Trainer (Head Trainer only) ────────────────────
// GET /api/trainers/:id
export const getTrainerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const trainer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        trainerProfile: true,
        trainerAvailabilities: true,
        trainerAssignments: {
          where: { active: true },
          include: {
            client: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!trainer || trainer.role === "CLIENT") {
      throw new ApiError(404, "Trainer not found.");
    }

    res.json({ success: true, trainer });
  } catch (err) {
    next(err);
  }
};

// ── Get Trainer Availability (Head Trainer only) ──────────────
// GET /api/trainers/:id/availability
export const getTrainerAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Make sure target user is actually a trainer
    const trainer = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, role: true },
    });

    if (!trainer || trainer.role === "CLIENT") {
      throw new ApiError(404, "Trainer not found.");
    }

    const availability = await prisma.trainerAvailability.findMany({
      where: { trainerId: id },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    res.json({
      success: true,
      trainer: { id: trainer.id, name: trainer.name },
      availability,
    });
  } catch (err) {
    next(err);
  }
};

// ── Get Trainer Exceptions (Head Trainer only) ────────────────
// GET /api/trainers/:id/availability/exceptions
export const getTrainerExceptions = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Make sure target user is actually a trainer
    const trainer = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, role: true },
    });

    if (!trainer || trainer.role === "CLIENT") {
      throw new ApiError(404, "Trainer not found.");
    }

    const exceptions = await prisma.availabilityException.findMany({
      where: { trainerId: id },
      orderBy: { startTime: "asc" },
    });

    res.json({
      success: true,
      trainer: { id: trainer.id, name: trainer.name },
      exceptions,
    });
  } catch (err) {
    next(err);
  }
};

// ── Update Trainer Status (Head Trainer only) ─────────────────
// PATCH /api/trainers/:id/status
export const updateTrainerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "SUSPENDED"].includes(status)) {
      throw new ApiError(400, "Status must be ACTIVE or SUSPENDED.");
    }

    const trainer = await prisma.user.findUnique({ where: { id } });

    if (!trainer || trainer.role === "CLIENT") {
      throw new ApiError(404, "Trainer not found.");
    }

    if (trainer.role === "HEAD_TRAINER") {
      throw new ApiError(403, "Cannot change the status of the head trainer.");
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
      message: `Trainer ${status === "SUSPENDED" ? "suspended" : "activated"} successfully.`,
      trainer: updated,
    });
  } catch (err) {
    next(err);
  }
};