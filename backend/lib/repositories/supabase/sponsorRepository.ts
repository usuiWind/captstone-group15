import { supabaseAdmin } from '../../supabase'
import { Sponsor, CreateSponsorInput } from '../../interfaces/models'
import { ISponsorRepository } from '../../interfaces/repositories'

function mapRow(row: any): Sponsor {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url ?? '',
    websiteUrl: row.website_url ?? undefined,
    tier: row.tier as Sponsor['tier'],
    order: row.order,
    isActive: row.is_active,
    startDate: row.start_date ? new Date(row.start_date) : undefined,
    endDate: row.end_date ? new Date(row.end_date) : undefined,
    createdAt: new Date(row.created_at),
  }
}

export const sponsorRepositorySupabase: ISponsorRepository = {
  findAllActive: async (): Promise<Sponsor[]> => {
    const now = new Date().toISOString().split('T')[0]
    const { data, error } = await supabaseAdmin
      .from('sponsors')
      .select('*')
      .eq('is_active', true)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('order', { ascending: true })
    if (error || !data) return []
    return data.map(mapRow)
  },

  findById: async (id: string): Promise<Sponsor | null> => {
    const { data, error } = await supabaseAdmin
      .from('sponsors')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return mapRow(data)
  },

  create: async (data: CreateSponsorInput): Promise<Sponsor> => {
    const { data: row, error } = await supabaseAdmin
      .from('sponsors')
      .insert({
        name: data.name,
        logo_url: data.logoUrl,
        website_url: data.websiteUrl ?? null,
        tier: data.tier,
        order: data.order,
        is_active: data.isActive,
        start_date: data.startDate?.toISOString().split('T')[0] ?? null,
        end_date: data.endDate?.toISOString().split('T')[0] ?? null,
      })
      .select()
      .single()
    if (error || !row) throw new Error(`Failed to create sponsor: ${error?.message}`)
    return mapRow(row)
  },

  update: async (id: string, data: Partial<Sponsor>): Promise<Sponsor> => {
    const patch: Record<string, any> = {}
    if (data.name !== undefined) patch.name = data.name
    if (data.logoUrl !== undefined) patch.logo_url = data.logoUrl
    if (data.websiteUrl !== undefined) patch.website_url = data.websiteUrl ?? null
    if (data.tier !== undefined) patch.tier = data.tier
    if (data.order !== undefined) patch.order = data.order
    if (data.isActive !== undefined) patch.is_active = data.isActive
    if (data.startDate !== undefined) patch.start_date = data.startDate?.toISOString().split('T')[0] ?? null
    if (data.endDate !== undefined) patch.end_date = data.endDate?.toISOString().split('T')[0] ?? null

    const { data: row, error } = await supabaseAdmin
      .from('sponsors')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error || !row) throw new Error(`Failed to update sponsor: ${error?.message}`)
    return mapRow(row)
  },

  softDelete: async (id: string): Promise<void> => {
    await supabaseAdmin.from('sponsors').update({ is_active: false }).eq('id', id)
  },
}
