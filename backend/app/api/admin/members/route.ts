import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserService } from '@/lib/services/userService'
import { MembershipService } from '@/lib/services/membershipService'

const userService = new UserService()
const membershipService = new MembershipService()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Get all users (this would need to be implemented in the repository)
    const users = await userService.getAllUsers()
    
    // Get membership information for each user
    const membersWithMembership = await Promise.all(
      users.map(async (user) => {
        const membership = await membershipService.getByUserId(user.id)
        
        // Filter by status if provided
        if (status && membership?.status !== status) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          membership: membership ? {
            id: membership.id,
            status: membership.status,
            planName: membership.planName,
            currentPeriodStart: membership.currentPeriodStart,
            currentPeriodEnd: membership.currentPeriodEnd,
            cancelAtPeriodEnd: membership.cancelAtPeriodEnd,
            createdAt: membership.createdAt,
            updatedAt: membership.updatedAt
          } : null
        }
      })
    )

    // Filter out null values (from status filtering)
    const filteredMembers = membersWithMembership.filter(member => member !== null)

    return NextResponse.json({
      success: true,
      data: filteredMembers
    })
  } catch (error: any) {
    console.error('Get members error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get members' },
      { status: 500 }
    )
  }
}
