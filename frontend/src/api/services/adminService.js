import { getJson, postJson } from '../../../backend';

export async function getAllMembers(status) {
  const qs = status ? `?status=${status}` : '';
  const data = await getJson(`/api/admin/members${qs}`);
  return data?.data ?? [];
}

export async function recordAttendance({ userId, date, eventName, points }) {
  const data = await postJson('/api/admin/attendance', { userId, date, eventName, points });
  return data?.data ?? null;
}
