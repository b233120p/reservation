-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('band', 'individual');

-- CreateEnum
CREATE TYPE "DayType" AS ENUM ('weekday', 'holiday');

-- CreateEnum
CREATE TYPE "SchedulePhase" AS ENUM ('lottery_open', 'lottery_done', 'first_come');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('pending', 'won', 'lost');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('lottery', 'first_come');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "userType" "UserType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" TEXT NOT NULL,
    "dayType" "DayType" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotHours" INTEGER NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklySchedule" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "phase" "SchedulePhase" NOT NULL DEFAULT 'lottery_open',
    "lotteryExecutedAt" TIMESTAMP(3),

    CONSTRAINT "WeeklySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotteryEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timeSlotId" TEXT NOT NULL,
    "weeklyScheduleId" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "status" "EntryStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LotteryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timeSlotId" TEXT NOT NULL,
    "weeklyScheduleId" TEXT NOT NULL,
    "reservedDate" TIMESTAMP(3) NOT NULL,
    "bookingType" "BookingType" NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'confirmed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- AddForeignKey
ALTER TABLE "LotteryEntry" ADD CONSTRAINT "LotteryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotteryEntry" ADD CONSTRAINT "LotteryEntry_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotteryEntry" ADD CONSTRAINT "LotteryEntry_weeklyScheduleId_fkey" FOREIGN KEY ("weeklyScheduleId") REFERENCES "WeeklySchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_weeklyScheduleId_fkey" FOREIGN KEY ("weeklyScheduleId") REFERENCES "WeeklySchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
