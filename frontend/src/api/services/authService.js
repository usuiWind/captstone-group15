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
 * For admin accounts, call requestAdminOtp first, then pass the OTP here.
 * @param {string} email
 * @param {string} password
 * @param {string} [otp] - Required for admin accounts
 * @throws {Error} on invalid credentials or network error
 */
export async function signIn(email, password, otp) {
  const csrfToken = await getCsrfToken();
  if (!csrfToken) throw new Error('Could not get security token');

  // Use redirect:'follow' so the browser processes the Set-Cookie from the
  // 302 response (opaque redirects block cookie processing).
  // Detect errors by checking the final URL for ?error= after redirect.
  const { backendUrl } = await import('../../../backend');
  const res = await fetch(backendUrl('/api/auth/callback/credentials'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      csrfToken,
      email: String(email).trim(),
      password,
      ...(otp ? { otp: String(otp).trim() } : {}),
      callbackUrl: window.location.origin,
    }).toString(),
    credentials: 'include',
    redirect: 'follow',
  });

  if (res.url.includes('error=')) {
    const params = new URLSearchParams(res.url.split('?')[1] ?? '');
    const code = params.get('error') ?? 'CredentialsSignin';
    throw new Error(code);
  }
}

/**
 * Request an admin OTP code to be sent to the admin's email.
 * Validates email + password server-side before sending the code.
 * Always resolves (never rejects) to avoid user enumeration.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ sent: boolean }>}
 */
export async function requestAdminOtp(email, password) {
  return postJson('/api/auth/admin/send-otp', {
    email: String(email).trim(),
    password,
  });
}

/**
 * Sign out and clear session.
 */
export async function signOut() {
  const csrfToken = await getCsrfToken();
  const { backendUrl } = await import('../../../backend');
  await fetch(backendUrl('/api/auth/signout'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ csrfToken: csrfToken ?? '', callbackUrl: '/' }).toString(),
    credentials: 'include',
    redirect: 'manual',
  });
}

/**
 * Register with invite token (sets password and name for existing user).
 * @param {{ token: string, name: string, password: string }} data
 */
export async function register(data) {
  return postJson('/api/auth/register', data);
}
