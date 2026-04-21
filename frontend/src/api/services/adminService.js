import { getJson, postJson, patchJson, deleteJson, backendUrl } from '../../../backend';

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getAllEvents() {
  const data = await getJson('/api/admin/events');
  return data?.data ?? [];
}

export async function createEvent({ title, description, eventDate, pointsValue }) {
  const data = await postJson('/api/admin/events', { title, description, eventDate, pointsValue });
  return data?.data ?? null;
}

export async function updateEvent({ id, title, description, eventDate, pointsValue }) {
  const data = await patchJson('/api/admin/events', { id, title, description, eventDate, pointsValue });
  return data?.data ?? null;
}

export async function deleteEvent(id) {
  await deleteJson(`/api/admin/events?id=${encodeURIComponent(id)}`);
}

// ─── Members ──────────────────────────────────────────────────────────────────

export async function createMember({ email, name, password }) {
  const data = await postJson('/api/admin/members', { email, name, password });
  return data?.data ?? null;
}

export async function getAllMembers(status) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const data = await getJson(`/api/admin/members${qs}`);
  return data?.data ?? [];
}

export async function updateMember({ id, name, role, revokeAccess }) {
  const data = await patchJson('/api/admin/members', { id, name, role, revokeAccess });
  return data?.data ?? null;
}

export async function deleteMember(id) {
  await deleteJson(`/api/admin/members?id=${encodeURIComponent(id)}`);
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export async function getMemberAttendance(userId) {
  const data = await getJson(`/api/admin/attendance?userId=${encodeURIComponent(userId)}`);
  return data?.data ?? { records: [], totalPoints: 0 };
}

export async function recordAttendance({ userId, date, eventName, points }) {
  const data = await postJson('/api/admin/attendance', { userId, date, eventName, points });
  return data?.data ?? null;
}

export async function updateAttendance({ id, points, eventName, date }) {
  const data = await patchJson('/api/admin/attendance', { id, points, eventName, date });
  return data?.data ?? null;
}

export async function deleteAttendance(id) {
  await deleteJson(`/api/admin/attendance?id=${encodeURIComponent(id)}`);
}

// ─── Staff ────────────────────────────────────────────────────────────────────

export async function getAllStaff() {
  const data = await getJson('/api/staff');
  return data?.data ?? [];
}

export async function createStaff(fields, imageFile) {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => v != null && fd.append(k, String(v)));
  if (imageFile) fd.append('image', imageFile);
  const res = await fetch(backendUrl('/api/admin/staff'), { method: 'POST', body: fd, credentials: 'include' });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'Failed to create staff member');
  return data?.data ?? null;
}

export async function updateStaff(id, fields, imageFile) {
  const fd = new FormData();
  fd.append('id', id);
  Object.entries(fields).forEach(([k, v]) => v != null && fd.append(k, String(v)));
  if (imageFile) fd.append('image', imageFile);
  const res = await fetch(backendUrl('/api/admin/staff'), { method: 'PUT', body: fd, credentials: 'include' });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'Failed to update staff member');
  return data?.data ?? null;
}

export async function deleteStaff(id) {
  await deleteJson(`/api/admin/staff?id=${encodeURIComponent(id)}`);
}

// ─── Sponsors ─────────────────────────────────────────────────────────────────

export async function getAllSponsors() {
  const data = await getJson('/api/sponsors');
  const g = data?.data ?? {};
  return [...(g.PLATINUM ?? []), ...(g.GOLD ?? []), ...(g.SILVER ?? []), ...(g.BRONZE ?? [])];
}

export async function createSponsor(fields, logoFile) {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => v != null && fd.append(k, String(v)));
  if (logoFile) fd.append('logo', logoFile);
  const res = await fetch(backendUrl('/api/admin/sponsors'), { method: 'POST', body: fd, credentials: 'include' });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'Failed to create sponsor');
  return data?.data ?? null;
}

export async function updateSponsor(id, fields, logoFile) {
  const fd = new FormData();
  fd.append('id', id);
  Object.entries(fields).forEach(([k, v]) => v != null && fd.append(k, String(v)));
  if (logoFile) fd.append('logo', logoFile);
  const res = await fetch(backendUrl('/api/admin/sponsors'), { method: 'PUT', body: fd, credentials: 'include' });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'Failed to update sponsor');
  return data?.data ?? null;
}

export async function deleteSponsor(id) {
  await deleteJson(`/api/admin/sponsors?id=${encodeURIComponent(id)}`);
}
