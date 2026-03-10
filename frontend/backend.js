// Frontend → backend API helper.
//
// In development: VITE_API_BASE_URL is left unset, so all /api/* requests go
// through the Vite dev proxy to http://localhost:3000 (same origin → cookies work).
//
// In production: set VITE_API_BASE_URL to your deployed backend URL, e.g.
//   VITE_API_BASE_URL=https://your-backend.vercel.app

export const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL ?? ''

export function backendUrl(path = '/') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${cleanPath}`
}

export async function getJson(path) {
  const res = await fetch(backendUrl(path), {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Request failed')
  }
  return data
}

export async function postJson(path, body) {
  const res = await fetch(backendUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Request failed')
  }
  return data
}

/** POST with application/x-www-form-urlencoded (NextAuth credentials sign-in). */
export async function postForm(path, params) {
  const res = await fetch(backendUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
    credentials: 'include',
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Request failed')
  }
  return data
}
