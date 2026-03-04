import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AttendanceService } from '@/lib/services/attendanceService'

const attendanceService = new AttendanceService()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
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
