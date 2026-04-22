import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { AttendanceService } from '@/lib/services/attendanceService'
import { validateRequest, createAttendanceSchema, updateAttendanceSchema } from '@/lib/validation'
import { z } from 'zod'

export const maxDuration = 30

const attendanceService = new AttendanceService()

const deleteAttendanceSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid attendance ID'),
})

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const { id: userId } = validateRequest(
      z.object({ id: z.string().uuid('Invalid user ID') }),
      { id: searchParams.get('userId') }
    )

    const { records, totalPoints } = await attendanceService.getUserAttendance(userId)
    return NextResponse.json({ success: true, data: { records, totalPoints } })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to get attendance' }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { userId, date, eventName, points } = validateRequest(createAttendanceSchema, body)

    const attendance = await attendanceService.createAttendance({
      userId,
      date: new Date(date),
      eventName,
      points,
    })

    return NextResponse.json({ success: true, data: attendance })
  } catch (error: any) {
    console.error('Create attendance error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to create attendance record' }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, points, eventName, date } = validateRequest(updateAttendanceSchema, body)

    const updated = await attendanceService.updateAttendance(id, {
      ...(points !== undefined ? { points } : {}),
      ...(eventName !== undefined ? { eventName } : {}),
      ...(date !== undefined ? { date: new Date(date) } : {}),
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Update attendance error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to update attendance record' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const { id } = validateRequest(deleteAttendanceSchema, { id: searchParams.get('id') })

    await attendanceService.deleteAttendance(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete attendance error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete attendance record' }, { status: 400 })
  }
}
