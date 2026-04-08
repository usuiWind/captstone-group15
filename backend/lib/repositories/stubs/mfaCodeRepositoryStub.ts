import { MfaCode, CreateMfaCodeInput } from '../../interfaces/models'
import { IMfaCodeRepository } from '../../interfaces/repositories'

// One active OTP per user — keyed by userId
const mfaCodes = new Map<string, MfaCode>()

export const mfaCodeRepositoryStub: IMfaCodeRepository = {
  create: async (data: CreateMfaCodeInput): Promise<MfaCode> => {
    const record: MfaCode = {
      id: crypto.randomUUID(),
      userId: data.userId,
      code: data.code,
      expiresAt: data.expiresAt,
      createdAt: new Date(),
    }
    mfaCodes.set(data.userId, record)
    return record
  },

  findByUserId: async (userId: string): Promise<MfaCode | null> => {
    return mfaCodes.get(userId) ?? null
  },

  deleteByUserId: async (userId: string): Promise<void> => {
    mfaCodes.delete(userId)
  },

  deleteExpired: async (): Promise<void> => {
    const now = new Date()
    for (const [userId, record] of mfaCodes.entries()) {
      if (record.expiresAt < now) {
        mfaCodes.delete(userId)
      }
    }
  },
}
