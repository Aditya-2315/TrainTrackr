import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import checkTrainerAvailability from "../utils/checkAvailability.js";
import {checkSessionLimit} from "../utils/checkSessionLimit.js";

// ── Create Booking ────────────────────────────────────────────
// POST /api/bookings
// POST /api/bookings
export const createBooking = async (req, res, next) => {
  try {
    const role = req.user.role;

    let clientId;
    if (role === "HEAD_TRAINER") {
      if (!req.body.clientId) {
        return next(new ApiError("clientId is required when booking as head trainer", 400));
      }
      clientId = req.body.clientId;
    } else {
      clientId = req.user.id;
    }

    const { startTime, endTime } = req.body;

    const assignment = await prisma.clientTrainerAssignment.findFirst({
      where: { clientId, active: true },
    });
    if (!assignment) {
      return next(new ApiError("No active trainer assignment found for this client", 404));
    }

    const trainerId = assignment.trainerId;

    const available = await checkTrainerAvailability(trainerId, startTime, endTime);
    if (!available) {
      return next(new ApiError("Trainer is not available at the requested time", 400));
    }

    const overlap = await prisma.booking.findFirst({
      where: {
        trainerId,
        status: { in: ["BOOKED", "RESCHEDULED"] },
        OR: [
          { startTime: { lt: new Date(endTime) }, endTime: { gt: new Date(startTime) } },
        ],
      },
    });
    if (overlap) {
      return next(new ApiError("Trainer already has a booking in this time slot", 409));
    }

    // ── Allowance check ──
    const now = new Date();
    const activeAllowance = await prisma.clientSessionAllowance.findFirst({
      where: {
        clientId,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { createdAt: "desc" },
    });

    if (!activeAllowance) {
      return next(
        new ApiError(403, "No session allowance has been set. Contact your trainer.")
      );
    }

    // Always compute usage — needed for the response stats either way
    const sessionsUsed = await prisma.booking.count({
      where: {
        clientId,
        startTime: {
          gte: activeAllowance.startDate,
          ...(activeAllowance.endDate && { lte: activeAllowance.endDate }),
        },
        status: { in: ["BOOKED", "COMPLETED"] },
      },
    });

    // Only enforce the cap if NOT unlimited
    if (!activeAllowance.isUnlimited && sessionsUsed >= activeAllowance.maxSessions) {
      return next(
        new ApiError(
          403,
          `Session limit reached. You've used ${sessionsUsed} of ${activeAllowance.maxSessions} sessions.`
        )
      );
    }

    const booking = await prisma.booking.create({
      data: {
        clientId,
        trainerId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "BOOKED",
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        trainer: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({
      success: true,
      booking,
      sessionStats: {
        sessionsUsed: sessionsUsed + 1,
        isUnlimited: activeAllowance.isUnlimited,
        maxSessions: activeAllowance.maxSessions,
        sessionsRemaining: activeAllowance.isUnlimited
          ? null
          : Math.max(0, activeAllowance.maxSessions - (sessionsUsed + 1)),
      },
    });
  } catch (err) {
    next(err);
  }
};


// ── Get My Bookings ───────────────────────────────────────────
// GET /api/bookings
// Works for both CLIENT and TRAINER
export const getMyBookings = async (req, res, next) => {
  try {
    const { status, from, to } = req.query;
    const isClient = req.user.role === "CLIENT";

    const where = isClient
      ? { clientId: req.user.id }
      : { trainerId: req.user.id };

    if (status) {
      const validStatuses = ["BOOKED", "COMPLETED", "CANCELLED", "RESCHEDULED"];
      if (!validStatuses.includes(status.toUpperCase())) {
        throw new ApiError(400, "Invalid status filter.");
      }
      where.status = status.toUpperCase();
    }

    if (from || to) {
      where.startTime = {};
      if (from) where.startTime.gte = new Date(from);
      if (to) where.startTime.lte = new Date(to);
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, email: true } },
        trainer: { select: { id: true, name: true, email: true } },
        previous: {
          select: { id: true, startTime: true, endTime: true, status: true },
        },
      },
      orderBy: { startTime: "desc" },
    });

    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
};

// ── Get Single Booking ────────────────────────────────────────
// GET /api/bookings/:id
export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true } },
        trainer: { select: { id: true, name: true, email: true } },
        previous: {
          select: { id: true, startTime: true, endTime: true, status: true },
        },
        next: {
          select: { id: true, startTime: true, endTime: true, status: true },
        },
      },
    });

    if (!booking) {
      throw new ApiError(404, "Booking not found.");
    }

    const isOwner =
      booking.clientId === req.user.id ||
      booking.trainerId === req.user.id ||
      req.user.role === "HEAD_TRAINER";

    if (!isOwner) {
      throw new ApiError(
        403,
        "You do not have permission to view this booking."
      );
    }

    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

