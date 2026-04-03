import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { MembershipService } from '@/lib/services/membershipService'
import { cancelSubscriptionAtPeriodEnd } from '@/lib/stripe'
import { generalRateLimit, getClientIdentifier } from '@/lib/rateLimit'

export const maxDuration = 30

const membershipService = new MembershipService()

export async function POST(request: NextRequest) {
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

    // Get user's membership
    const membership = await membershipService.getByUserId(session.user.id)
    
    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Membership not found' },
        { status: 404 }
      )
    }

    // Cancel subscription in Stripe
    await cancelSubscriptionAtPeriodEnd(membership.stripeSubscriptionId)
    
    // Update membership in database
    const updatedMembership = await membershipService.markCancelAtPeriodEnd(session.user.id)

    return NextResponse.json({
      success: true,
      data: updatedMembership
    })
  } catch (error: any) {
    console.error('Cancel membership error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel membership' },
      { status: 500 }
    )
  }
}
