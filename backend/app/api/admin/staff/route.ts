import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { StaffService } from '@/lib/services/staffService'
import { adminRateLimit, getClientIdentifier } from '@/lib/rateLimit'
import { validateRequest, staffSchema } from '@/lib/validation'

export const maxDuration = 30

const staffService = new StaffService()

export async function POST(request: NextRequest) {
  const rl = adminRateLimit(getClientIdentifier(request))
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded. Please try again later.' }, { status: 429 })
  }

  try {
    const session = await auth()

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const rawOrder = parseInt(formData.get('order') as string)
    const validated = validateRequest(staffSchema, {
      name: formData.get('name'),
      role: formData.get('role'),
      bio: formData.get('bio') || undefined,
      email: formData.get('email') || undefined,
      order: isNaN(rawOrder) ? undefined : rawOrder,
      isActive: formData.get('isActive') === 'true',
    })
    const imageFile = formData.get('image') as File

    const staff = await staffService.createStaff({
      name: validated.name,
      role: validated.role,
      bio: validated.bio,
      email: validated.email,
      order: validated.order,
      isActive: validated.isActive
    }, imageFile || undefined)

    return NextResponse.json({
      success: true,
      data: staff
    })
  } catch (error: any) {
    console.error('Create staff error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create staff member' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const rl = adminRateLimit(getClientIdentifier(request))
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded. Please try again later.' }, { status: 429 })
  }

  try {
    const session = await auth()

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Missing staff ID' },
        { status: 400 }
      )
    }

    // Validate only the fields that are present
    const partialStaffSchema = staffSchema.partial()
    const rawOrder = formData.get('order') ? parseInt(formData.get('order') as string) : undefined
    const updateData = validateRequest(partialStaffSchema, {
      ...(formData.get('name') ? { name: formData.get('name') } : {}),
      ...(formData.get('role') ? { role: formData.get('role') } : {}),
      ...(formData.get('bio') !== null ? { bio: (formData.get('bio') as string) || undefined } : {}),
      ...(formData.get('email') !== null ? { email: (formData.get('email') as string) || undefined } : {}),
      ...(rawOrder !== undefined && !isNaN(rawOrder) ? { order: rawOrder } : {}),
      ...(formData.get('isActive') !== null ? { isActive: formData.get('isActive') === 'true' } : {}),
    })
    const imageFile = formData.get('image') as File

    const staff = await staffService.updateStaff(id, updateData, imageFile || undefined)

    return NextResponse.json({
      success: true,
      data: staff
    })
  } catch (error: any) {
    console.error('Update staff error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update staff member' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const rl = adminRateLimit(getClientIdentifier(request))
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded. Please try again later.' }, { status: 429 })
  }

  try {
    const session = await auth()

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id || id.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Missing staff ID' },
        { status: 400 }
      )
    }

    await staffService.deleteStaff(id)

    return NextResponse.json({
      success: true
    })
  } catch (error: any) {
    console.error('Delete staff error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete staff member' },
      { status: 500 }
    )
  }
}
