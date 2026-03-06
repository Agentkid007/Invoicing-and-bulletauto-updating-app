/**
 * shared/api/client.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight fetch wrapper used by BOTH web (React) and mobile (React Native).
 *
 * Usage:
 *   import { createApiClient } from '../../shared/api/client';
 *   const api = createApiClient({ baseURL: 'http://localhost:4000/api', getToken });
 *   const data = await api.get('/bookings');
 *   const data = await api.post('/auth/login', { email, password });
 */

'use strict';

/**
 * @param {{ baseURL: string, getToken: () => string|null }} opts
 */
function createApiClient({ baseURL, getToken = () => null }) {
  async function request(method, path, body, extraHeaders = {}) {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    };

    const options = { method, headers };
    if (body !== undefined) options.body = JSON.stringify(body);

    const res = await fetch(baseURL + path, options);

    // Always try to parse JSON; fall back to a plain error shape
    const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));

    if (!res.ok) {
      const err = new Error(json.error || json.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.data   = json;
      throw err;
    }
    return json;
  }

  return {
    get:    (path, headers)        => request('GET',    path, undefined, headers),
    post:   (path, body, headers)  => request('POST',   path, body,      headers),
    patch:  (path, body, headers)  => request('PATCH',  path, body,      headers),
    put:    (path, body, headers)  => request('PUT',    path, body,      headers),
    delete: (path, headers)        => request('DELETE', path, undefined, headers),
  };
}

module.exports = { createApiClient };
