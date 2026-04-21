import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Membership } from '../../lib/interfaces/models'

const { mockMembership, mockUser, mockEmail } = vi.hoisted(() => ({
  mockMembership: {
    findByUserId: vi.fn(),
    findByStripeSubscriptionId: vi.fn(),
    findByStripeCustomerId: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  mockUser: { findById: vi.fn() },
  mockEmail: {
    sendPaymentSuccessEmail: vi.fn(),
    sendPaymentFailedEmail: vi.fn(),
    sendCancellationEmail: vi.fn(),
    sendSubscriptionUpdatedEmail: vi.fn(),
  },
}))

vi.mock('../../lib/container', () => ({
  repositories: { membership: mockMembership, user: mockUser },
}))
vi.mock('../../lib/email', () => ({ emailService: mockEmail }))

import { MembershipService } from '../../lib/services/membershipService'

const service = new MembershipService()

const BASE: Membership = {
  id: 'm1',
  userId: 'u1',
  status: 'ACTIVE',
  planName: 'Monthly',
  stripeCustomerId: 'cus_test',
  stripeSubscriptionId: 'sub_test',
  currentPeriodStart: new Date('2026-03-01'),
  currentPeriodEnd: new Date('2026-04-01'),
  cancelAtPeriodEnd: false,
}

beforeEach(() => vi.clearAllMocks())

// ─── getByUserId ──────────────────────────────────────────────────────────────

describe('getByUserId', () => {
  it('returns the membership when found', async () => {
    mockMembership.findByUserId.mockResolvedValue(BASE)
    expect(await service.getByUserId('u1')).toEqual(BASE)
  })

  it('returns null when no membership exists', async () => {
    mockMembership.findByUserId.mockResolvedValue(null)
    expect(await service.getByUserId('u99')).toBeNull()
  })
})

// ─── getAllMemberships ────────────────────────────────────────────────────────

describe('getAllMemberships', () => {
  const memberships: Membership[] = [
    BASE,
    { ...BASE, id: 'm2', userId: 'u2', status: 'PAST_DUE' },
    { ...BASE, id: 'm3', userId: 'u3', status: 'CANCELLED' },
  ]

  it('returns all memberships when no status filter is given', async () => {
    mockMembership.findAll.mockResolvedValue(memberships)
    expect(await service.getAllMemberships()).toHaveLength(3)
  })

  it('filters by status when provided', async () => {
    mockMembership.findAll.mockResolvedValue(memberships)
    const result = await service.getAllMemberships('ACTIVE')
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('ACTIVE')
  })

  it('returns empty array when nothing matches the filter', async () => {
    mockMembership.findAll.mockResolvedValue(memberships)
    expect(await service.getAllMemberships('EXPIRED')).toHaveLength(0)
  })
})

// ─── markCancelAtPeriodEnd ────────────────────────────────────────────────────

describe('markCancelAtPeriodEnd', () => {
  it('updates the membership and returns it', async () => {
    const updated = { ...BASE, cancelAtPeriodEnd: true }
    mockMembership.findByUserId.mockResolvedValue(BASE)
    mockMembership.update.mockResolvedValue(updated)

    const result = await service.markCancelAtPeriodEnd('u1')

    expect(mockMembership.update).toHaveBeenCalledWith('m1', { cancelAtPeriodEnd: true })
    expect(result.cancelAtPeriodEnd).toBe(true)
  })

  it('throws when the user has no membership', async () => {
    mockMembership.findByUserId.mockResolvedValue(null)
    await expect(service.markCancelAtPeriodEnd('u99')).rejects.toThrow('Membership not found')
  })
})

// ─── handlePaymentSuccess ─────────────────────────────────────────────────────

describe('handlePaymentSuccess', () => {
  it('sets status to ACTIVE and updates period dates', async () => {
    const updated = { ...BASE, status: 'ACTIVE' }
    mockMembership.findByStripeSubscriptionId.mockResolvedValue(BASE)
    mockMembership.update.mockResolvedValue(updated)
    mockUser.findById.mockResolvedValue({ email: 'test@example.com' })

    const invoice = { subscription: 'sub_test', period_start: 1740787200, period_end: 1743465600, amount_paid: 999 }
    const result = await service.handlePaymentSuccess(invoice)

    expect(result.status).toBe('ACTIVE')
    expect(mockMembership.update).toHaveBeenCalledWith('m1', expect.objectContaining({ status: 'ACTIVE' }))
  })

  it('throws when no membership matches the subscription', async () => {
    mockMembership.findByStripeSubscriptionId.mockResolvedValue(null)
    await expect(service.handlePaymentSuccess({ subscription: 'sub_unknown' })).rejects.toThrow(
      'Membership not found for subscription'
    )
  })
})

// ─── handlePaymentFailed ──────────────────────────────────────────────────────

describe('handlePaymentFailed', () => {
  it('sets status to PAST_DUE', async () => {
    const updated = { ...BASE, status: 'PAST_DUE' }
    mockMembership.findByStripeSubscriptionId.mockResolvedValue(BASE)
    mockMembership.update.mockResolvedValue(updated)
    mockUser.findById.mockResolvedValue({ email: 'test@example.com' })

    const result = await service.handlePaymentFailed({ subscription: 'sub_test' })
    expect(result.status).toBe('PAST_DUE')
    expect(mockMembership.update).toHaveBeenCalledWith('m1', { status: 'PAST_DUE' })
  })

  it('throws when no membership matches', async () => {
    mockMembership.findByStripeSubscriptionId.mockResolvedValue(null)
    await expect(service.handlePaymentFailed({ subscription: 'sub_nope' })).rejects.toThrow()
  })
})

// ─── handleCancellation ───────────────────────────────────────────────────────

describe('handleCancellation', () => {
  it('sets status to CANCELLED', async () => {
    const updated = { ...BASE, status: 'CANCELLED' }
    mockMembership.findByStripeSubscriptionId.mockResolvedValue(BASE)
    mockMembership.update.mockResolvedValue(updated)
    mockUser.findById.mockResolvedValue({ email: 'test@example.com' })

    const result = await service.handleCancellation({ id: 'sub_test' })
    expect(result.status).toBe('CANCELLED')
  })

  it('throws when no membership matches', async () => {
    mockMembership.findByStripeSubscriptionId.mockResolvedValue(null)
    await expect(service.handleCancellation({ id: 'sub_nope' })).rejects.toThrow()
  })
})
