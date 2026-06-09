// utils/getSessionUsage.js  — or add at top of the controller file
import { prisma } from "../config/prisma.js";

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