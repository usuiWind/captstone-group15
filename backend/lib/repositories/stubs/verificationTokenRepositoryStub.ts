import { VerificationToken } from '../../interfaces/models'
import { IVerificationTokenRepository } from '../../interfaces/repositories'

const verificationTokens = new Map<string, VerificationToken>()

export const verificationTokenRepositoryStub: IVerificationTokenRepository = {
  create: async (data: VerificationToken): Promise<VerificationToken> => {
    verificationTokens.set(data.token, data)
    return data
  },

  findByToken: async (token: string): Promise<VerificationToken | null> => {
    return verificationTokens.get(token) ?? null
  },

  delete: async (token: string): Promise<void> => {
    verificationTokens.delete(token)
  },

  deleteExpired: async (): Promise<void> => {
    const now = new Date()
    for (const [token, verificationToken] of verificationTokens.entries()) {
      if (verificationToken.expires < now) {
        verificationTokens.delete(token)
      }
    }
  }
}
