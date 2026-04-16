import { supabaseAdmin } from '../../supabase'
import { ClubEvent, CreateEventInput } from '../../interfaces/models'
import { IEventRepository } from '../../interfaces/repositories'

function mapRow(row: any): ClubEvent {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description ?? undefined,
    eventDate: new Date(row.event_date),
    pointsValue: row.points_value ?? 1,
    createdBy: row.created_by ?? undefined,
    createdAt: new Date(row.created_at),
  }
}

export const eventRepositorySupabase: IEventRepository = {
  findAll: async (): Promise<ClubEvent[]> => {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })

    if (error || !data) return []
    return data.map(mapRow)
  },

  findUpcoming: async (): Promise<ClubEvent[]> => {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .gte('event_date', today)
      .order('event_date', { ascending: true })

    if (error || !data) return []
    return data.map(mapRow)
  },

  findById: async (id: string): Promise<ClubEvent | null> => {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', parseInt(id, 10))
      .single()

    if (error || !data) return null
    return mapRow(data)
  },

  create: async (data: CreateEventInput): Promise<ClubEvent> => {
    const { data: row, error } = await supabaseAdmin
      .from('events')
      .insert({
        title: data.title,
        description: data.description ?? null,
        event_date: data.eventDate.toISOString().split('T')[0],
        points_value: data.pointsValue,
        created_by: data.createdBy ?? null,
      })
      .select('*')
      .single()

    if (error || !row) throw new Error(`Failed to create event: ${error?.message}`)
    return mapRow(row)
  },

  update: async (id: string, data: Partial<Pick<ClubEvent, 'title' | 'description' | 'eventDate' | 'pointsValue'>>): Promise<ClubEvent> => {
    const patch: Record<string, any> = {}
    if (data.title !== undefined)       patch.title        = data.title
    if (data.description !== undefined) patch.description  = data.description
    if (data.eventDate !== undefined)   patch.event_date   = data.eventDate.toISOString().split('T')[0]
    if (data.pointsValue !== undefined) patch.points_value = data.pointsValue

    const { data: row, error } = await supabaseAdmin
      .from('events')
      .update(patch)
      .eq('id', parseInt(id, 10))
      .select('*')
      .single()

    if (error || !row) throw new Error(`Failed to update event: ${error?.message}`)
    return mapRow(row)
  },

  delete: async (id: string): Promise<void> => {
    await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', parseInt(id, 10))
  },
}
