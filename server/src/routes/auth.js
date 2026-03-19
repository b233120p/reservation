const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../lib/prisma");

const router = express.Router();

// 新規登録
router.post("/register", async (req, res) => {
  const { name, password, userType } = req.body;

  if (!name || !password || !userType) {
    return res.status(400).json({ error: "全ての項目を入力してください" });
  }

  if (!["band", "individual"].includes(userType)) {
    return res.status(400).json({ error: "ユーザー種別が不正です" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, passwordHash, userType },
    });
    res.json({ message: "登録完了", userId: user.id });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: "その名前はすでに使われています" });
    }
    res.status(500).json({ error: "サーバーエラー" });
  }
});

// ログイン
router.post("/login", async (req, res) => {
  const { name, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { name } });
    if (!user) {
      return res.status(401).json({ error: "名前またはパスワードが違います" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "名前またはパスワードが違います" });
    }

    const token = jwt.sign(
      { userId: user.id, name: user.name, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, userId: user.id, name: user.name, userType: user.userType });
  } catch (err) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

module.exports = router;