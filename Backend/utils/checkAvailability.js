import prisma from "../config/prisma.js";

// ── Check Trainer Availability ────────────────────────────────
// Returns { available: true } or { available: false, reason: "..." }

const checkTrainerAvailability = async (trainerId, startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  // ── Step A: Check for BLOCKED exceptions ─────────────────────
  const blockedException = await prisma.availabilityException.findFirst({
    where: {
      trainerId,
      type: "BLOCKED",
      startTime: { lte: end },
      endTime: { gte: start },
    },
  });

  if (blockedException) {
    return {
      available: false,
      reason: `Trainer is unavailable during this time${blockedException.note ? ` (${blockedException.note})` : ""}.`,
    };
  }

  // ── Step B: Check for EXTRA_AVAILABLE exceptions ──────────────
  // If an extra available exception fully covers the booking → allow it
  // and skip the weekly schedule check
  const extraException = await prisma.availabilityException.findFirst({
    where: {
      trainerId,
      type: "EXTRA_AVAILABLE",
      startTime: { lte: start },
      endTime: { gte: end },
    },
  });

  if (extraException) {
    return { available: true };
  }

  // ── Step C: Check weekly schedule ────────────────────────────
  const dayOfWeek = start.getDay(); // 0 = Sunday, 6 = Saturday

  // Convert booking times to HH:MM strings for comparison
  const bookingStartStr = start.toTimeString().slice(0, 5); // "HH:MM"
  const bookingEndStr = end.toTimeString().slice(0, 5);     // "HH:MM"

  const slots = await prisma.trainerAvailability.findMany({
    where: { trainerId, dayOfWeek },
  });

  if (slots.length === 0) {
    return {
      available: false,
      reason: "Trainer has no availability on this day.",
    };
  }

  // Check if booking fits entirely within any single slot
  const fitsInSlot = slots.some(
    (slot) =>
      slot.startTime <= bookingStartStr && slot.endTime >= bookingEndStr
  );

  if (!fitsInSlot) {
    return {
      available: false,
      reason: `Trainer is only available during: ${slots
        .map((s) => `${s.startTime}–${s.endTime}`)
        .join(", ")} on this day.`,
    };
  }

  return { available: true };
};

export default checkTrainerAvailability;