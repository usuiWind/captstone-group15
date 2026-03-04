import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { UserService } from '@/lib/services/userService'
import { MembershipService } from '@/lib/services/membershipService'
import { repositories } from '@/lib/container'
import { constructWebhookEvent } from '@/lib/stripe'
import { emailService } from '@/lib/email'

const userService = new UserService()
const membershipService = new MembershipService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing Stripe signature' },
        { status: 400 }
      )
    }

    const event = constructWebhookEvent(body, signature)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        
        // Create user from Stripe checkout
        const user = await userService.createFromStripeCheckout(session)
        
        // Create membership
        await membershipService.createFromStripeSession({
          ...session,
          metadata: { userId: user.id }
        })
        
        // Generate verification token with race condition protection
        let token: string
        let attempts = 0
        const maxAttempts = 5
        
        do {
          token = crypto.randomUUID()
          const existingToken = await repositories.verificationToken.findByToken(token)
          if (!existingToken) break
          attempts++
        } while (attempts < maxAttempts)
        
        if (attempts >= maxAttempts) {
          throw new Error('Failed to generate unique verification token')
        }
        
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        
        await repositories.verificationToken.create({
          identifier: user.email,
          token,
          expires
        })
        
        // Send welcome email with registration link
        const registerLink = `${process.env.NEXT_PUBLIC_APP_URL}/register?token=${token}`
        await emailService.sendWelcomeEmail(user.email, registerLink)
        
        break
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        await membershipService.handlePaymentSuccess(invoice)
        break
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        await membershipService.handlePaymentFailed(invoice)
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        await membershipService.handleCancellation(subscription)
        break
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        await membershipService.handleSubscriptionUpdate(subscription)
        break
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Stripe webhook error:', error)
    
    if (error.message.includes('signature')) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
