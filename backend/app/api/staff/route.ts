import { NextRequest, NextResponse } from 'next/server'
import { StaffService } from '@/lib/services/staffService'

const staffService = new StaffService()

export async function GET(request: NextRequest) {
  try {
    const staff = await staffService.getActiveStaff()

    return NextResponse.json({
      success: true,
      data: staff
    })
  } catch (error: any) {
    console.error('Get staff error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get staff' },
      { status: 500 }
    )
  }
}
