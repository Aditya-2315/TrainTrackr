import { PrismaClient } from "../generated/index.js";
const prisma = new PrismaClient();

export const checkSessionLimit = async (clientId, startTime) => {
  const now = new Date();

  // Find active allowance for this client
  const allowance = await prisma.clientSessionAllowance.findFirst({
    where: {
      clientId,
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    orderBy: { createdAt: "desc" },
  });

  // No allowance set — block booking
  if (!allowance) {
    return {
      allowed: false,
      message: "No session allowance has been set for this client. Please contact your trainer.",
      stats: await getSessionUsage(clientId),
    };
  }

  // Count sessions used against this allowance
  // "used" = BOOKED or COMPLETED sessions from allowance startDate onwards
  const sessionsUsed = await prisma.booking.count({
    where: {
      clientId,
      startTime: { gte: allowance.startDate },
      status: { in: ["BOOKED", "COMPLETED"] },
    },
  });

  const sessionsRemaining = Math.max(0, allowance.maxSessions - sessionsUsed);

  if (sessionsRemaining <= 0) {
    return {
      allowed: false,
      message: "You have used all your allocated sessions. Please contact your trainer to top up.",
      stats: await getSessionUsage(clientId),
    };
  }

  return {
    allowed: true,
    sessionsUsed,
    sessionsRemaining,
    maxSessions: allowance.maxSessions,
    stats: await getSessionUsage(clientId),
  };
};

export const getSessionUsage = async (clientId) => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, thisWeek, thisMonth] = await Promise.all([
    prisma.booking.count({
      where: { clientId, status: { in: ["BOOKED", "COMPLETED"] } },
    }),
    prisma.booking.count({
      where: {
        clientId,
        status: { in: ["BOOKED", "COMPLETED"] },
        startTime: { gte: startOfWeek },
      },
    }),
    prisma.booking.count({
      where: {
        clientId,
        status: { in: ["BOOKED", "COMPLETED"] },
        startTime: { gte: startOfMonth },
      },
    }),
  ]);

  return { total, thisWeek, thisMonth };
};