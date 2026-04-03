import { getJson } from '../../../backend';

export async function getAttendance() {
  const data = await getJson('/api/attendance');
  return data?.data ?? { records: [], totalPoints: 0 };
}
