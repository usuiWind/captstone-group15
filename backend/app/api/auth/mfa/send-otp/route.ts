import { NextRequest } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { repositories } from '@/lib/container'
import { validateRequest, sendOtpSchema } from '@/lib/validation'
import { emailService } from '@/lib/email'
import { createSecureResponse, createSecureErrorResponse } from '@/lib/security'
import { otpRateLimitAsync, getClientIdentifier } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await otpRateLimitAsync(clientId)
    if (!rateLimitResult.allowed) {
      return createSecureErrorResponse('Too many requests. Please try again later.', 429)
    }

    const body = await request.json()
    const { email, password } = validateRequest(sendOtpSchema, body)

    // Validate password — same logic as auth.ts authorize()
    let userId: string
    if (process.env.SUPABASE_URL) {
      const { getSupabaseAnon } = await import('@/lib/supabase')
      const { data, error } = await getSupabaseAnon().auth.signInWithPassword({ email, password })
      if (error || !data.user) {
        return createSecureErrorResponse('Invalid credentials', 401)
      }
      userId = data.user.id
    } else {
      const user = await repositories.user.findByEmail(email)
      if (!user?.passwordHash) {
        return createSecureErrorResponse('Invalid credentials', 401)
      }
      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) {
        return createSecureErrorResponse('Invalid credentials', 401)
      }
      userId = user.id
    }

    // Generate a cryptographically random 6-digit code
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Replace any existing OTP for this user before creating a new one
    await repositories.otp.deleteExpiredForUser(userId)
    await repositories.otp.create({ userId, codeHash: code, expiresAt })

    await emailService.sendOtpCode(email, code)

    return createSecureResponse({ success: true })
  } catch (error: any) {
    console.error('Send OTP error:', error)
    return createSecureErrorResponse('Failed to send verification code', 400)
  }
}
