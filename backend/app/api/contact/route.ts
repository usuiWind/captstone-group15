import { NextRequest, NextResponse } from 'next/server'
import { contactRateLimit, getClientIdentifier } from '../../../lib/rateLimit'
import { validateRequest, contactSchema } from '../../../lib/validation'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  const rl = contactRateLimit(getClientIdentifier(request))
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many contact form submissions. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { firstName, lastName, email, message } = validateRequest(contactSchema, body)

    console.log('[CONTACT] New inquiry received:', {
      firstName,
      lastName,
      email,
      message,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    // Return Zod validation messages to help users correct their input
    if (error.message) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    console.error('Contact form error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit contact form' },
      { status: 500 }
    )
  }
}

