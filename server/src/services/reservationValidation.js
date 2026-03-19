const { prisma } = require("../lib/prisma");

const WEEKLY_LIMIT_HOURS = 4;

async function checkWeeklyLimit(userId, weeklyScheduleId, additionalHours) {
  const existing = await prisma.reservation.findMany({
    where: {
      userId: userId,
      weeklyScheduleId: weeklyScheduleId,
      status: "confirmed",
      bookingType: "lottery",
    },
    include: { timeSlot: true },
  });

  const usedHours = existing.reduce((sum, r) => sum + r.timeSlot.slotHours, 0);

  const pendingEntries = await prisma.lotteryEntry.findMany({
    where: {
      userId: userId,
      weeklyScheduleId: weeklyScheduleId,
      status: "pending",
    },
    include: { timeSlot: true },
  });

  const pendingHours = pendingEntries.reduce((sum, e) => sum + e.timeSlot.slotHours, 0);
  const totalAfter = usedHours + pendingHours + additionalHours;

  return {
    allowed: totalAfter <= WEEKLY_LIMIT_HOURS,
    usedHours: usedHours + pendingHours,
    remainingHours: Math.max(0, WEEKLY_LIMIT_HOURS - usedHours - pendingHours),
  };
}

module.exports = { checkWeeklyLimit };