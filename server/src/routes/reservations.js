const express = require("express");
const { prisma } = require("../lib/prisma");
const { authenticateToken } = require("../middleware/auth");
const { checkWeeklyLimit } = require("../services/reservationValidation");

const router = express.Router();

// 自分の予約一覧
router.get("/my", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const reservations = await prisma.reservation.findMany({
      where: { userId, status: "confirmed" },
      include: { timeSlot: true, weeklySchedule: true },
      orderBy: { reservedDate: "asc" },
    });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

// 自分の抽選申込一覧
router.get("/my/entries", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const entries = await prisma.lotteryEntry.findMany({
      where: { userId },
      include: { timeSlot: true, weeklySchedule: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

// 週の抽選申込エントリ取得（タイムテーブル表示用）
router.get("/entries", async (req, res) => {
  const { weekStart } = req.query;
  try {
    const start = new Date(weekStart + "T00:00:00.000Z");
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    const entries = await prisma.lotteryEntry.findMany({
      where: {
        targetDate: { gte: start, lt: end },
        status: "pending",
      },
      include: { user: true, timeSlot: true },
    });
    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "サーバーエラー" });
  }
});

// 予約一覧取得（カレンダー表示用）
router.get("/", async (req, res) => {
  const { weekStart } = req.query;
  try {
    const start = new Date(weekStart + "T00:00:00.000Z");
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    const reservations = await prisma.reservation.findMany({
      where: {
        status: "confirmed",
        reservedDate: { gte: start, lt: end },
      },
      include: { user: true, timeSlot: true },
    });
    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "サーバーエラー" });
  }
});

// 抽選申込（第1段階）
router.post("/lottery/apply", authenticateToken, async (req, res) => {
  console.log("=== 抽選申込リクエスト ===", req.body);
  const { timeSlotId, targetDate, weeklyScheduleId } = req.body;
  const userId = req.user.userId;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user.userType !== "band") {
      return res.status(403).json({ error: "抽選申込はバンドのみ可能です" });
    }

    const schedule = await prisma.weeklySchedule.findUnique({
      where: { id: weeklyScheduleId },
    });
    if (!schedule || schedule.phase !== "lottery_open") {
      return res.status(400).json({ error: "現在抽選申込期間ではありません" });
    }

    // 自分だけの重複チェック（他ユーザーの申込は関係なし）
    const existing = await prisma.lotteryEntry.findFirst({
      where: {
        userId: userId,
        timeSlotId: timeSlotId,
        targetDate: new Date(targetDate + "T00:00:00.000Z"),
      },
    });
    if (existing) {
      return res.status(400).json({ error: "この枠はすでに申込済みです" });
    }

    const slot = await prisma.timeSlot.findUnique({ where: { id: timeSlotId } });
    const limitCheck = await checkWeeklyLimit(userId, weeklyScheduleId, slot.slotHours);
    if (!limitCheck.allowed) {
      return res.status(400).json({
        error: `週の上限（4時間）に達しています。残り${limitCheck.remainingHours}時間分申込可能です`,
      });
    }

    const targetDateObj = new Date(targetDate + "T00:00:00.000Z");
    const entry = await prisma.lotteryEntry.create({
      data: { userId, timeSlotId, weeklyScheduleId, targetDate: targetDateObj },
    });

    res.json({ message: "抽選申込完了", entryId: entry.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "サーバーエラー" });
  }
});

// 先着予約（第3段階）
router.post("/first-come", authenticateToken, async (req, res) => {
  const { timeSlotId, targetDate, weeklyScheduleId } = req.body;
  const userId = req.user.userId;

  try {
    const schedule = await prisma.weeklySchedule.findUnique({
      where: { id: weeklyScheduleId },
    });
    if (!schedule || schedule.phase !== "first_come") {
      return res.status(400).json({ error: "現在先着予約期間ではありません" });
    }

    const targetDateObj = new Date(targetDate + "T00:00:00.000Z");

    const slotTaken = await prisma.reservation.findFirst({
      where: { timeSlotId, reservedDate: targetDateObj, status: "confirmed" },
    });
    if (slotTaken) {
      return res.status(400).json({ error: "この枠はすでに予約済みです" });
    }

    // 自分だけの重複チェック
    const myExisting = await prisma.reservation.findFirst({
      where: { userId, timeSlotId, reservedDate: targetDateObj, status: "confirmed" },
    });
    if (myExisting) {
      return res.status(400).json({ error: "この枠はすでに申込済みです" });
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId,
        timeSlotId,
        weeklyScheduleId,
        reservedDate: targetDateObj,
        bookingType: "first_come",
        status: "confirmed",
      },
    });

    res.json({ message: "予約完了", reservationId: reservation.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "サーバーエラー" });
  }
});

// 抽選申込キャンセル（※ /:id より前に定義必須）
router.delete("/entries/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const entry = await prisma.lotteryEntry.findUnique({ where: { id } });
    if (!entry) {
      return res.status(404).json({ error: "申込が見つかりません" });
    }
    if (entry.userId !== userId) {
      return res.status(403).json({ error: "この申込をキャンセルする権限がありません" });
    }
    if (entry.status !== "pending") {
      return res.status(400).json({ error: "抽選処理済みの申込はキャンセルできません" });
    }

    await prisma.lotteryEntry.delete({ where: { id } });
    res.json({ message: "申込をキャンセルしました" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "サーバーエラー" });
  }
});

// 予約キャンセル
router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const reservation = await prisma.reservation.findUnique({ where: { id } });
    if (!reservation) {
      return res.status(404).json({ error: "予約が見つかりません" });
    }
    if (reservation.userId !== userId) {
      return res.status(403).json({ error: "この予約をキャンセルする権限がありません" });
    }

    await prisma.reservation.update({
      where: { id },
      data: { status: "cancelled" },
    });

    res.json({ message: "キャンセル完了" });
  } catch (err) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

module.exports = router;