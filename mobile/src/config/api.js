/**
 * src/config/api.js
 *
 * Base URL for the BulletAuto backend API.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  HOW TO CHANGE THE API URL FOR YOUR DEVICE / ENVIRONMENT            │
 * │                                                                     │
 * │  iOS Simulator (Mac only)   → http://localhost:4000/api             │
 * │  Android Emulator           → http://10.0.2.2:4000/api             │
 * │  Physical device (same WiFi)→ http://YOUR_PC_IP:4000/api           │
 * │    e.g.                       http://192.168.1.50:4000/api         │
 * │                                                                     │
 * │  To find your PC IP on Windows: run `ipconfig` in Command Prompt   │
 * │  To find your PC IP on Mac/Linux: run `ifconfig` or `ip a`         │
 * └─────────────────────────────────────────────────────────────────────┘
 */

// Default for Android emulator — 10.0.2.2 maps to the host machine's localhost.
// Change this to match your environment (see the table above).
export const API_BASE_URL = 'http://10.0.2.2:4000/api';

/**
 * Fetch wrapper that automatically attaches the Authorization header.
 * @param {string} path - API path, e.g. '/bookings'
 * @param {object} opts - Standard fetch options
 * @param {string|null} token - JWT token from AsyncStorage
 */
export async function apiFetch(path, opts = {}, token = null) {
  const res = await fetch(API_BASE_URL + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(opts.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  return { ok: res.ok, status: res.status, data: json };
}
