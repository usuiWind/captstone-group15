import { NextRequest, NextResponse } from 'next/server'
import { repositories } from '@/lib/container'
import { generalRateLimit, getClientIdentifier } from '@/lib/rateLimit'

export const maxDuration = 30

// GET /api/events — public list of upcoming events (for the member calendar)
export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  const limit = generalRateLimit(clientId)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const all = searchParams.get('all') === 'true'

  try {
    const events = all
      ? await repositories.event.findAll()
      : await repositories.event.findUpcoming()
    return NextResponse.json({ data: events })
  } catch (error: any) {
    console.error('[EVENTS GET]', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
