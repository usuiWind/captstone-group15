import { getJson, postJson } from '../../../backend';

export async function getMembership() {
  const data = await getJson('/api/membership');
  return data?.data ?? null;
}

export async function cancelMembership() {
  const data = await postJson('/api/membership/cancel', {});
  return data?.data ?? null;
}
