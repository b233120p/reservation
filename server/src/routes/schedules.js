const express = require("express");
const { prisma } = require("../lib/prisma");

const router = express.Router();

// 今週・来週のスケジュール取得
router.get("/current", async (req, res) => {
  try {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    let schedule = await prisma.weeklySchedule.findFirst({
      where: { weekStart: monday },
    });

    // スケジュールがなければ自動作成
    if (!schedule) {
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      schedule = await prisma.weeklySchedule.create({
        data: {
          weekStart: monday,
          weekEnd: sunday,
          phase: "lottery_open",
        },
      });
    }

    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

// 来週のスケジュール取得
router.get("/next", async (req, res) => {
  try {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + diff + 7);
    nextMonday.setHours(0, 0, 0, 0);

    let schedule = await prisma.weeklySchedule.findFirst({
      where: { weekStart: nextMonday },
    });

    if (!schedule) {
      const sunday = new Date(nextMonday);
      sunday.setDate(nextMonday.getDate() + 6);
      schedule = await prisma.weeklySchedule.create({
        data: {
          weekStart: nextMonday,
          weekEnd: sunday,
          phase: "lottery_open",
        },
      });
    }

    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

module.exports = router;