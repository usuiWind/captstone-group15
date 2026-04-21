import { NextRequest } from 'next/server'
import { repositories } from '@/lib/container'
import { generalRateLimitAsync, getClientIdentifier } from '@/lib/rateLimit'
import { createSecureResponse, createSecureErrorResponse } from '@/lib/security'

export const maxDuration = 30

export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  const limit = await generalRateLimitAsync(clientId)
  if (!limit.allowed) {
    return createSecureErrorResponse('Too many requests', 429)
  }
  const { searchParams } = new URL(request.url)
  const all = searchParams.get('all') === 'true'
  try {
    const events = all
      ? await repositories.event.findAll()
      : await repositories.event.findUpcoming()
    return createSecureResponse({ data: events })
  } catch (error: any) {
    console.error('[EVENTS GET]', error)
    return createSecureErrorResponse('Failed to fetch events', 500)
  }
}