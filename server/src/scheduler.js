const cron = require("node-cron");
const { prisma } = require("./lib/prisma");
const { runLottery } = require("./services/lotteryService");

// 毎週木曜 09:00 に抽選を実行
cron.schedule("0 9 * * 4", async () => {
  console.log("[Cron] 抽選処理開始:", new Date().toISOString());

  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  monday.setHours(0, 0, 0, 0);

  const schedule = await prisma.weeklySchedule.findFirst({
    where: {
      weekStart: monday,
      phase: "lottery_open",
    },
  });

  if (!schedule) {
    console.log("[Cron] 対象スケジュールなし");
    return;
  }

  const result = await runLottery(schedule.id);
  console.log(`[Cron] 抽選完了: 当選=${result.wonCount}, 落選=${result.lostCount}`);
}, {
  timezone: "Asia/Tokyo",
});

console.log("[Cron] スケジューラ起動済み");