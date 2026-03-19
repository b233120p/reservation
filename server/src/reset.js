const { prisma } = require("./lib/prisma");

async function reset() {
  console.log("データベースをリセット中...");

  // 依存関係の順番に削除
  await prisma.lotteryEntry.deleteMany();
  console.log("✓ 抽選申込履歴を削除");

  await prisma.reservation.deleteMany();
  console.log("✓ 予約データを削除");

  await prisma.weeklySchedule.deleteMany();
  console.log("✓ 週次スケジュールを削除");

  await prisma.user.deleteMany();
  console.log("✓ ユーザーデータを削除");

  // TimeSlotは残す（予約枠定義は必要）
  console.log("✓ 予約枠データは保持します");

  console.log("\n完了！データベースをリセットしました。");
  await prisma.$disconnect();
}

reset().catch((e) => {
  console.error(e);
  process.exit(1);
});