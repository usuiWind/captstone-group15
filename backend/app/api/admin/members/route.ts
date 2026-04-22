import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { UserService } from '@/lib/services/userService'
import { MembershipService } from '@/lib/services/membershipService'
import { validateRequest, updateMemberSchema } from '@/lib/validation'
import { repositories } from '@/lib/container'
import { AttendanceService } from '@/lib/services/attendanceService'
import { z } from 'zod'

const userService = new UserService()
const membershipService = new MembershipService()
const attendanceService = new AttendanceService()

const deleteMemberSchema = z.object({
  id: z.string().uuid('Invalid member ID'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })

    let email: string, name: string | undefined, password: string | undefined
    try {
      const body = await request.json()
      email = String(body.email ?? '').trim().toLowerCase()
      name  = body.name     ? String(body.name).trim()     : undefined
      password = body.password ? String(body.password)     : undefined
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
    }

    if (!email) return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })

    const user = await repositories.user.create({ email, name, role: 'MEMBER' })
    if (password) await repositories.user.setPassword(user.id, password)

    return NextResponse.json({ success: true, data: { id: user.id, email: user.email, name: user.name, role: user.role } }, { status: 201 })
  } catch (error: any) {
    console.error('Create member error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to create member' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Get all users (this would need to be implemented in the repository)
    const users = await userService.getAllUsers()
    
    // Get membership information for each user
    const membersWithMembership = await Promise.all(
      users.map(async (user) => {
        const [membership, points] = await Promise.all([
          membershipService.getByUserId(user.id),
          repositories.attendance.getTotalPoints(user.id),
        ])

        // Filter by status if provided
        if (status && membership?.status !== status) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          points,
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

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, role, revokeAccess } = validateRequest(updateMemberSchema, body)

    // Prevent admin from modifying their own role
    if (id === session.user.id && role !== undefined && role !== session.user.role) {
      return NextResponse.json(
        { success: false, error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    const target = await userService.getUserById(id)
    if (!target) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      )
    }

    const updates: { name?: string; role?: 'MEMBER' | 'ADMIN' } = {}
    if (name !== undefined) updates.name = name
    if (role !== undefined) updates.role = role

    const updatedUser = Object.keys(updates).length > 0
      ? await userService.updateUser(id, updates)
      : target

    let membership = await membershipService.getByUserId(id)

    if (revokeAccess) {
      membership = await membershipService.revokeByUserId(id)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        membership: membership ? {
          id: membership.id,
          status: membership.status,
          planName: membership.planName,
          cancelAtPeriodEnd: membership.cancelAtPeriodEnd,
        } : null,
      }
    })
  } catch (error: any) {
    console.error('Update member error:', error)
    if (error.message) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update member' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const { id } = validateRequest(deleteMemberSchema, { id: searchParams.get('id') })

    // Prevent admin from deleting themselves
    if (id === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    const target = await userService.getUserById(id)
    if (!target) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      )
    }

    // Cancel Stripe subscription and delete membership record first
    await membershipService.deleteByUserId(id)

    // Delete the user (Supabase cascades auth.users → profiles)
    await userService.deleteUser(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete member error:', error)
    if (error.message) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, error: 'Failed to delete member' },
      { status: 500 }
    )
  }
}
