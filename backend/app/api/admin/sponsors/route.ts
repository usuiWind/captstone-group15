import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SponsorService } from '@/lib/services/sponsorService'

const sponsorService = new SponsorService()

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
    const websiteUrl = formData.get('websiteUrl') as string
    const tier = formData.get('tier') as string
    const order = parseInt(formData.get('order') as string)
    const isActive = formData.get('isActive') === 'true'
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    const logoFile = formData.get('logo') as File

    if (!name || !tier || isNaN(order) || !logoFile) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, tier, order, logo' },
        { status: 400 }
      )
    }

    if (!['PLATINUM', 'GOLD', 'SILVER', 'BRONZE'].includes(tier)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tier. Must be PLATINUM, GOLD, SILVER, or BRONZE' },
        { status: 400 }
      )
    }

    const sponsor = await sponsorService.createSponsor({
      name,
      websiteUrl: websiteUrl || undefined,
      tier: tier as any,
      order,
      isActive,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      logoUrl: '' // This will be overwritten by the service method
    }, logoFile)

    return NextResponse.json({
      success: true,
      data: sponsor
    })
  } catch (error: any) {
    console.error('Create sponsor error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create sponsor' },
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
    const websiteUrl = formData.get('websiteUrl') as string
    const tier = formData.get('tier') as string
    const order = formData.get('order') as string
    const isActive = formData.get('isActive') as string
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    const logoFile = formData.get('logo') as File

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing sponsor ID' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (websiteUrl !== null) updateData.websiteUrl = websiteUrl || undefined
    if (tier) {
      if (!['PLATINUM', 'GOLD', 'SILVER', 'BRONZE'].includes(tier)) {
        return NextResponse.json(
          { success: false, error: 'Invalid tier. Must be PLATINUM, GOLD, SILVER, or BRONZE' },
          { status: 400 }
        )
      }
      updateData.tier = tier
    }
    if (order) updateData.order = parseInt(order)
    if (isActive !== null) updateData.isActive = isActive === 'true'
    if (startDate !== null) updateData.startDate = startDate ? new Date(startDate) : undefined
    if (endDate !== null) updateData.endDate = endDate ? new Date(endDate) : undefined

    const sponsor = await sponsorService.updateSponsor(id, updateData, logoFile || undefined)

    return NextResponse.json({
      success: true,
      data: sponsor
    })
  } catch (error: any) {
    console.error('Update sponsor error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update sponsor' },
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
        { success: false, error: 'Missing sponsor ID' },
        { status: 400 }
      )
    }

    await sponsorService.deleteSponsor(id)

    return NextResponse.json({
      success: true
    })
  } catch (error: any) {
    console.error('Delete sponsor error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete sponsor' },
      { status: 500 }
    )
  }
}
