import { AdminOtpCode, CreateAdminOtpInput } from '../../interfaces/models'
import { IAdminOtpRepository } from '../../interfaces/repositories'

const otpStore = new Map<string, AdminOtpCode>()

export const otpRepositoryStub: IAdminOtpRepository = {
  create: async (data: CreateAdminOtpInput): Promise<AdminOtpCode> => {
    const record: AdminOtpCode = {
      id: crypto.randomUUID(),
      userId: data.userId,
      codeHash: data.codeHash,
      expiresAt: data.expiresAt,
      used: false,
      createdAt: new Date(),
    }
    otpStore.set(record.id, record)
    return record
  },

  findLatestForUser: async (userId: string): Promise<AdminOtpCode | null> => {
    const now = new Date()
    let latest: AdminOtpCode | null = null

    for (const record of otpStore.values()) {
      if (record.userId !== userId) continue
      if (record.used) continue
      if (record.expiresAt <= now) continue
      if (!latest || record.createdAt > latest.createdAt) {
        latest = record
      }
    }

    return latest
  },

  markUsed: async (id: string): Promise<void> => {
    const record = otpStore.get(id)
    if (record) {
      otpStore.set(id, { ...record, used: true })
    }
  },

  deleteExpiredForUser: async (userId: string): Promise<void> => {
    const now = new Date()
    for (const [id, record] of otpStore.entries()) {
      if (record.userId === userId && record.expiresAt <= now) {
        otpStore.delete(id)
      }
    }
  },
}
