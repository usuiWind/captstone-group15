import { getJson, postJson, postForm } from '../../../backend';

/**
 * Get CSRF token required for NextAuth credentials sign-in.
 * @returns {Promise<string|null>}
 */
export async function getCsrfToken() {
  const data = await getJson('/api/auth/csrf');
  return data?.csrfToken ?? null;
}

/**
 * Get current session from NextAuth.
 * @returns {Promise<{ user: { id, email, name, role } } | null>}
 */
export async function getSession() {
  const data = await getJson('/api/auth/session');
  return data?.user ? data : null;
}

/**
 * Sign in with email and password (NextAuth credentials provider).
 * @param {string} email
 * @param {string} password
 * @throws {Error} on invalid credentials or network error
 */
export async function signIn(email, password) {
  const csrfToken = await getCsrfToken();
  if (!csrfToken) throw new Error('Could not get security token');
  await postForm('/api/auth/callback/credentials', {
    csrfToken,
    email: String(email).trim(),
    password,
    callbackUrl: window.location.origin,
    json: 'true',
  });
}

/**
 * Sign out and clear session.
 */
export async function signOut() {
  await postJson('/api/auth/signout', { callbackUrl: window.location.origin });
}

/**
 * Register with invite token (sets password and name for existing user).
 * @param {{ token: string, name: string, password: string }} data
 */
export async function register(data) {
  return postJson('/api/auth/register', data);
}
