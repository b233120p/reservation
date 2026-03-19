import { useState } from "react";
import { login, register } from "../api";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("band");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "login") {
      const data = await login(name, password);
      if (data.token) {
        onLogin(data);
      } else {
        setError(data.error || "ログイン失敗");
      }
    } else {
      const data = await register(name, password, userType);
      if (data.userId) {
        const loginData = await login(name, password);
        if (loginData.token) onLogin(loginData);
      } else {
        setError(data.error || "登録失敗");
      }
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>🎸 スタジオ予約システム</h2>
        <div style={styles.tabs}>
          <button
            style={mode === "login" ? styles.tabActive : styles.tab}
            onClick={() => setMode("login")}
          >ログイン</button>
          <button
            style={mode === "register" ? styles.tabActive : styles.tab}
            onClick={() => setMode("register")}
          >新規登録</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>バンド名 / 個人名</label>
          <input
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：The Rockers"
            required
          />

          <label style={styles.label}>パスワード</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {mode === "register" && (
            <>
              <label style={styles.label}>ユーザー種別</label>
              <select
                style={styles.input}
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
              >
                <option value="band">バンド</option>
                <option value="individual">個人</option>
              </select>
            </>
          )}

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button}>
            {mode === "login" ? "ログイン" : "登録してログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f0f2f5" },
  card: { background: "#fff", borderRadius: 12, padding: 40, width: 360, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
  title: { textAlign: "center", marginBottom: 24, fontSize: 20, color: "#333" },
  tabs: { display: "flex", marginBottom: 24 },
  tab: { flex: 1, padding: "10px 0", border: "none", background: "#f0f2f5", cursor: "pointer", fontSize: 14 },
  tabActive: { flex: 1, padding: "10px 0", border: "none", background: "#4f46e5", color: "#fff", cursor: "pointer", fontSize: 14, borderRadius: 6 },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  label: { fontSize: 13, color: "#555", fontWeight: "bold" },
  input: { padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, outline: "none" },
  button: { marginTop: 8, padding: "12px 0", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, cursor: "pointer" },
  error: { color: "#e53e3e", fontSize: 13, margin: 0 },
};
