const WEEKDAY_SLOTS = [
  { label: "早朝①",  startTime: "06:00", endTime: "07:00", slotHours: 1, dayType: "weekday" },
  { label: "早朝②",  startTime: "07:00", endTime: "08:30", slotHours: 1, dayType: "weekday" },
  { label: "1限",    startTime: "08:30", endTime: "10:10", slotHours: 2, dayType: "weekday" },
  { label: "2限",    startTime: "10:20", endTime: "12:00", slotHours: 2, dayType: "weekday" },
  { label: "昼休み", startTime: "12:00", endTime: "12:50", slotHours: 1, dayType: "weekday" },
  { label: "3限",    startTime: "12:50", endTime: "14:30", slotHours: 2, dayType: "weekday" },
  { label: "4限",    startTime: "14:40", endTime: "16:20", slotHours: 2, dayType: "weekday" },
  { label: "5限",    startTime: "16:30", endTime: "18:10", slotHours: 2, dayType: "weekday" },
  { label: "夕方",   startTime: "18:10", endTime: "20:00", slotHours: 2, dayType: "weekday" },
  { label: "夜①",   startTime: "20:00", endTime: "21:00", slotHours: 1, dayType: "weekday" },
  { label: "夜②",   startTime: "21:00", endTime: "22:00", slotHours: 1, dayType: "weekday" },
];

const HOLIDAY_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const h = 6 + i;
  const pad = (n) => String(n).padStart(2, "0");
  return {
    label: `${pad(h)}:00〜${pad(h + 1)}:00`,
    startTime: `${pad(h)}:00`,
    endTime: `${pad(h + 1)}:00`,
    slotHours: 1,
    dayType: "holiday",
  };
});

function isWithinContinuousLimit(selectedSlots) {
  const total = selectedSlots.reduce((sum, s) => sum + s.slotHours, 0);
  return total <= 2;
}

module.exports = { WEEKDAY_SLOTS, HOLIDAY_SLOTS, isWithinContinuousLimit };