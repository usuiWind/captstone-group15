import { supabaseAdmin } from '../../supabase'
import { AdminOtpCode, CreateAdminOtpInput } from '../../interfaces/models'
import { IAdminOtpRepository } from '../../interfaces/repositories'

export const otpRepositorySupabase: IAdminOtpRepository = {
  create: async (data: CreateAdminOtpInput): Promise<AdminOtpCode> => {
    const { data: row, error } = await supabaseAdmin
      .from('admin_otp_codes')
      .insert({
        user_id: data.userId,
        code_hash: data.codeHash,
        expires_at: data.expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error || !row) throw new Error(`Failed to create OTP code: ${error?.message}`)

    return {
      id: row.id,
      userId: row.user_id,
      codeHash: row.code_hash,
      expiresAt: new Date(row.expires_at),
      used: row.used,
      createdAt: new Date(row.created_at),
    }
  },

  findLatestForUser: async (userId: string): Promise<AdminOtpCode | null> => {
    const { data: row, error } = await supabaseAdmin
      .from('admin_otp_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !row) return null

    return {
      id: row.id,
      userId: row.user_id,
      codeHash: row.code_hash,
      expiresAt: new Date(row.expires_at),
      used: row.used,
      createdAt: new Date(row.created_at),
    }
  },

  markUsed: async (id: string): Promise<void> => {
    const { error } = await supabaseAdmin
      .from('admin_otp_codes')
      .update({ used: true })
      .eq('id', id)

    if (error) throw new Error(`Failed to mark OTP as used: ${error.message}`)
  },

  deleteExpiredForUser: async (userId: string): Promise<void> => {
    await supabaseAdmin
      .from('admin_otp_codes')
      .delete()
      .eq('user_id', userId)
      .lt('expires_at', new Date().toISOString())
  },
}
