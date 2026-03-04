import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StaffService } from '@/lib/services/staffService'

const staffService = new StaffService()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const name = formData.get('name') as string
    const role = formData.get('role') as string
    const bio = formData.get('bio') as string
    const email = formData.get('email') as string
    const order = parseInt(formData.get('order') as string)
    const isActive = formData.get('isActive') === 'true'
    const imageFile = formData.get('image') as File

    if (!name || !role || isNaN(order)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, role, order' },
        { status: 400 }
      )
    }

    const staff = await staffService.createStaff({
      name,
      role,
      bio: bio || undefined,
      email: email || undefined,
      order,
      isActive
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
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const role = formData.get('role') as string
    const bio = formData.get('bio') as string
    const email = formData.get('email') as string
    const order = formData.get('order') as string
    const isActive = formData.get('isActive') as string
    const imageFile = formData.get('image') as File

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing staff ID' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (role) updateData.role = role
    if (bio !== null) updateData.bio = bio || undefined
    if (email !== null) updateData.email = email || undefined
    if (order) updateData.order = parseInt(order)
    if (isActive !== null) updateData.isActive = isActive === 'true'

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
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
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
