import { supabaseAdmin } from '../../supabase'
import { User, CreateUserInput } from '../../interfaces/models'
import { IUserRepository } from '../../interfaces/repositories'

function mapRow(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.full_name ?? undefined,
    role: row.role === 'admin' ? 'ADMIN' : 'MEMBER',
    createdAt: new Date(row.created_at),
  }
}

export const userRepositorySupabase: IUserRepository = {
  findByEmail: async (email: string): Promise<User | null> => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()
    if (error || !data) return null
    return mapRow(data)
  },

  findById: async (id: string): Promise<User | null> => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return mapRow(data)
  },

  findAll: async (): Promise<User[]> => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return data.map(mapRow)
  },

  // Creates auth user + profile row. Password is NOT set here —
  // the member sets it later via the /register?token=... link.
  create: async (data: CreateUserInput): Promise<User> => {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      email_confirm: true,
      user_metadata: { full_name: data.name ?? '' },
    })
    if (authError || !authData.user) {
      throw new Error(`Failed to create auth user: ${authError?.message}`)
    }

    const userId = authData.user.id
    // Use upsert in case a DB trigger already created the profile row.
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: data.name ?? '',
        email: data.email,
        role: data.role === 'ADMIN' ? 'admin' : 'member',
      }, { onConflict: 'id' })
      .select()
      .single()

    if (profileError || !profile) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw new Error(`Failed to create profile: ${profileError?.message}`)
    }

    return mapRow(profile)
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const profileUpdate: Record<string, any> = {}
    if (data.name !== undefined) profileUpdate.full_name = data.name
    if (data.role !== undefined) profileUpdate.role = data.role === 'ADMIN' ? 'admin' : 'member'

    const { data: updated, error } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdate)
      .eq('id', id)
      .select()
      .single()

    if (error || !updated) throw new Error(`Failed to update user: ${error?.message}`)
    return mapRow(updated)
  },

  // Sets the user's password via Supabase Auth Admin API.
  // Called during the /register flow after token validation.
  setPassword: async (id: string, plainPassword: string): Promise<void> => {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: plainPassword,
    })
    if (error) throw new Error(`Failed to set password: ${error.message}`)
  },

  delete: async (id: string): Promise<void> => {
    // Deleting from auth.users cascades to profiles
    await supabaseAdmin.auth.admin.deleteUser(id)
  },
}
