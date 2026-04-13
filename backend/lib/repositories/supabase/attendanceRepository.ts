import { supabaseAdmin } from '../../supabase'
import { Attendance, CreateAttendanceInput } from '../../interfaces/models'
import { IAttendanceRepository } from '../../interfaces/repositories'

// Joins attendance → events and point_transactions to build the Attendance interface.
// point_transactions is the authoritative source for points awarded — events.points_value
// is only the default at creation time and may have been overridden since.
const SELECT = `
  id,
  user_id,
  check_in_time,
  events ( id, title, points_value ),
  point_transactions ( points )
`

function mapRow(row: any): Attendance {
  // point_transactions is a 1-to-many join; we always create exactly one per attendance row.
  const txPoints = Array.isArray(row.point_transactions)
    ? row.point_transactions[0]?.points
    : row.point_transactions?.points

  return {
    id: String(row.id),
    userId: row.user_id,
    date: new Date(row.check_in_time),
    points: txPoints ?? row.events?.points_value ?? 1,
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

    const attendanceId = row.id

    // Record in point_transactions — attendance_id links them for cascade deletes
    await supabaseAdmin.from('point_transactions').insert({
      user_id: data.userId,
      event_id: eventId,
      attendance_id: attendanceId,
      points: pointsValue,
      reason: data.eventName ?? 'Event attendance',
    })

    return mapRow(row)
  },

  update: async (id: string, data: Partial<Pick<Attendance, 'points' | 'eventName' | 'date'>>): Promise<Attendance> => {
    const numId = parseInt(id, 10)

    if (data.date !== undefined) {
      await supabaseAdmin
        .from('attendance')
        .update({ check_in_time: data.date.toISOString() })
        .eq('id', numId)
    }

    if (data.points !== undefined) {
      await supabaseAdmin
        .from('point_transactions')
        .update({ points: data.points })
        .eq('attendance_id', numId)
    }

    const { data: row, error } = await supabaseAdmin
      .from('attendance')
      .select(SELECT)
      .eq('id', numId)
      .single()

    if (error || !row) throw new Error(`Failed to fetch updated attendance: ${error?.message}`)
    return mapRow(row)
  },

  delete: async (id: string): Promise<void> => {
    const numId = parseInt(id, 10)
    // Explicit delete covers records created before attendance_id was added.
    // New records cascade automatically via the FK.
    await supabaseAdmin.from('point_transactions').delete().eq('attendance_id', numId)
    await supabaseAdmin.from('attendance').delete().eq('id', numId)
  },
}
