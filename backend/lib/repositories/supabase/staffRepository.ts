import { supabaseAdmin } from '../../supabase'
import { StaffMember, CreateStaffInput } from '../../interfaces/models'
import { IStaffRepository } from '../../interfaces/repositories'

function mapRow(row: any): StaffMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    bio: row.bio ?? undefined,
    email: row.email ?? undefined,
    imageUrl: row.image_url ?? undefined,
    order: row.order,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
  }
}

export const staffRepositorySupabase: IStaffRepository = {
  findAllActive: async (): Promise<StaffMember[]> => {
    const { data, error } = await supabaseAdmin
      .from('staff')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true })
    if (error || !data) return []
    return data.map(mapRow)
  },

  findById: async (id: string): Promise<StaffMember | null> => {
    const { data, error } = await supabaseAdmin
      .from('staff')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return mapRow(data)
  },

  create: async (data: CreateStaffInput): Promise<StaffMember> => {
    const { data: row, error } = await supabaseAdmin
      .from('staff')
      .insert({
        name: data.name,
        role: data.role,
        bio: data.bio ?? null,
        email: data.email ?? null,
        image_url: data.imageUrl ?? null,
        order: data.order,
        is_active: data.isActive,
      })
      .select()
      .single()
    if (error || !row) throw new Error(`Failed to create staff member: ${error?.message}`)
    return mapRow(row)
  },

  update: async (id: string, data: Partial<StaffMember>): Promise<StaffMember> => {
    const patch: Record<string, any> = {}
    if (data.name !== undefined) patch.name = data.name
    if (data.role !== undefined) patch.role = data.role
    if (data.bio !== undefined) patch.bio = data.bio ?? null
    if (data.email !== undefined) patch.email = data.email ?? null
    if (data.imageUrl !== undefined) patch.image_url = data.imageUrl ?? null
    if (data.order !== undefined) patch.order = data.order
    if (data.isActive !== undefined) patch.is_active = data.isActive

    const { data: row, error } = await supabaseAdmin
      .from('staff')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error || !row) throw new Error(`Failed to update staff member: ${error?.message}`)
    return mapRow(row)
  },

  softDelete: async (id: string): Promise<void> => {
    await supabaseAdmin.from('staff').update({ is_active: false }).eq('id', id)
  },
}
