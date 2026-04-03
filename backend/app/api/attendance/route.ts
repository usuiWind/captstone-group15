import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { AttendanceService } from '@/lib/services/attendanceService'
import { generalRateLimit, getClientIdentifier } from '@/lib/rateLimit'

export const maxDuration = 30

const attendanceService = new AttendanceService()

export async function GET(request: NextRequest) {
  const rl = generalRateLimit(getClientIdentifier(request))
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded. Please try again later.' }, { status: 429 })
  }

  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { records, totalPoints } = await attendanceService.getUserAttendance(session.user.id)

    return NextResponse.json({
      success: true,
      data: { records, totalPoints }
    })
  } catch (error: any) {
    console.error('Get attendance error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get attendance' },
      { status: 500 }
    )
  }
}
