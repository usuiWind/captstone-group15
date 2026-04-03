import { NextRequest, NextResponse } from 'next/server'
import { StaffService } from '@/lib/services/staffService'
import { generalRateLimit, getClientIdentifier } from '@/lib/rateLimit'

export const maxDuration = 30

const staffService = new StaffService()

export async function GET(request: NextRequest) {
  const rl = generalRateLimit(getClientIdentifier(request))
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded. Please try again later.' }, { status: 429 })
  }

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
