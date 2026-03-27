import { NextRequest, NextResponse } from 'next/server'
import { SponsorService } from '@/lib/services/sponsorService'

const sponsorService = new SponsorService()

export async function GET(request: NextRequest) {
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
