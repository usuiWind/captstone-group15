import { NextRequest, NextResponse } from 'next/server'
import { generalRateLimitAsync, getClientIdentifier } from '../../../lib/rateLimit'

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const rl = await generalRateLimitAsync(identifier)
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { firstName, lastName, email, message } = body as {
      firstName?: string
      lastName?: string
      email?: string
      message?: string
    }

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('[CONTACT] New inquiry received:', {
      firstName,
      lastName,
      email,
      message,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit contact form' },
      { status: 500 }
    )
  }
}

