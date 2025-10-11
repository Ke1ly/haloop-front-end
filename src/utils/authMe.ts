import { API_BASE_URL } from "./config.js";

export async function getCurrentUser() {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) {
    return null;
  }
  let data = await res.json();
  if (data.success) {
    return data;
  } else {
    return null;
  }
}
