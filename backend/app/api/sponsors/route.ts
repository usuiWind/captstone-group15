import { NextRequest } from 'next/server'
import { createSecureResponse, createSecureErrorResponse } from '@/lib/security'
import { SponsorService } from '@/lib/services/sponsorService'

const sponsorService = new SponsorService()

export async function GET(request: NextRequest) {
  try {
    const sponsorsByTier = await sponsorService.getSponsorsByTier()

    return createSecureResponse({
      success: true,
      data: sponsorsByTier
    })
  } catch (error: any) {
    console.error('Get sponsors error:', error)
    return createSecureErrorResponse('Failed to get sponsors', 500)
  }
}
