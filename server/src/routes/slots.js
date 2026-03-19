const express = require("express");
const { prisma } = require("../lib/prisma");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const slots = await prisma.timeSlot.findMany({
      orderBy: [{ dayType: "asc" }, { startTime: "asc" }],
    });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

module.exports = router;