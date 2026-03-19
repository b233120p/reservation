const { prisma } = require("../lib/prisma");

async function runLottery(weeklyScheduleId) {
  const entries = await prisma.lotteryEntry.findMany({
    where: {
      weeklyScheduleId: weeklyScheduleId,
      status: "pending",
    },
    include: { timeSlot: true, user: true },
  });

  const grouped = entries.reduce((acc, entry) => {
    const key = `${entry.timeSlotId}__${entry.targetDate.toISOString().slice(0, 10)}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const winners = [];
  const losers = [];

  for (const [, group] of Object.entries(grouped)) {
    if (group.length === 0) continue;
    const shuffled = [...group].sort(() => Math.random() - 0.5);
    winners.push(shuffled[0]);
    losers.push(...shuffled.slice(1));
  }

  await prisma.$transaction([
    ...winners.map((w) =>
      prisma.lotteryEntry.update({
        where: { id: w.id },
        data: { status: "won" },
      })
    ),
    prisma.reservation.createMany({
      data: winners.map((w) => ({
        userId: w.userId,
        timeSlotId: w.timeSlotId,
        weeklyScheduleId: weeklyScheduleId,
        reservedDate: w.targetDate,
        bookingType: "lottery",
        status: "confirmed",
      })),
      skipDuplicates: true,
    }),
    prisma.lotteryEntry.updateMany({
      where: { id: { in: losers.map((l) => l.id) } },
      data: { status: "lost" },
    }),
    prisma.weeklySchedule.update({
      where: { id: weeklyScheduleId },
      data: {
        phase: "first_come",
        lotteryExecutedAt: new Date(),
      },
    }),
  ]);

  return { wonCount: winners.length, lostCount: losers.length };
}

module.exports = { runLottery };