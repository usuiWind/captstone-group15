import { supabaseAdmin } from '../../supabase'
import { Attendance, CreateAttendanceInput } from '../../interfaces/models'
import { IAttendanceRepository } from '../../interfaces/repositories'

// Joins attendance → events and point_transactions to build the Attendance interface
const SELECT = `
  id,
  user_id,
  check_in_time,
  events ( id, title, points_value )
`

function mapRow(row: any): Attendance {
  return {
    id: String(row.id),
    userId: row.user_id,
    date: new Date(row.check_in_time),
    points: row.events?.points_value ?? 1,
    eventName: row.events?.title ?? undefined,
    createdAt: new Date(row.check_in_time),
  }
}

export const attendanceRepositorySupabase: IAttendanceRepository = {
  findByUserId: async (userId: string): Promise<Attendance[]> => {
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .select(SELECT)
      .eq('user_id', userId)
      .order('check_in_time', { ascending: false })

    if (error || !data) return []
    return data.map(mapRow)
  },

  getTotalPoints: async (userId: string): Promise<number> => {
    const { data, error } = await supabaseAdmin
      .from('point_transactions')
      .select('points')
      .eq('user_id', userId)

    if (error || !data) return 0
    return data.reduce((sum, row) => sum + (row.points ?? 0), 0)
  },

  create: async (data: CreateAttendanceInput): Promise<Attendance> => {
    // Look up the event by name to get the event_id and points_value
    let eventId: number | null = null
    let pointsValue = data.points

    if (data.eventName) {
      const { data: eventRow } = await supabaseAdmin
        .from('events')
        .select('id, points_value')
        .ilike('title', data.eventName)
        .single()

      if (eventRow) {
        eventId = eventRow.id
        pointsValue = eventRow.points_value ?? data.points
      }
    }

    const { data: row, error } = await supabaseAdmin
      .from('attendance')
      .insert({
        user_id: data.userId,
        event_id: eventId,
        check_in_time: data.date.toISOString(),
      })
      .select(SELECT)
      .single()

    if (error || !row) throw new Error(`Failed to create attendance: ${error?.message}`)

    // Record in point_transactions
    await supabaseAdmin.from('point_transactions').insert({
      user_id: data.userId,
      event_id: eventId,
      points: pointsValue,
      reason: data.eventName ?? 'Event attendance',
    })

    return mapRow(row)
  },

  delete: async (id: string): Promise<void> => {
    await supabaseAdmin.from('attendance').delete().eq('id', parseInt(id, 10))
  },
}
