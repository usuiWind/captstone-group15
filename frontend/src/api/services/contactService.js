import { postJson } from '../../../backend';

/**
 * Submit contact form.
 * @param {{ firstName: string, lastName: string, email: string, message: string }} data
 */
export async function submitContact(data) {
  return postJson('/api/contact', data);
}
