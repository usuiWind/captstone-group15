import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { MembershipService } from '@/lib/services/membershipService'
import { generalRateLimit, getClientIdentifier } from '@/lib/rateLimit'

export const maxDuration = 30

const membershipService = new MembershipService()

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

    const membership = await membershipService.getByUserId(session.user.id)
    
    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Membership not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: membership
    })
  } catch (error: any) {
    console.error('Get membership error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get membership' },
      { status: 500 }
    )
  }
}
