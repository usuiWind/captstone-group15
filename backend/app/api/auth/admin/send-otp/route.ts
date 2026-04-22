import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { repositories } from '@/lib/container'
import { emailService } from '@/lib/email'
import { otpRateLimitAsync, getClientIdentifier } from '@/lib/rateLimit'

// Constant-time response to prevent user enumeration:
// We always return the same shape regardless of whether the admin exists.
const OK = () => NextResponse.json({ sent: true })
const RATE_LIMITED = (resetTime: number) =>
  NextResponse.json(
    { error: 'Too many attempts. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)) } }
  )

export async function POST(req: NextRequest) {
  const identifier = getClientIdentifier(req)
  const { allowed, resetTime } = await otpRateLimitAsync(identifier)
  if (!allowed) return RATE_LIMITED(resetTime ?? Date.now() + 60_000)

  let email: string
  let password: string

  try {
    const body = await req.json()
    email = (body.email ?? '').trim().toLowerCase()
    password = body.password ?? ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  // Validate credentials — same path as auth.ts authorize
  let userId: string
  let userEmail: string

  try {
    if (process.env.SUPABASE_URL) {
      const { getSupabaseAnon } = await import('@/lib/supabase')
      const { data, error } = await getSupabaseAnon().auth.signInWithPassword({ email, password })
      if (error || !data.user) return OK()

      const user = await repositories.user.findById(data.user.id)
      if (!user || user.role !== 'ADMIN') return OK()

      userId = user.id
      userEmail = user.email
    } else {
      // Dev/stub mode
      const user = await repositories.user.findByEmail(email)
      if (!user?.passwordHash || user.role !== 'ADMIN') return OK()

      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) return OK()

      userId = user.id
      userEmail = user.email
    }
  } catch {
    return OK()
  }

  // Clean up old expired codes, then generate a fresh 6-digit OTP
  await repositories.otp.deleteExpiredForUser(userId)

  const rawOtp = String(Math.floor(100_000 + Math.random() * 900_000))
  const codeHash = await bcrypt.hash(rawOtp, 8)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await repositories.otp.create({ userId, codeHash, expiresAt })
  console.log(`\n\n🔑 ADMIN OTP FOR ${userEmail}: ${rawOtp}\n\n`)
  await emailService.sendAdminOtpEmail(userEmail, rawOtp)

  return OK()
}
