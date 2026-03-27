import { getJson } from '../../../backend';

/**
 * Fetch sponsors grouped by tier from API.
 * @returns {Promise<{ success: boolean, data: { PLATINUM?, GOLD?, SILVER?, BRONZE? } }>}
 */
export async function getSponsors() {
  return getJson('/api/sponsors');
}
