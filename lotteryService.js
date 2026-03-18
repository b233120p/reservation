// services/lotteryService.js
import { prisma } from "../lib/prisma.js";

/**
 * 木曜日に実行される抽選処理
 * - 枠ごとに申込者の中から1者をランダムに選出
 * - 選ばれた者は reservations に確定、他は "lost" に更新
 * @param {string} weeklyScheduleId
 */
export async function runLottery(weeklyScheduleId) {
  // 全ての pending エントリを時間枠ごとにグループ化して取得
  const entries = await prisma.lotteryEntries.findMany({
    where: {
      weekly_schedule_id: weeklyScheduleId,
      status: "pending",
    },
    include: { time_slot: true, user: true },
  });

  // { "slotId_date" => [entry, ...] } の形にグループ化
  const grouped = entries.reduce((acc, entry) => {
    const key = `${entry.time_slot_id}__${entry.target_date.toISOString().slice(0, 10)}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const winners = [];
  const losers  = [];

  for (const [, group] of Object.entries(grouped)) {
    if (group.length === 0) continue;

    // Fisher-Yates シャッフルの先頭を当選者とする
    const shuffled = [...group].sort(() => Math.random() - 0.5);
    const winner   = shuffled[0];
    const lostOnes = shuffled.slice(1);

    winners.push(winner);
    losers.push(...lostOnes);
  }

  // トランザクションで一括更新
  await prisma.$transaction([
    // 当選者：エントリを won に、予約を作成
    ...winners.map((w) =>
      prisma.lotteryEntries.update({
        where: { id: w.id },
        data: { status: "won" },
      })
    ),
    prisma.reservations.createMany({
      data: winners.map((w) => ({
        user_id:             w.user_id,
        time_slot_id:        w.time_slot_id,
        weekly_schedule_id:  weeklyScheduleId,
        reserved_date:       w.target_date,
        booking_type:        "lottery",
        status:              "confirmed",
      })),
      skipDuplicates: true,
    }),

    // 落選者：エントリを lost に更新
    prisma.lotteryEntries.updateMany({
      where: { id: { in: losers.map((l) => l.id) } },
      data: { status: "lost" },
    }),

    // 週次スケジュールのフェーズを "first_come" に移行
    prisma.weeklySchedules.update({
      where: { id: weeklyScheduleId },
      data: {
        phase: "first_come",
        lottery_executed_at: new Date(),
      },
    }),
  ]);

  return { wonCount: winners.length, lostCount: losers.length };
}
