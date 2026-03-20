const BASE_URL = "https://studio-reservation-api.onrender.com/api";

function getToken() {
  return localStorage.getItem("token");
}

export async function register(name, password, userType) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, password, userType }),
  });
  return res.json();
}

export async function login(name, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, password }),
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify({
      userId: data.userId,
      name: data.name,
      userType: data.userType,
    }));
  }
  return data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getUser() {
  const u = localStorage.getItem("user");
  return u ? JSON.parse(u) : null;
}

export async function getReservations(weekStart) {
  const res = await fetch(`${BASE_URL}/reservations?weekStart=${weekStart}`);
  return res.json();
}

export async function applyLottery(data) {
  const res = await fetch(`${BASE_URL}/reservations/lottery/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function bookFirstCome(data) {
  const res = await fetch(`${BASE_URL}/reservations/first-come`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function cancelReservation(id) {
  const res = await fetch(`${BASE_URL}/reservations/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
  
}
export async function getCurrentSchedule() {
  try {
    const res = await fetch(`${BASE_URL}/schedules/current`);
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("getCurrentSchedule エラー:", err);
    return null;
  }
}

export async function getNextSchedule() {
  try {
    const res = await fetch(`${BASE_URL}/schedules/next`);
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("getNextSchedule エラー:", err);
    return null;
  }
}
export async function getTimeSlots() {
  try {
    const res = await fetch(`${BASE_URL}/slots`);
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("getTimeSlots エラー:", err);
    return [];
  }
}
export async function getMyReservations() {
  try {
    const res = await fetch(`${BASE_URL}/reservations/my`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("getMyReservations エラー:", err);
    return [];
  }
}

export async function getMyEntries() {
  try {
    const res = await fetch(`${BASE_URL}/reservations/my/entries`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("getMyEntries エラー:", err);
    return [];
  }
}
export async function getWeeklyEntries(weekStart) {
  try {
    const res = await fetch(`${BASE_URL}/reservations/entries?weekStart=${weekStart}`);
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("getWeeklyEntries エラー:", err);
    return [];
  }
}
export async function cancelLotteryEntry(id) {
  try {
    const res = await fetch(`${BASE_URL}/reservations/entries/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("cancelLotteryEntry エラー:", err);
    return { error: "キャンセルに失敗しました" };
  }
}