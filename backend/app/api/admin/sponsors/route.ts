import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { SponsorService } from '@/lib/services/sponsorService'
import { adminRateLimit, getClientIdentifier } from '@/lib/rateLimit'
import { validateRequest, sponsorSchema } from '@/lib/validation'

export const maxDuration = 30

const sponsorService = new SponsorService()

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
    const logoFile = formData.get('logo') as File

    if (!logoFile) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: logo' },
        { status: 400 }
      )
    }

    const validated = validateRequest(sponsorSchema, {
      name: formData.get('name'),
      websiteUrl: (formData.get('websiteUrl') as string) || undefined,
      tier: formData.get('tier'),
      order: isNaN(rawOrder) ? undefined : rawOrder,
      isActive: formData.get('isActive') === 'true',
      startDate: (formData.get('startDate') as string) || undefined,
      endDate: (formData.get('endDate') as string) || undefined,
    })

    const sponsor = await sponsorService.createSponsor({
      name: validated.name,
      websiteUrl: validated.websiteUrl,
      tier: validated.tier,
      order: validated.order,
      isActive: validated.isActive,
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      logoUrl: '' // overwritten by service
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

    if (!id || id.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Missing sponsor ID' },
        { status: 400 }
      )
    }

    // Validate only the fields that are present
    const partialSponsorSchema = sponsorSchema.partial()
    const rawOrder = formData.get('order') ? parseInt(formData.get('order') as string) : undefined
    const updateData = validateRequest(partialSponsorSchema, {
      ...(formData.get('name') ? { name: formData.get('name') } : {}),
      ...(formData.get('websiteUrl') !== null ? { websiteUrl: (formData.get('websiteUrl') as string) || undefined } : {}),
      ...(formData.get('tier') ? { tier: formData.get('tier') } : {}),
      ...(rawOrder !== undefined && !isNaN(rawOrder) ? { order: rawOrder } : {}),
      ...(formData.get('isActive') !== null ? { isActive: formData.get('isActive') === 'true' } : {}),
      ...(formData.get('startDate') !== null ? { startDate: (formData.get('startDate') as string) || undefined } : {}),
      ...(formData.get('endDate') !== null ? { endDate: (formData.get('endDate') as string) || undefined } : {}),
    })
    const logoFile = formData.get('logo') as File

    const resolvedUpdate: any = { ...updateData }
    if (updateData.startDate) resolvedUpdate.startDate = new Date(updateData.startDate)
    if (updateData.endDate) resolvedUpdate.endDate = new Date(updateData.endDate)

    const sponsor = await sponsorService.updateSponsor(id, resolvedUpdate, logoFile || undefined)

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
