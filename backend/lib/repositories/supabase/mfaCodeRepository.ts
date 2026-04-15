import { supabaseAdmin } from '../../supabase'
import { MfaCode, CreateMfaCodeInput } from '../../interfaces/models'
import { IMfaCodeRepository } from '../../interfaces/repositories'

export const mfaCodeRepositorySupabase: IMfaCodeRepository = {
  create: async (data: CreateMfaCodeInput): Promise<MfaCode> => {
    const { data: row, error } = await supabaseAdmin
      .from('mfa_codes')
      .insert({
        user_id: data.userId,
        code: data.code,
        expires_at: data.expiresAt.toISOString(),
      })
      .select()
      .single()
    if (error || !row) throw new Error(`Failed to create MFA code: ${error?.message}`)
    return {
      id: row.id,
      userId: row.user_id,
      code: row.code,
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at),
    }
  },

  findByUserId: async (userId: string): Promise<MfaCode | null> => {
    const { data, error } = await supabaseAdmin
      .from('mfa_codes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (error || !data) return null
    return {
      id: data.id,
      userId: data.user_id,
      code: data.code,
      expiresAt: new Date(data.expires_at),
      createdAt: new Date(data.created_at),
    }
  },

  deleteByUserId: async (userId: string): Promise<void> => {
    await supabaseAdmin.from('mfa_codes').delete().eq('user_id', userId)
  },

  deleteExpired: async (): Promise<void> => {
    await supabaseAdmin
      .from('mfa_codes')
      .delete()
      .lt('expires_at', new Date().toISOString())
  },
}
