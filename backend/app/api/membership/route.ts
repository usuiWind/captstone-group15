import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MembershipService } from '@/lib/services/membershipService'

const membershipService = new MembershipService()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
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
