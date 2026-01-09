// src/api.js
import { APPS_SCRIPT_URL } from "./config";

export async function apiPost(payload) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // GAS friendly
    body: JSON.stringify(payload),
  });
  return res.json();
}
