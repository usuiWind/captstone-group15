// Simple in-memory rate limiter for development
// In production, use Redis or a proper rate limiting solution

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  message?: string
}

export function createRateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, message = 'Too many requests' } = options

  return function rateLimit(identifier: string): { allowed: boolean; resetTime?: number } {
    const now = Date.now()
    const key = identifier

    // Clean up expired entries
    for (const [storeKey, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(storeKey)
      }
    }

    const existing = rateLimitStore.get(key)

    if (!existing) {
      // First request from this identifier
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return { allowed: true }
    }

    if (now > existing.resetTime) {
      // Window has reset
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return { allowed: true }
    }

    if (existing.count >= maxRequests) {
      // Rate limit exceeded
      return { allowed: false, resetTime: existing.resetTime }
    }

    // Increment counter
    existing.count++
    return { allowed: true }
  }
}

// Predefined rate limiters
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again later.'
})

export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Rate limit exceeded. Please try again later.'
})

export function getClientIdentifier(request: any): string {
  // Try to get client IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  
  // In production, you might want to include user agent or other factors
  return ip
}
