import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { AttendanceService } from '@/lib/services/attendanceService'
import { adminRateLimit, getClientIdentifier } from '@/lib/rateLimit'
import { validateRequest, createAttendanceSchema } from '@/lib/validation'

export const maxDuration = 30

const attendanceService = new AttendanceService()

export async function POST(request: NextRequest) {
  const rl = adminRateLimit(getClientIdentifier(request))
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded. Please try again later.' }, { status: 429 })
  }

  try {
    const session = await auth()

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, date, eventName, points } = validateRequest(createAttendanceSchema, body)

    const attendance = await attendanceService.createAttendance({
      userId,
      date: new Date(date),
      eventName,
      points
    })

    return NextResponse.json({
      success: true,
      data: attendance
    })
  } catch (error: any) {
    console.error('Create attendance error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create attendance record' },
      { status: 500 }
    )
  }
}
