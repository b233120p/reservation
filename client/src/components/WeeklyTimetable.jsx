import { useState, useEffect } from "react";
import { getReservations, getWeeklyEntries, getTimeSlots, applyLottery, bookFirstCome, cancelReservation, cancelLotteryEntry } from "../api";
function getMondayOfWeek(offset = 0) {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + offset * 7);
  monday.setHours(12, 0, 0, 0);
  return monday;
}

function getWeekDates(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export default function WeeklyTimetable({ user, weeklyScheduleId, phase, weekOffset: fixedOffset = 0 }) {
  const [reservations, setReservations] = useState([]);
  const [entries, setEntries] = useState([]);
  const [weekdaySlots, setWeekdaySlots] = useState([]);
  const [holidaySlots, setHolidaySlots] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);

  const monday = getMondayOfWeek(fixedOffset);
  const weekDates = getWeekDates(monday);
  const weekdayDates = weekDates.slice(0, 5);
  const holidayDates = weekDates.slice(5, 7);
  const WEEKDAY_LABELS = ["月", "火", "水", "木", "金"];
  const HOLIDAY_LABELS = ["土", "日"];

  useEffect(() => {
    getTimeSlots().then((slots) => {
      setWeekdaySlots(slots.filter((s) => s.dayType === "weekday").sort((a, b) => a.startTime.localeCompare(b.startTime)));
      setHolidaySlots(slots.filter((s) => s.dayType === "holiday").sort((a, b) => a.startTime.localeCompare(b.startTime)));
    });
  }, []);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = async () => {
    try {
      const dateStr = monday.toISOString().slice(0, 10);
      const [rsvData, entryData] = await Promise.all([
        getReservations(dateStr),
        getWeeklyEntries(dateStr),
      ]);
      if (Array.isArray(rsvData)) setReservations(rsvData);
      if (Array.isArray(entryData)) setEntries(entryData);
    } catch (err) {
      console.error("データ取得エラー:", err);
    }
  };

  const getReservation = (date, slotId) =>
    reservations.find((r) => r.reservedDate.slice(0, 10) === date && r.timeSlotId === slotId);

  const getEntries = (date, slotId) =>
  entries.filter((e) => e.targetDate.slice(0, 10) === date && e.timeSlotId === slotId);

  const getMyEntry = (date, slotId) =>
  entries.find((e) => e.targetDate.slice(0, 10) === date && e.timeSlotId === slotId && e.userId === user.userId);

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4000);
  };

  const handleBook = async (date, slot) => {
    if (!weeklyScheduleId) { showMessage("現在予約受付期間外です", "error"); return; }
    setLoading(true);
    let result;
    if (phase === "lottery_open" && user.userType === "band") {
      result = await applyLottery({ timeSlotId: slot.id, targetDate: date, weeklyScheduleId });
    } else if (phase === "first_come") {
      result = await bookFirstCome({ timeSlotId: slot.id, targetDate: date, weeklyScheduleId });
    } else if (phase === "lottery_open" && user.userType === "individual") {
      showMessage("抽選期間中は個人ユーザーは申込できません", "error");
      setLoading(false); return;
    } else {
      showMessage("現在この枠は予約できません", "error");
      setLoading(false); return;
    }
    if (result.error) {
      showMessage(result.error, "error");
    } else {
      showMessage(result.message || "完了しました", "success");
      await fetchAll();
    }
    setLoading(false);
  };

  const handleCancel = async (reservationId) => {
    if (!window.confirm("この予約をキャンセルしますか？")) return;
    setLoading(true);
    const result = await cancelReservation(reservationId);
    if (result.error) {
      showMessage(result.error, "error");
    } else {
      showMessage("キャンセルしました", "success");
      await fetchAll();
    }
    setLoading(false);
  };
  
  const handleCancelEntry = async (entryId) => {
    if (!window.confirm("この抽選申込をキャンセルしますか？")) return;
    setLoading(true);
    const result = await cancelLotteryEntry(entryId);
    if (result.error) {
      showMessage(result.error, "error");
    } else {
      showMessage("申込をキャンセルしました", "success");
      await fetchAll();
    }
    setLoading(false);
  };

  const phaseLabel = {
    lottery_open: "🎯 抽選申込受付中（バンドのみ）",
    lottery_done: "⏳ 抽選結果処理中",
    first_come:   "🏃 先着予約受付中（全員OK）",
    view_only:    "📋 閲覧のみ",
  }[phase] || "📅 予約状況";

  const renderCell = (date, slot) => {
    const rsv = getReservation(date, slot.id);
    const slotEntries = getEntries(date, slot.id);
    const myEntry = getMyEntry(date, slot.id);
    const isMine = rsv && rsv.userId === user.userId;
    const entryCount = slotEntries.length;
    const entryNames = slotEntries.map((e) => e.user?.name).join("、");

    // 確定予約あり
    if (rsv) {
      return (
        <td key={date} style={styles.tdBooked}
          title={`予約確定：${rsv.user?.name}（${rsv.bookingType === "lottery" ? "抽選" : "先着"}）`}>
          <div style={{ fontSize: 12 }}>
            <div style={{ fontWeight: "bold", color: "#333" }}>{rsv.user?.name}</div>
            <div style={{ fontSize: 11, color: "#888" }}>
              {rsv.bookingType === "lottery" ? "抽選確定" : "先着確定"}
            </div>
            {isMine && (
              <button onClick={() => handleCancel(rsv.id)} style={styles.cancelBtn} disabled={loading}>
                キャンセル
              </button>
            )}
          </div>
        </td>
      );
    }

    // 自分が申込済み
    if (myEntry) {
      return (
        <td key={date} style={styles.tdMyEntry}
          title={entryCount > 1 ? `申込者（${entryCount}件）：${entryNames}` : "自分が申込済み"}>
          <div style={{ fontSize: 12, textAlign: "center" }}>
            <div style={{ fontWeight: "bold", color: "#2b6cb0" }}>申込済</div>
            <div style={{ fontSize: 11, color: "#4a90d9" }}>抽選待ち</div>
            <div style={styles.countBadge}>{entryCount}件申込</div>
            <button
              onClick={() => handleCancelEntry(myEntry.id)}
              style={styles.cancelBtn}
              disabled={loading}
            >
              取消
            </button>
          </div>
        </td>
      );
    }

    // 他の人が申込中（自分は未申込）
    if (entryCount > 0) {
      return (
        <td key={date} style={styles.tdEmpty}
          title={`申込者（${entryCount}件）：${entryNames}`}>
          <div style={{ fontSize: 12, textAlign: "center" }}>
            {phase !== "view_only" && (
              <button onClick={() => handleBook(date, slot)} style={styles.bookBtn} disabled={loading}>
                申込
              </button>
            )}
            {phase === "view_only" && (
              <div style={{ fontSize: 11, color: "#aaa" }}>空き</div>
            )}
            <div style={styles.countBadgeGray}>{entryCount}件申込中</div>
          </div>
        </td>
      );
    }

    // 完全に空き
    if (phase === "view_only") {
      return (
        <td key={date} style={styles.tdEmpty}>
          <div style={{ fontSize: 11, color: "#aaa" }}>空き</div>
        </td>
      );
    }

    return (
      <td key={date} style={styles.tdEmpty}>
        <button onClick={() => handleBook(date, slot)} style={styles.bookBtn} disabled={loading}>
          申込
        </button>
      </td>
    );
  };

  return (
    <div>
      {/* 週表示ヘッダー */}
      <div style={{ marginBottom: 16, padding: "8px 0" }}>
        <div style={styles.weekLabel}>
          {monday.toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}
          〜
          {new Date(weekDates[6] + "T12:00:00").toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}
        </div>
        <div style={styles.phaseLabel}>{phaseLabel}</div>
      </div>

      {/* メッセージ */}
      {message && (
        <div style={{
          ...styles.message,
          background: messageType === "error" ? "#fff5f5" : "#f0fff4",
          color: messageType === "error" ? "#c53030" : "#276749",
          borderLeft: `4px solid ${messageType === "error" ? "#fc8181" : "#68d391"}`,
        }}>
          {message}
        </div>
      )}

      {/* 凡例 */}
      <div style={styles.legend}>
        <span style={styles.legendItem}><span style={{ ...styles.dot, background: "#f0fff4", border: "1px solid #68d391" }}></span>空き</span>
        <span style={styles.legendItem}><span style={{ ...styles.dot, background: "#ebf8ff", border: "1px solid #90cdf4" }}></span>抽選申込済</span>
        <span style={styles.legendItem}><span style={{ ...styles.dot, background: "#bee3f8", border: "1px solid #63b3ed" }}></span>自分の申込</span>
        <span style={styles.legendItem}><span style={{ ...styles.dot, background: "#fff0f0", border: "1px solid #fc8181" }}></span>予約確定</span>
      </div>

      {/* 2テーブルを横並び */}
      <div style={{ display: "flex", gap: 24, overflowX: "auto", alignItems: "flex-start" }}>

        {/* 平日テーブル */}
        <div style={{ flex: "0 0 auto" }}>
          <div style={styles.tableTitle}>📅 平日（月〜金）</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.thSlot}>時間枠</th>
                {weekdayDates.map((date, i) => (
                  <th key={date} style={styles.th}>
                    {WEEKDAY_LABELS[i]}<br />
                    <small style={{ fontWeight: "normal" }}>{date.slice(5)}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekdaySlots.map((slot) => (
                <tr key={slot.id}>
                  <td style={styles.slotLabel}>
                    <strong>{slot.label}</strong><br />
                    <small style={{ color: "#888" }}>{slot.startTime}〜{slot.endTime}</small><br />
                    <span style={{
                      fontSize: 10, padding: "1px 6px", borderRadius: 8,
                      background: slot.slotHours === 2 ? "#ebf8ff" : "#f0fff4",
                      color: slot.slotHours === 2 ? "#2b6cb0" : "#276749",
                    }}>{slot.slotHours}時間分</span>
                  </td>
                  {weekdayDates.map((date) => renderCell(date, slot))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 休日テーブル */}
        <div style={{ flex: "0 0 auto" }}>
          <div style={styles.tableTitle}>🎌 休日（土・日）</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.thSlot}>時間枠</th>
                {holidayDates.map((date, i) => (
                  <th key={date} style={{ ...styles.th, background: "#fff0f5", color: "#e53e3e" }}>
                    {HOLIDAY_LABELS[i]}<br />
                    <small style={{ fontWeight: "normal" }}>{date.slice(5)}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holidaySlots.map((slot) => (
                <tr key={slot.id}>
                  <td style={styles.slotLabel}>
                    <strong>{slot.startTime}〜{slot.endTime}</strong><br />
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8, background: "#f0fff4", color: "#276749" }}>
                      1時間分
                    </span>
                  </td>
                  {holidayDates.map((date) => renderCell(date, slot))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  weekLabel: { fontSize: 15, fontWeight: "bold", color: "#333" },
  phaseLabel: { fontSize: 13, color: "#666", marginTop: 4 },
  message: { padding: "10px 16px", borderRadius: 8, marginBottom: 12, fontSize: 14 },
  legend: { display: "flex", gap: 16, marginBottom: 12, fontSize: 12, color: "#555", flexWrap: "wrap" },
  legendItem: { display: "flex", alignItems: "center", gap: 6 },
  dot: { display: "inline-block", width: 12, height: 12, borderRadius: 3 },
  tableTitle: { fontSize: 14, fontWeight: "bold", color: "#444", marginBottom: 8 },
  table: { borderCollapse: "collapse", fontSize: 13 },
  th: { padding: "8px 12px", borderBottom: "2px solid #ddd", textAlign: "center", background: "#f8f9fa", whiteSpace: "nowrap", minWidth: 80 },
  thSlot: { padding: "8px 12px", borderBottom: "2px solid #ddd", textAlign: "center", background: "#f8f9fa", whiteSpace: "nowrap", minWidth: 130 },
  slotLabel: { padding: "8px 12px", borderBottom: "1px solid #eee", whiteSpace: "nowrap", background: "#fafafa" },
  tdEmpty: { padding: "6px 4px", borderBottom: "1px solid #eee", textAlign: "center", background: "#f0fff4", minWidth: 80 },
  tdBooked: { padding: "6px 4px", borderBottom: "1px solid #eee", textAlign: "center", background: "#fff0f0", minWidth: 80 },
  tdEntry: { padding: "6px 4px", borderBottom: "1px solid #eee", textAlign: "center", background: "#ebf8ff", minWidth: 80 },
  tdMyEntry: { padding: "6px 4px", borderBottom: "1px solid #eee", textAlign: "center", background: "#bee3f8", minWidth: 80 },
  bookBtn: { fontSize: 11, padding: "3px 10px", cursor: "pointer", borderRadius: 4, border: "1px solid #68d391", background: "#f0fff4", color: "#276749" },
  cancelBtn: { fontSize: 10, padding: "2px 6px", cursor: "pointer", borderRadius: 4, border: "1px solid #fc8181", background: "#fff5f5", color: "#c53030", marginTop: 4, display: "block", margin: "4px auto 0" },
  countBadge: { fontSize: 10, marginTop: 3, padding: "1px 6px", borderRadius: 8, background: "#bee3f8", color: "#2b6cb0", display: "inline-block" },
  countBadgeGray: { fontSize: 10, marginTop: 3, padding: "1px 6px", borderRadius: 8, background: "#e2e8f0", color: "#718096", display: "inline-block" },
};