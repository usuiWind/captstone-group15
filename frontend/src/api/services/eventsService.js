import { getJson } from '../../../backend';

export async function getUpcomingEvents() {
  const data = await getJson('/api/events');
  return data?.data ?? [];
}
