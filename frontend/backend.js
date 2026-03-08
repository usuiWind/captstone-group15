// Simple frontend → backend API helper
// Uses Vite env var when available, otherwise defaults to local Next dev server.

export const API_BASE_URL =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  'http://localhost:3000';

export function backendUrl(path = '/') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export async function getJson(path) {
  const res = await fetch(backendUrl(path), {
    method: 'GET',
    credentials: 'include',
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.error || data?.message || 'Request failed';
    throw new Error(message);
  }
  return data;
}

export async function postJson(path, body) {
  const res = await fetch(backendUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.error || data?.message || 'Request failed';
    throw new Error(message);
  }
  return data;
}

/** POST with application/x-www-form-urlencoded (e.g. NextAuth credentials). */
export async function postForm(path, params) {
  const body = new URLSearchParams(params).toString();
  const res = await fetch(backendUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    credentials: 'include',
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.error || data?.message || 'Request failed';
    throw new Error(message);
  }
  return data;
}