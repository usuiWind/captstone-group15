// Distributed rate limiter backed by Upstash Redis (sliding-window algorithm).
//
// Production: set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in your
// environment (free tier at https://console.upstash.com). Limits are shared
// across all serverless invocations — works correctly on Vercel.
//
// Development: when those env vars are absent the limiter falls back to an
// in-process ephemeral Map (same behaviour as the previous implementation).
// No Redis account needed to run locally.

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export interface RateLimitOptions {
  windowMs: number    // time window in milliseconds
  maxRequests: number // max requests per window
}

interface Limiter {
  limit(identifier: string): Promise<{ success: boolean; reset: number }>
}

// Pure in-memory sliding window for dev/test — no Redis calls, no external deps.
class InMemoryRateLimiter implements Limiter {
  private windows = new Map<string, number[]>()
  constructor(private maxRequests: number, private windowMs: number) {}

  async limit(identifier: string): Promise<{ success: boolean; reset: number }> {
    const now = Date.now()
    const hits = (this.windows.get(identifier) ?? []).filter(t => t > now - this.windowMs)
    const reset = now + this.windowMs
    if (hits.length >= this.maxRequests) {
      this.windows.set(identifier, hits)
      return { success: false, reset }
    }
    hits.push(now)
    this.windows.set(identifier, hits)
    return { success: true, reset }
  }
}

function buildLimiter(options: RateLimitOptions): Limiter {
  const windowSec = Math.ceil(options.windowMs / 1000)

  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    // Production path — shared Redis store
    return new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      }),
      limiter: Ratelimit.slidingWindow(options.maxRequests, `${windowSec} s`),
      analytics: false,
    })
  }

  // Development / test path — pure in-memory sliding window, no Redis required.
  return new InMemoryRateLimiter(options.maxRequests, options.windowMs)
}

/**
 * Create a standalone async rate-limiter with custom options.
 * Primarily used in tests and for the predefined limiters below.
 */
export function createRateLimitAsync(
  options: RateLimitOptions
): (identifier: string) => Promise<{ allowed: boolean; resetTime?: number }> {
  const limiter = buildLimiter(options)
  return async (identifier: string) => {
    const { success, reset } = await limiter.limit(identifier)
    return { allowed: success, resetTime: reset }
  }
}

// Lazy-init: limiters are created on first use to avoid cold-start cost and
// to allow env vars to be read after module load (e.g. in tests).
let _authLimiter: Limiter | null = null
let _otpLimiter:  Limiter | null = null
let _generalLimiter: Limiter | null = null

const isDev = process.env.NODE_ENV === 'development'

function getAuthLimiter(): Limiter {
  if (!_authLimiter) _authLimiter = buildLimiter({ windowMs: 15 * 60 * 1000, maxRequests: isDev ? 50 : 5 })
  return _authLimiter
}

function getOtpLimiter(): Limiter {
  // OTP sends get a separate bucket so login + OTP don't share the same quota.
  // Dev: 50 per 15 min so testing doesn't lock out the admin account.
  if (!_otpLimiter) _otpLimiter = buildLimiter({ windowMs: 15 * 60 * 1000, maxRequests: isDev ? 50 : 10 })
  return _otpLimiter
}

function getGeneralLimiter(): Limiter {
  if (!_generalLimiter) _generalLimiter = buildLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 100 })
  return _generalLimiter
}

/**
 * Rate-limit an auth endpoint (5 req / 15 min per identifier; 50 in dev).
 * @returns `{ allowed, resetTime }` — resetTime is epoch ms when the window resets
 */
export async function authRateLimitAsync(
  identifier: string
): Promise<{ allowed: boolean; resetTime?: number }> {
  const { success, reset } = await getAuthLimiter().limit(identifier)
  return { allowed: success, resetTime: reset }
}

/**
 * Rate-limit the OTP send endpoint (10 req / 15 min per identifier; 50 in dev).
 * Kept separate from authRateLimitAsync so login and OTP attempts don't share quota.
 */
export async function otpRateLimitAsync(
  identifier: string
): Promise<{ allowed: boolean; resetTime?: number }> {
  const { success, reset } = await getOtpLimiter().limit(identifier)
  return { allowed: success, resetTime: reset }
}

/**
 * Rate-limit a general endpoint (100 req / 15 min per identifier).
 */
export async function generalRateLimitAsync(
  identifier: string
): Promise<{ allowed: boolean; resetTime?: number }> {
  const { success, reset } = await getGeneralLimiter().limit(identifier)
  return { allowed: success, resetTime: reset }
}

/** Extract the best available client IP from a Next.js request. */
export function getClientIdentifier(request: any): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0].trim() || realIp || 'unknown'
}
