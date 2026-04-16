import { describe, it, expect } from 'vitest'
import { createRateLimitAsync, getClientIdentifier } from '../lib/rateLimit'

// Each test creates its own limiter instance with a fresh ephemeral cache,
// and uses unique identifiers to prevent cross-test contamination.
let idCounter = 0
function uid() {
  return `test-ip-${++idCounter}`
}

// ─── createRateLimitAsync ─────────────────────────────────────────────────────

describe('createRateLimitAsync', () => {
  it('allows the first request', async () => {
    const limiter = createRateLimitAsync({ windowMs: 60_000, maxRequests: 3 })
    const result = await limiter(uid())
    expect(result.allowed).toBe(true)
  })

  it('allows requests up to the max', async () => {
    const limiter = createRateLimitAsync({ windowMs: 60_000, maxRequests: 3 })
    const id = uid()
    expect((await limiter(id)).allowed).toBe(true)
    expect((await limiter(id)).allowed).toBe(true)
    expect((await limiter(id)).allowed).toBe(true)
  })

  it('blocks the request that exceeds the max', async () => {
    const limiter = createRateLimitAsync({ windowMs: 60_000, maxRequests: 3 })
    const id = uid()
    await limiter(id)
    await limiter(id)
    await limiter(id)
    const result = await limiter(id) // 4th — over limit
    expect(result.allowed).toBe(false)
  })

  it('returns a resetTime when blocked', async () => {
    const limiter = createRateLimitAsync({ windowMs: 60_000, maxRequests: 1 })
    const id = uid()
    await limiter(id)
    const result = await limiter(id)
    expect(result.allowed).toBe(false)
    expect(result.resetTime).toBeTypeOf('number')
    expect(result.resetTime).toBeGreaterThan(Date.now())
  })

  it('treats different identifiers independently', async () => {
    const limiter = createRateLimitAsync({ windowMs: 60_000, maxRequests: 1 })
    const a = uid()
    const b = uid()
    await limiter(a) // exhaust A
    expect((await limiter(a)).allowed).toBe(false)
    expect((await limiter(b)).allowed).toBe(true) // B is unaffected
  })

  it('allows again after the window expires', async () => {
    const limiter = createRateLimitAsync({ windowMs: 50, maxRequests: 1 })
    const id = uid()
    await limiter(id)
    expect((await limiter(id)).allowed).toBe(false)
    await new Promise(r => setTimeout(r, 60)) // wait for window to pass
    expect((await limiter(id)).allowed).toBe(true)
  })
})

// ─── getClientIdentifier ─────────────────────────────────────────────────────

describe('getClientIdentifier', () => {
  function makeRequest(headers: Record<string, string>) {
    return { headers: { get: (key: string) => headers[key] ?? null } }
  }

  it('uses x-forwarded-for when present', () => {
    const req = makeRequest({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })
    expect(getClientIdentifier(req)).toBe('1.2.3.4')
  })

  it('uses x-real-ip as fallback', () => {
    const req = makeRequest({ 'x-real-ip': '9.9.9.9' })
    expect(getClientIdentifier(req)).toBe('9.9.9.9')
  })

  it('falls back to "unknown" when no IP headers exist', () => {
    const req = makeRequest({})
    expect(getClientIdentifier(req)).toBe('unknown')
  })

  it('prefers x-forwarded-for over x-real-ip', () => {
    const req = makeRequest({
      'x-forwarded-for': '1.1.1.1',
      'x-real-ip': '2.2.2.2',
    })
    expect(getClientIdentifier(req)).toBe('1.1.1.1')
  })
})
