import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AttendanceService } from '@/lib/services/attendanceService'

const attendanceService = new AttendanceService()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, date, eventName, points } = body

    if (!userId || !date || !points) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, date, points' },
        { status: 400 }
      )
    }

    if (typeof points !== 'number' || points < 0) {
      return NextResponse.json(
        { success: false, error: 'Points must be a non-negative number' },
        { status: 400 }
      )
    }

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
