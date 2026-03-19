import { useState, useEffect } from "react";
import { getMyReservations, getMyEntries, cancelReservation, cancelLotteryEntry } from "../api";

export default function UserProfile({ user, onClose }) {
  const [reservations, setReservations] = useState([]);
  const [entries, setEntries] = useState([]);
  const [tab, setTab] = useState("reservations");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyReservations(), getMyEntries()]).then(([r, e]) => {
      setReservations(r);
      setEntries(e);
      setLoading(false);
    });
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("この予約をキャンセルしますか？")) return;
    await cancelReservation(id);
    const updated = await getMyReservations();
    setReservations(updated);
  };
  
  const handleCancelEntry = async (id) => {
    if (!window.confirm("この抽選申込をキャンセルしますか？")) return;
    const result = await cancelLotteryEntry(id);
    if (result.error) {
      alert(result.error);
      return;
    }
    const updated = await getMyEntries();
    setEntries(updated);
  };

  const statusLabel = {
    pending: { text: "抽選待ち", color: "#d69e2e", bg: "#fefcbf" },
    won:     { text: "当選",     color: "#276749", bg: "#c6f6d5" },
    lost:    { text: "落選",     color: "#c53030", bg: "#fed7d7" },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div style={styles.header}>
          <div>
            <div style={styles.name}>{user.name}</div>
            <div style={styles.badge}>
              {user.userType === "band" ? "🎸 バンド" : "🎵 個人"}
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* タブ */}
        <div style={styles.tabs}>
          <button
            style={tab === "reservations" ? styles.tabActive : styles.tab}
            onClick={() => setTab("reservations")}
          >
            確定済み予約 {reservations.length > 0 && `(${reservations.length})`}
          </button>
          <button
            style={tab === "entries" ? styles.tabActive : styles.tab}
            onClick={() => setTab("entries")}
          >
            抽選申込履歴 {entries.length > 0 && `(${entries.length})`}
          </button>
        </div>

        {/* コンテンツ */}
        <div style={styles.content}>
          {loading ? (
            <p style={{ color: "#888", textAlign: "center", padding: 32 }}>読み込み中...</p>
          ) : tab === "reservations" ? (
            reservations.length === 0 ? (
              <p style={styles.empty}>確定済みの予約はありません</p>
            ) : (
              reservations.map((r) => (
                <div key={r.id} style={styles.item}>
                  <div style={styles.itemLeft}>
                    <div style={styles.itemDate}>
                      {new Date(r.reservedDate).toLocaleDateString("ja-JP", {
                        month: "long", day: "numeric", weekday: "short"
                      })}
                    </div>
                    <div style={styles.itemSlot}>
                      {r.timeSlot.label}（{r.timeSlot.startTime}〜{r.timeSlot.endTime}）
                    </div>
                    <div style={styles.itemHours}>
                      {r.timeSlot.slotHours}時間分 ／ {r.bookingType === "lottery" ? "抽選当選" : "先着予約"}
                    </div>
                  </div>
                  <button onClick={() => handleCancel(r.id)} style={styles.cancelBtn}>
                    キャンセル
                  </button>
                </div>
              ))
            )
          ) : (
            entries.length === 0 ? (
              <p style={styles.empty}>抽選申込履歴はありません</p>
            ) : (
              entries.map((e) => {
                const s = statusLabel[e.status] || { text: e.status, color: "#888", bg: "#f5f5f5" };
                return (
                  <div key={e.id} style={styles.item}>
                    <div style={styles.itemLeft}>
                      <div style={styles.itemDate}>
                        {new Date(e.targetDate).toLocaleDateString("ja-JP", {
                          month: "long", day: "numeric", weekday: "short"
                        })}
                      </div>
                      <div style={styles.itemSlot}>
                        {e.timeSlot.label}（{e.timeSlot.startTime}〜{e.timeSlot.endTime}）
                      </div>
                      <div style={styles.itemHours}>{e.timeSlot.slotHours}時間分</div>
                    </div>
                    <span style={{
                      fontSize: 12, padding: "3px 10px", borderRadius: 10,
                      background: s.bg, color: s.color, fontWeight: "bold",
                    }}>
                      {s.text}
                    </span>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", justifyContent: "flex-end" },
  panel: { background: "#fff", width: 420, height: "100%", boxShadow: "-4px 0 20px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "24px 20px 16px", borderBottom: "1px solid #eee" },
  name: { fontSize: 18, fontWeight: "bold", color: "#333" },
  badge: { fontSize: 13, color: "#666", marginTop: 4 },
  closeBtn: { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888", padding: 4 },
  tabs: { display: "flex", borderBottom: "1px solid #eee" },
  tab: { flex: 1, padding: "12px 0", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#888" },
  tabActive: { flex: 1, padding: "12px 0", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#4f46e5", fontWeight: "bold", borderBottom: "2px solid #4f46e5" },
  content: { flex: 1, overflowY: "auto", padding: "16px 20px" },
  empty: { textAlign: "center", color: "#aaa", padding: 32, fontSize: 14 },
  item: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" },
  itemLeft: { flex: 1 },
  itemDate: { fontSize: 13, fontWeight: "bold", color: "#333", marginBottom: 2 },
  itemSlot: { fontSize: 13, color: "#555", marginBottom: 2 },
  itemHours: { fontSize: 11, color: "#aaa" },
  cancelBtn: { fontSize: 11, padding: "4px 10px", cursor: "pointer", borderRadius: 4, border: "1px solid #fc8181", background: "#fff5f5", color: "#c53030", marginLeft: 12, whiteSpace: "nowrap" },
};