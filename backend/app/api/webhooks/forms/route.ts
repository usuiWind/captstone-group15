import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { repositories } from '@/lib/container'
import { AttendanceService } from '@/lib/services/attendanceService'
import { validateRequest, formsWebhookSchema } from '@/lib/validation'
import { getSupabaseAdmin } from '@/lib/supabase'

export const maxDuration = 30

const attendanceService = new AttendanceService()

export async function POST(request: NextRequest) {
  // Verify shared secret before processing anything
  const secret = process.env.FORMS_WEBHOOK_SECRET
  if (!secret) {
    console.error('[FORMS] FORMS_WEBHOOK_SECRET is not set')
    return NextResponse.json({ success: false, error: 'Webhook not configured' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  const secretBuf = Buffer.from(secret)
  const tokenBuf  = Buffer.from(token)
  if (
    tokenBuf.length === 0 ||
    tokenBuf.length !== secretBuf.length ||
    !crypto.timingSafeEqual(secretBuf, tokenBuf)
  ) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let rawBody: any = {}
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const { email, event_name, event_date, points } = validateRequest(formsWebhookSchema, rawBody)

    const defaultPoints = Math.max(1, parseInt(process.env.FORMS_DEFAULT_POINTS ?? '1', 10))
    const awardedPoints = points ?? defaultPoints

    const user = await repositories.user.findByEmail(email)

    if (!user) {
      // Log for admin review — return 200 so webhook platforms don't retry
      if (process.env.SUPABASE_URL) {
        await getSupabaseAdmin()
          .from('unmatched_form_submissions')
          .insert({ email, raw_payload: rawBody })
      }
      console.warn(`[FORMS] Unmatched submission for email: ${email}`)
      return NextResponse.json({ success: true, matched: false })
    }

    await attendanceService.createAttendance({
      userId: user.id,
      date: new Date(event_date),
      eventName: event_name,
      points: awardedPoints,
    })

    return NextResponse.json({ success: true, matched: true })
  } catch (error: any) {
    console.error('[FORMS] Webhook processing error:', error)
    if (error.message) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Webhook processing failed' }, { status: 500 })
  }
}
