import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { repositories } from '@/lib/container'
import { validateRequest, createEventSchema, updateEventSchema } from '@/lib/validation'
import { generalRateLimitAsync, getClientIdentifier } from '@/lib/rateLimit'
import { z } from 'zod'

export const maxDuration = 30

const deleteEventSchema = z.object({
  id: z.string().min(1, 'Event ID is required'),
})

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') return null
  return session
}

// GET /api/admin/events — list all events
export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  const limit = await generalRateLimitAsync(clientId)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const events = await repositories.event.findAll()
    return NextResponse.json({ data: events })
  } catch (error: any) {
    console.error('[ADMIN/EVENTS GET]', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

// POST /api/admin/events — create a new event
export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  const limit = await generalRateLimitAsync(clientId)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let rawBody: any = {}
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const { title, description, eventDate, pointsValue } = validateRequest(createEventSchema, rawBody)
    const event = await repositories.event.create({
      title,
      description,
      eventDate: new Date(eventDate),
      pointsValue,
      createdBy: session.user.id,
    })
    return NextResponse.json({ data: event }, { status: 201 })
  } catch (error: any) {
    console.error('[ADMIN/EVENTS POST]', error)
    return NextResponse.json({ error: error.message || 'Failed to create event' }, { status: 400 })
  }
}

// PATCH /api/admin/events — update an event
export async function PATCH(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  const limit = await generalRateLimitAsync(clientId)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let rawBody: any = {}
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const { id, title, description, eventDate, pointsValue } = validateRequest(updateEventSchema, rawBody)
    const updates: any = {}
    if (title !== undefined)       updates.title       = title
    if (description !== undefined) updates.description = description
    if (eventDate !== undefined)   updates.eventDate   = new Date(eventDate)
    if (pointsValue !== undefined) updates.pointsValue = pointsValue

    const event = await repositories.event.update(id, updates)
    return NextResponse.json({ data: event })
  } catch (error: any) {
    console.error('[ADMIN/EVENTS PATCH]', error)
    return NextResponse.json({ error: error.message || 'Failed to update event' }, { status: 400 })
  }
}

// DELETE /api/admin/events?id=<id> — delete an event
export async function DELETE(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  const limit = await generalRateLimitAsync(clientId)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const rawId = searchParams.get('id') ?? ''

  try {
    const { id } = validateRequest(deleteEventSchema, { id: rawId })
    await repositories.event.delete(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[ADMIN/EVENTS DELETE]', error)
    return NextResponse.json({ error: error.message || 'Failed to delete event' }, { status: 400 })
  }
}
