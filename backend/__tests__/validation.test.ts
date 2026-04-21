import { describe, it, expect } from 'vitest'
import {
  registerSchema,
  createAttendanceSchema,
  staffSchema,
  sponsorSchema,
  validateRequest,
} from '../lib/validation'

// ─── registerSchema ──────────────────────────────────────────────────────────

describe('registerSchema', () => {
  const valid = {
    token: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Jane Doe',
    password: 'Secure@123',
  }

  it('accepts a valid payload', () => {
    expect(() => registerSchema.parse(valid)).not.toThrow()
  })

  it('rejects a missing token', () => {
    expect(() => registerSchema.parse({ ...valid, token: undefined })).toThrow()
  })

  it('rejects a non-UUID token', () => {
    expect(() => registerSchema.parse({ ...valid, token: 'not-a-uuid' })).toThrow()
  })

  it('rejects an empty name', () => {
    expect(() => registerSchema.parse({ ...valid, name: '' })).toThrow()
  })

  it('rejects a password shorter than 8 characters', () => {
    expect(() => registerSchema.parse({ ...valid, password: 'Ab1@' })).toThrow()
  })

  it('rejects a password with no uppercase letter', () => {
    expect(() => registerSchema.parse({ ...valid, password: 'secure@123' })).toThrow()
  })

  it('rejects a password with no number', () => {
    expect(() => registerSchema.parse({ ...valid, password: 'Secure@abc' })).toThrow()
  })

  it('rejects a password with no special character', () => {
    expect(() => registerSchema.parse({ ...valid, password: 'Secure1234' })).toThrow()
  })
})

// ─── createAttendanceSchema ───────────────────────────────────────────────────

describe('createAttendanceSchema', () => {
  const valid = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    date: '2026-03-27T12:00:00Z',
    eventName: 'Weekly Meeting',
    points: 1,
  }

  it('accepts a valid payload', () => {
    expect(() => createAttendanceSchema.parse(valid)).not.toThrow()
  })

  it('accepts a payload without eventName (optional)', () => {
    const { eventName, ...rest } = valid
    expect(() => createAttendanceSchema.parse(rest)).not.toThrow()
  })

  it('rejects a non-UUID userId', () => {
    expect(() => createAttendanceSchema.parse({ ...valid, userId: 'bad-id' })).toThrow()
  })

  it('rejects negative points', () => {
    expect(() => createAttendanceSchema.parse({ ...valid, points: -1 })).toThrow()
  })

  it('rejects points above 100', () => {
    expect(() => createAttendanceSchema.parse({ ...valid, points: 101 })).toThrow()
  })

  it('rejects non-integer points', () => {
    expect(() => createAttendanceSchema.parse({ ...valid, points: 1.5 })).toThrow()
  })

  it('rejects an invalid date string', () => {
    expect(() => createAttendanceSchema.parse({ ...valid, date: 'not-a-date' })).toThrow()
  })
})

// ─── staffSchema ──────────────────────────────────────────────────────────────

describe('staffSchema', () => {
  const valid = {
    name: 'Alice Smith',
    role: 'President',
    order: 1,
    isActive: true,
  }

  it('accepts a valid payload', () => {
    expect(() => staffSchema.parse(valid)).not.toThrow()
  })

  it('accepts optional bio and email', () => {
    expect(() => staffSchema.parse({ ...valid, bio: 'Bio text', email: 'alice@example.com' })).not.toThrow()
  })

  it('rejects a missing name', () => {
    expect(() => staffSchema.parse({ ...valid, name: undefined })).toThrow()
  })

  it('rejects an empty role', () => {
    expect(() => staffSchema.parse({ ...valid, role: '' })).toThrow()
  })

  it('rejects a non-integer order', () => {
    expect(() => staffSchema.parse({ ...valid, order: 1.5 })).toThrow()
  })

  it('rejects a negative order', () => {
    expect(() => staffSchema.parse({ ...valid, order: -1 })).toThrow()
  })

  it('rejects an invalid email', () => {
    expect(() => staffSchema.parse({ ...valid, email: 'not-an-email' })).toThrow()
  })

  it('rejects a non-boolean isActive', () => {
    expect(() => staffSchema.parse({ ...valid, isActive: 'yes' })).toThrow()
  })
})

// ─── sponsorSchema ────────────────────────────────────────────────────────────

describe('sponsorSchema', () => {
  const valid = {
    name: 'Acme Corp',
    tier: 'GOLD' as const,
    order: 0,
    isActive: true,
  }

  it('accepts a valid payload', () => {
    expect(() => sponsorSchema.parse(valid)).not.toThrow()
  })

  it('accepts all valid tiers', () => {
    for (const tier of ['PLATINUM', 'GOLD', 'SILVER', 'BRONZE'] as const) {
      expect(() => sponsorSchema.parse({ ...valid, tier })).not.toThrow()
    }
  })

  it('rejects an invalid tier', () => {
    expect(() => sponsorSchema.parse({ ...valid, tier: 'DIAMOND' })).toThrow()
  })

  it('rejects an invalid websiteUrl', () => {
    expect(() => sponsorSchema.parse({ ...valid, websiteUrl: 'not-a-url' })).toThrow()
  })

  it('accepts a valid websiteUrl', () => {
    expect(() => sponsorSchema.parse({ ...valid, websiteUrl: 'https://acme.com' })).not.toThrow()
  })
})

// ─── validateRequest helper ───────────────────────────────────────────────────

describe('validateRequest', () => {
  it('returns parsed data on success', () => {
    const result = validateRequest(staffSchema, {
      name: 'Bob', role: 'VP', order: 2, isActive: false,
    })
    expect(result.name).toBe('Bob')
    expect(result.isActive).toBe(false)
  })

  it('throws with a descriptive message on failure', () => {
    expect(() =>
      validateRequest(staffSchema, { name: '', role: 'VP', order: 0, isActive: true })
    ).toThrow()
  })
})
