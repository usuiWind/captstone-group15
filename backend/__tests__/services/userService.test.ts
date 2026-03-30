import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User, VerificationToken } from '../../lib/interfaces/models'

const { mockUser, mockVerificationToken } = vi.hoisted(() => ({
  mockUser: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setPassword: vi.fn(),
    delete: vi.fn(),
  },
  mockVerificationToken: {
    findByToken: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    deleteExpired: vi.fn(),
  },
}))

vi.mock('../../lib/container', () => ({
  repositories: { user: mockUser, verificationToken: mockVerificationToken },
}))
vi.mock('../../lib/email', () => ({
  emailService: { sendWelcomeEmail: vi.fn() },
}))
vi.mock('../../lib/stripe', () => ({
  createCustomer: vi.fn().mockResolvedValue({ id: 'cus_mock' }),
}))

import { UserService } from '../../lib/services/userService'

const service = new UserService()

const BASE_USER: User = {
  id: 'u1',
  email: 'alice@example.com',
  name: 'Alice',
  role: 'MEMBER',
}

beforeEach(() => vi.clearAllMocks())

// ─── getUserById ──────────────────────────────────────────────────────────────

describe('getUserById', () => {
  it('returns the user when found', async () => {
    mockUser.findById.mockResolvedValue(BASE_USER)
    expect(await service.getUserById('u1')).toEqual(BASE_USER)
    expect(mockUser.findById).toHaveBeenCalledWith('u1')
  })

  it('returns null for an unknown id', async () => {
    mockUser.findById.mockResolvedValue(null)
    expect(await service.getUserById('u99')).toBeNull()
  })
})

// ─── getAllUsers ──────────────────────────────────────────────────────────────

describe('getAllUsers', () => {
  it('returns all users from the repository', async () => {
    mockUser.findAll.mockResolvedValue([BASE_USER])
    const result = await service.getAllUsers()
    expect(result).toHaveLength(1)
    expect(result[0].email).toBe('alice@example.com')
  })

  it('returns an empty array when no users exist', async () => {
    mockUser.findAll.mockResolvedValue([])
    expect(await service.getAllUsers()).toEqual([])
  })
})

// ─── updateUser ───────────────────────────────────────────────────────────────

describe('updateUser', () => {
  it('delegates to the repository and returns the updated user', async () => {
    const updated = { ...BASE_USER, name: 'Alice Updated' }
    mockUser.update.mockResolvedValue(updated)

    const result = await service.updateUser('u1', { name: 'Alice Updated' })
    expect(result.name).toBe('Alice Updated')
    expect(mockUser.update).toHaveBeenCalledWith('u1', { name: 'Alice Updated' })
  })
})

// ─── registerUser ─────────────────────────────────────────────────────────────

describe('registerUser', () => {
  const TOKEN: VerificationToken = {
    token: 'tok_abc',
    identifier: 'alice@example.com',
    expires: new Date(Date.now() + 86400_000),
  }

  it('registers the user successfully with a valid token', async () => {
    mockVerificationToken.findByToken.mockResolvedValue(TOKEN)
    mockUser.findByEmail.mockResolvedValue(BASE_USER)
    mockUser.update.mockResolvedValue({ ...BASE_USER, name: 'Alice Registered' })
    mockUser.setPassword.mockResolvedValue(undefined)
    mockVerificationToken.delete.mockResolvedValue(undefined)

    const result = await service.registerUser('tok_abc', 'Alice Registered', 'Secure@123')

    expect(result.name).toBe('Alice Registered')
    expect(mockUser.setPassword).toHaveBeenCalledWith('u1', 'Secure@123')
    expect(mockVerificationToken.delete).toHaveBeenCalledWith('tok_abc')
  })

  it('throws when the token does not exist', async () => {
    mockVerificationToken.findByToken.mockResolvedValue(null)
    await expect(service.registerUser('bad_token', 'Name', 'Pass@123')).rejects.toThrow(
      'Invalid or expired token'
    )
  })

  it('throws when the token has expired', async () => {
    const expired: VerificationToken = { ...TOKEN, expires: new Date(Date.now() - 1000) }
    mockVerificationToken.findByToken.mockResolvedValue(expired)
    await expect(service.registerUser('tok_abc', 'Name', 'Pass@123')).rejects.toThrow(
      'Invalid or expired token'
    )
  })

  it('throws when no user matches the token identifier', async () => {
    mockVerificationToken.findByToken.mockResolvedValue(TOKEN)
    mockUser.findByEmail.mockResolvedValue(null)
    await expect(service.registerUser('tok_abc', 'Name', 'Pass@123')).rejects.toThrow('User not found')
  })

  it('does not call setPassword when token is invalid', async () => {
    mockVerificationToken.findByToken.mockResolvedValue(null)
    await expect(service.registerUser('bad', 'Name', 'Pass@123')).rejects.toThrow()
    expect(mockUser.setPassword).not.toHaveBeenCalled()
  })
})
