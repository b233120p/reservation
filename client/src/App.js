import { useState, useEffect } from "react";
import Login from "./components/Login";
import WeeklyTimetable from "./components/WeeklyTimetable";
import UserProfile from "./components/UserProfile";
import { getUser, logout, getCurrentSchedule, getNextSchedule } from "./api";

function App() {
  const [user, setUser] = useState(getUser());
  const [schedule, setSchedule] = useState(null);
  const [mode, setMode] = useState(null); // null=選択画面, "view"=今週閲覧, "book"=来週予約
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (user && mode) fetchSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mode]);

  const fetchSchedule = async () => {
    const data = mode === "view"
      ? await getCurrentSchedule()
      : await getNextSchedule();
    setSchedule(data);
  };

  const handleLogin = (data) => {
    setUser({ userId: data.userId, name: data.name, userType: data.userType });
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setMode(null);
    setSchedule(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div style={{ padding: "16px 24px", maxWidth: 1200, margin: "0 auto" }}>
      {/* ヘッダー */}
      <div style={styles.header}>
        <h2 style={{ margin: 0, fontSize: 20 }}>🎸 スタジオ予約システム</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{ fontSize: 14, color: "#555", cursor: "pointer", textDecoration: "underline dotted" }}
            onClick={() => setShowProfile(true)}
            title="クリックして予約状況を確認"
          >
            {user.name}
            <span style={{
              marginLeft: 8, fontSize: 11, padding: "2px 8px", borderRadius: 10,
              background: user.userType === "band" ? "#ebf8ff" : "#faf5ff",
              color: user.userType === "band" ? "#2b6cb0" : "#6b46c1",
            }}>
              {user.userType === "band" ? "バンド" : "個人"}
            </span>
          </span>
          <button onClick={handleLogout} style={styles.logoutBtn}>ログアウト</button>
        </div>
      </div>

      {/* 選択画面 */}
      {!mode && (
        <div style={styles.selectWrapper}>
          <h3 style={{ textAlign: "center", color: "#444", marginBottom: 32 }}>
            何をしますか？
          </h3>
          <div style={styles.selectCards}>
            {/* 今週の予約状況を見る */}
            <div style={styles.card} onClick={() => setMode("view")}>
              <div style={styles.cardIcon}>📅</div>
              <div style={styles.cardTitle}>今週の予約状況を確認する</div>
              <div style={styles.cardDesc}>
                今週どの枠が予約済みか確認できます。<br />
                自分の予約のキャンセルも可能です。
              </div>
            </div>

            {/* 来週の枠を予約する */}
            <div style={styles.card} onClick={() => setMode("book")}>
              <div style={styles.cardIcon}>✏️</div>
              <div style={styles.cardTitle}>来週の枠を予約する</div>
              <div style={styles.cardDesc}>
                来週の空き枠に申込できます。<br />
                {user.userType === "band"
                  ? "月〜水は抽選申込、木曜以降は先着順です。"
                  : "木曜以降の先着予約に参加できます。"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* タイムテーブル表示 */}
      {mode && (
        <div>
          {/* 戻るボタンとタブ */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <button onClick={() => { setMode(null); setSchedule(null); }} style={styles.backBtn}>
              ← 戻る
            </button>
            <div style={styles.tabs}>
              <button
                style={mode === "view" ? styles.tabActive : styles.tab}
                onClick={() => setMode("view")}
              >📅 今週の予約状況</button>
              <button
                style={mode === "book" ? styles.tabActive : styles.tab}
                onClick={() => setMode("book")}
              >✏️ 来週を予約する</button>
            </div>
          </div>

          {/* 凡例 */}
          <div style={styles.legend}>
            <span style={styles.legendItem}>
              <span style={{ ...styles.dot, background: "#f0fff4", border: "1px solid #68d391" }}></span>空き
            </span>
            <span style={styles.legendItem}>
              <span style={{ ...styles.dot, background: "#fff0f0", border: "1px solid #fc8181" }}></span>予約済
            </span>
          </div>

          {/* 閲覧モードの注意書き */}
          {mode === "view" && (
            <div style={styles.infoBox}>
              📋 今週の予約状況を表示しています。自分の予約はキャンセルできます。
            </div>
          )}

          {schedule ? (
            <WeeklyTimetable
              user={user}
              weeklyScheduleId={schedule.id}
              phase={mode === "view" ? "view_only" : schedule.phase}
              weekOffset={mode === "view" ? 0 : 1}
            />
          ) : (
            <p style={{ color: "#888", textAlign: "center", marginTop: 40 }}>読み込み中...</p>
          )}
        </div>
      )}
      {showProfile && (
        <UserProfile user={user} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #eee" },
  logoutBtn: { padding: "6px 16px", cursor: "pointer", borderRadius: 6, border: "1px solid #ddd", fontSize: 13 },
  selectWrapper: { maxWidth: 700, margin: "60px auto 0" },
  selectCards: { display: "flex", gap: 24, justifyContent: "center" },
  card: { flex: 1, maxWidth: 300, padding: 32, borderRadius: 16, border: "2px solid #eee", cursor: "pointer", textAlign: "center", transition: "all 0.2s", background: "#fff" },
  cardIcon: { fontSize: 48, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 12 },
  cardDesc: { fontSize: 13, color: "#666", lineHeight: 1.6 },
  backBtn: { padding: "6px 16px", borderRadius: 6, border: "1px solid #ddd", cursor: "pointer", fontSize: 13, background: "#fff" },
  tabs: { display: "flex", gap: 8 },
  tab: { padding: "8px 20px", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontSize: 13, background: "#fff" },
  tabActive: { padding: "8px 20px", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, background: "#4f46e5", color: "#fff" },
  legend: { display: "flex", gap: 16, marginBottom: 12, fontSize: 13, color: "#555" },
  legendItem: { display: "flex", alignItems: "center", gap: 6 },
  dot: { display: "inline-block", width: 14, height: 14, borderRadius: 3 },
  infoBox: { padding: "10px 16px", background: "#ebf8ff", borderRadius: 8, marginBottom: 12, fontSize: 13, color: "#2b6cb0" },
};

export default App;