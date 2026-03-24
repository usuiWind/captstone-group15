import { supabaseAdmin } from '../../supabase'
import { VerificationToken } from '../../interfaces/models'
import { IVerificationTokenRepository } from '../../interfaces/repositories'

export const verificationTokenRepositorySupabase: IVerificationTokenRepository = {
  create: async (data: VerificationToken): Promise<VerificationToken> => {
    const { error } = await supabaseAdmin.from('verification_tokens').insert({
      token: data.token,
      identifier: data.identifier,
      expires: data.expires.toISOString(),
    })
    if (error) throw new Error(`Failed to create verification token: ${error.message}`)
    return data
  },

  findByToken: async (token: string): Promise<VerificationToken | null> => {
    const { data, error } = await supabaseAdmin
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !data) return null
    return {
      token: data.token,
      identifier: data.identifier,
      expires: new Date(data.expires),
    }
  },

  delete: async (token: string): Promise<void> => {
    await supabaseAdmin.from('verification_tokens').delete().eq('token', token)
  },

  deleteExpired: async (): Promise<void> => {
    await supabaseAdmin
      .from('verification_tokens')
      .delete()
      .lt('expires', new Date().toISOString())
  },
}
