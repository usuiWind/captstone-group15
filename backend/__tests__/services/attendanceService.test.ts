import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Attendance } from '../../lib/interfaces/models'

// vi.mock is hoisted — declare mocks with vi.hoisted so they're available inside the factory
const { mockAttendance } = vi.hoisted(() => ({
  mockAttendance: {
    findByUserId: vi.fn(),
    getTotalPoints: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../../lib/container', () => ({
  repositories: { attendance: mockAttendance },
}))

import { AttendanceService } from '../../lib/services/attendanceService'

const service = new AttendanceService()

const RECORD: Attendance = {
  id: 'a1',
  userId: 'u1',
  date: new Date('2026-03-01'),
  eventName: 'Week 1 Meeting',
  points: 2,
}

beforeEach(() => vi.clearAllMocks())

// ─── getUserAttendance ────────────────────────────────────────────────────────

describe('getUserAttendance', () => {
  it('returns records and totalPoints from the repository', async () => {
    mockAttendance.findByUserId.mockResolvedValue([RECORD])
    mockAttendance.getTotalPoints.mockResolvedValue(2)

    const result = await service.getUserAttendance('u1')

    expect(result.records).toEqual([RECORD])
    expect(result.totalPoints).toBe(2)
    expect(mockAttendance.findByUserId).toHaveBeenCalledWith('u1')
    expect(mockAttendance.getTotalPoints).toHaveBeenCalledWith('u1')
  })

  it('returns empty records and 0 points for a user with no attendance', async () => {
    mockAttendance.findByUserId.mockResolvedValue([])
    mockAttendance.getTotalPoints.mockResolvedValue(0)

    const result = await service.getUserAttendance('u2')

    expect(result.records).toEqual([])
    expect(result.totalPoints).toBe(0)
  })
})

// ─── createAttendance ─────────────────────────────────────────────────────────

describe('createAttendance', () => {
  it('delegates to the repository and returns the created record', async () => {
    mockAttendance.create.mockResolvedValue(RECORD)

    const input = { userId: 'u1', date: new Date('2026-03-01'), eventName: 'Week 1 Meeting', points: 2 }
    const result = await service.createAttendance(input)

    expect(result).toEqual(RECORD)
    expect(mockAttendance.create).toHaveBeenCalledWith(input)
  })
})

// ─── deleteAttendance ─────────────────────────────────────────────────────────

describe('deleteAttendance', () => {
  it('calls repository delete with the correct id', async () => {
    mockAttendance.delete.mockResolvedValue(undefined)

    await service.deleteAttendance('a1')

    expect(mockAttendance.delete).toHaveBeenCalledWith('a1')
  })
})

// ─── getAllAttendance ─────────────────────────────────────────────────────────

describe('getAllAttendance', () => {
  it('returns an empty array (stub — not yet implemented)', async () => {
    expect(await service.getAllAttendance()).toEqual([])
  })
})
