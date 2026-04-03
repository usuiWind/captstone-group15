import { NextRequest, NextResponse } from 'next/server'
import { SponsorService } from '@/lib/services/sponsorService'
import { generalRateLimit, getClientIdentifier } from '@/lib/rateLimit'

export const maxDuration = 30

const sponsorService = new SponsorService()

export async function GET(request: NextRequest) {
  const rl = generalRateLimit(getClientIdentifier(request))
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded. Please try again later.' }, { status: 429 })
  }

  try {
    const sponsorsByTier = await sponsorService.getSponsorsByTier()

    return NextResponse.json({
      success: true,
      data: sponsorsByTier
    })
  } catch (error: any) {
    console.error('Get sponsors error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get sponsors' },
      { status: 500 }
    )
  }
}
