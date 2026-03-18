// services/reservationValidation.js
import { prisma } from "../lib/prisma.js";

const WEEKLY_LIMIT_HOURS = 4;

/**
 * 第1・2段階の週上限チェック（4時間分）
 * 第3段階（first_come フェーズ）では呼び出さない
 */
export async function checkWeeklyLimit(userId, weeklyScheduleId, additionalHours) {
  // 当週の確定済み予約（抽選当選 + 通常先着は除外）を集計
  const existing = await prisma.reservations.findMany({
    where: {
      user_id: userId,
      weekly_schedule_id: weeklyScheduleId,
      status: "confirmed",
      booking_type: "lottery", // 抽選で確定したもののみカウント
    },
    include: { time_slot: true },
  });

  const usedHours = existing.reduce((sum, r) => sum + r.time_slot.slot_hours, 0);

  // 申込中（pending）の抽選エントリも加算
  const pendingEntries = await prisma.lotteryEntries.findMany({
    where: {
      user_id: userId,
      weekly_schedule_id: weeklyScheduleId,
      status: "pending",
    },
    include: { time_slot: true },
  });

  const pendingHours = pendingEntries.reduce((sum, e) => sum + e.time_slot.slot_hours, 0);

  const totalAfter = usedHours + pendingHours + additionalHours;

  return {
    allowed: totalAfter <= WEEKLY_LIMIT_HOURS,
    usedHours: usedHours + pendingHours,
    remainingHours: Math.max(0, WEEKLY_LIMIT_HOURS - usedHours - pendingHours),
  };
}