// ── Cancel Booking ────────────────────────────────────────────
// PATCH /api/bookings/:id/cancel
export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body; // reason lives in notes field
    const role = req.user.role;
    const userId = req.user.id;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return next(new ApiError("Booking not found", 404));
    if (booking.status !== "BOOKED") {
      return next(new ApiError("Only BOOKED sessions can be cancelled", 400));
    }

    // CLIENT can only cancel their own bookings
    // TRAINER can only cancel bookings where they are the trainer
    // HEAD_TRAINER can cancel any booking
    if (role === "CLIENT" && booking.clientId !== userId) {
      return next(new ApiError("Not authorised to cancel this booking", 403));
    }
    if (role === "TRAINER" && booking.trainerId !== userId) {
      return next(new ApiError("Not authorised to cancel this booking", 403));
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: "CANCELLED",
        ...(notes && { notes }),
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        trainer: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ success: true, booking: updated });
  } catch (err) {
    next(err);
  }
};

// ── Reschedule Booking ────────────────────────────────────────
// PATCH /api/bookings/:id/reschedule
export const rescheduleBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, notes } = req.body;
    const role = req.user.role;
    const userId = req.user.id;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return next(new ApiError("Booking not found", 404));
    if (booking.status !== "BOOKED") {
      return next(new ApiError("Only BOOKED sessions can be rescheduled", 400));
    }

    // Ownership checks — same logic as cancel
    if (role === "CLIENT" && booking.clientId !== userId) {
      return next(new ApiError("Not authorised to reschedule this booking", 403));
    }
    if (role === "TRAINER" && booking.trainerId !== userId) {
      return next(new ApiError("Not authorised to reschedule this booking", 403));
    }

    // Availability check for new time
    const available = await checkTrainerAvailability(booking.trainerId, startTime, endTime);
    if (!available) {
      return next(new ApiError("Trainer is not available at the new time", 400));
    }

    // Overlap check (exclude current booking)
    const overlap = await prisma.booking.findFirst({
      where: {
        trainerId: booking.trainerId,
        id: { not: id },
        status: { in: ["BOOKED"] },
        OR: [
          { startTime: { lt: new Date(endTime) }, endTime: { gt: new Date(startTime) } },
        ],
      },
    });
    if (overlap) {
      return next(new ApiError("Trainer already has a booking in this time slot", 409));
    }

    // Mark old booking as rescheduled
    await prisma.booking.update({
      where: { id },
      data: {
        status: "RESCHEDULED",
        ...(notes && { notes }),
      },
    });

    // Create new booking referencing old one
    const newBooking = await prisma.booking.create({
      data: {
        clientId: booking.clientId,
        trainerId: booking.trainerId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "BOOKED",
        rescheduledFrom: id,
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        trainer: { select: { id: true, name: true, email: true } },
        previous: { select: { id: true, startTime: true, endTime: true, status: true, notes: true } },
      },
    });

    res.json({ success: true, booking: newBooking });
  } catch (err) {
    next(err);
  }
};


// ── Complete Booking (Trainer only) ───────────────────────────
// PATCH /api/bookings/:id/complete
export const completeBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      throw new ApiError(404, "Booking not found.");
    }

    if (booking.trainerId !== req.user.id) {
      throw new ApiError(
        403,
        "You do not have permission to complete this booking."
      );
    }

    if (booking.status !== "BOOKED") {
      throw new ApiError(
        400,
        `Cannot complete a booking with status: ${booking.status}.`
      );
    }

    if (new Date(booking.startTime) > new Date()) {
      throw new ApiError(
        400,
        "Cannot complete a session that hasn't started yet."
      );
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "COMPLETED" },
      include: {
        client: { select: { id: true, name: true } },
        trainer: { select: { id: true, name: true } },
      },
    });

    res.json({
      success: true,
      message: "Session marked as completed.",
      booking: updated,
    });
  } catch (err) {
    next(err);
  }
};

// ── Get All Bookings (Head Trainer only) ──────────────────────
// GET /api/bookings/all
export const getAllBookings = async (req, res, next) => {
  try {
    const { status, from, to, trainerId, clientId } = req.query;

    const where = {};

    if (status) {
      const validStatuses = ["BOOKED", "COMPLETED", "CANCELLED", "RESCHEDULED"];
      if (!validStatuses.includes(status.toUpperCase())) {
        throw new ApiError(400, "Invalid status filter.");
      }
      where.status = status.toUpperCase();
    }

    if (from || to) {
      where.startTime = {};
      if (from) where.startTime.gte = new Date(from);
      if (to) where.startTime.lte = new Date(to);
    }

    if (trainerId) where.trainerId = trainerId;
    if (clientId) where.clientId = clientId;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, email: true } },
        trainer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startTime: "desc" },
    });

    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
};