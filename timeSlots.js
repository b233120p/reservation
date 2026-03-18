// utils/timeSlots.js

export const WEEKDAY_SLOTS = [
  { label: "早朝①",  start: "06:00", end: "07:00", hours: 1 },
  { label: "早朝②",  start: "07:00", end: "08:30", hours: 1 },
  { label: "1限",    start: "08:30", end: "10:10", hours: 2 },
  { label: "2限",    start: "10:20", end: "12:00", hours: 2 },
  { label: "昼休み", start: "12:00", end: "12:50", hours: 1 },
  { label: "3限",    start: "12:50", end: "14:30", hours: 2 },
  { label: "4限",    start: "14:40", end: "16:20", hours: 2 },
  { label: "5限",    start: "16:30", end: "18:10", hours: 2 },
  { label: "夕方",   start: "18:10", end: "20:00", hours: 2 },
  { label: "夜①",   start: "20:00", end: "21:00", hours: 1 },
  { label: "夜②",   start: "21:00", end: "22:00", hours: 1 },
];

export const HOLIDAY_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const h = 6 + i;
  const pad = (n) => String(n).padStart(2, "0");
  return {
    label: `${pad(h)}:00〜${pad(h + 1)}:00`,
    start: `${pad(h)}:00`,
    end:   `${pad(h + 1)}:00`,
    hours: 1,
  };
});

/**
 * 連続予約バリデーション：合計2時間分以内かチェック
 * @param {Array} selectedSlots - 選択した枠の配列 [{hours: 1|2}, ...]
 * @returns {boolean}
 */
export function isWithinContinuousLimit(selectedSlots) {
  const total = selectedSlots.reduce((sum, s) => sum + s.hours, 0);
  return total <= 2;
}
