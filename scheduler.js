// scheduler.js
import cron from "node-cron";
import { prisma } from "./lib/prisma.js";
import { runLottery } from "./services/lotteryService.js";

// 毎週木曜 09:00 に抽選を実行
cron.schedule("0 9 * * 4", async () => {
  console.log("[Cron] 抽選処理開始:", new Date().toISOString());

  // 今週 (月〜日) の週次スケジュールを取得
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1); // 月曜基点
  monday.setHours(0, 0, 0, 0);

  const schedule = await prisma.weeklySchedules.findFirst({
    where: {
      week_start: monday,
      phase: "lottery_open", // 抽選申込フェーズのものだけ
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
