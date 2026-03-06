const BASE = 'http://localhost:4000/api';

export function getToken() { return localStorage.getItem('ba_token'); }
export function setToken(t) { localStorage.setItem('ba_token', t); }
export function clearToken() { localStorage.removeItem('ba_token'); }

export async function apiFetch(path, opts = {}) {
  const token = getToken();
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(opts.headers || {}),
    },
  });
  // Always attempt to parse JSON; fall back to a plain error object so
  // callers can rely on consistent { error, message } response shapes.
  const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  return json;
}
