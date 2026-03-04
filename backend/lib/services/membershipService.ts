import { Membership, CreateMembershipInput } from '../interfaces/models'
import { repositories } from '../container'
import { emailService } from '../email'

export class MembershipService {
  async getByUserId(userId: string): Promise<Membership | null> {
    return await repositories.membership.findByUserId(userId)
  }

  async createFromStripeSession(session: any): Promise<Membership> {
    const userId = session.metadata?.userId
    const customerId = session.customer as string
    const subscriptionId = session.subscription as string

    if (!userId || !customerId || !subscriptionId) {
      throw new Error('Missing required session data')
    }

    // Get subscription details from Stripe
    const { stripe } = await import('../stripe')
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    const planName = subscription.items.data[0]?.price?.nickname || 'Unknown Plan'
    const currentPeriodStart = new Date(subscription.current_period_start * 1000)
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

    const createMembershipInput: CreateMembershipInput = {
      userId,
      status: 'PENDING',
      planName,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    }

    return await repositories.membership.create(createMembershipInput)
  }

  async handlePaymentSuccess(invoice: any): Promise<Membership> {
    const subscriptionId = invoice.subscription as string
    const membership = await repositories.membership.findByStripeSubscriptionId(subscriptionId)

    if (!membership) {
      throw new Error('Membership not found for subscription')
    }

    // Update membership status to ACTIVE
    const updatedMembership = await repositories.membership.update(membership.id, {
      status: 'ACTIVE',
      currentPeriodStart: new Date(invoice.period_start * 1000),
      currentPeriodEnd: new Date(invoice.period_end * 1000)
    })

    // Send payment success email
    const user = await repositories.user.findById(membership.userId)
    if (user) {
      await emailService.sendPaymentSuccessEmail(user.email, invoice.amount_paid / 100)
    }

    return updatedMembership
  }

  async handlePaymentFailed(invoice: any): Promise<Membership> {
    const subscriptionId = invoice.subscription as string
    const membership = await repositories.membership.findByStripeSubscriptionId(subscriptionId)

    if (!membership) {
      throw new Error('Membership not found for subscription')
    }

    // Update membership status to PAST_DUE
    const updatedMembership = await repositories.membership.update(membership.id, {
      status: 'PAST_DUE'
    })

    // Send payment failed email
    const user = await repositories.user.findById(membership.userId)
    if (user) {
      await emailService.sendPaymentFailedEmail(user.email)
    }

    return updatedMembership
  }

  async handleCancellation(subscription: any): Promise<Membership> {
    const membership = await repositories.membership.findByStripeSubscriptionId(subscription.id)

    if (!membership) {
      throw new Error('Membership not found for subscription')
    }

    // Update membership status to CANCELLED
    const updatedMembership = await repositories.membership.update(membership.id, {
      status: 'CANCELLED'
    })

    // Send cancellation email
    const user = await repositories.user.findById(membership.userId)
    if (user) {
      await emailService.sendCancellationEmail(user.email)
    }

    return updatedMembership
  }

  async handleSubscriptionUpdate(subscription: any): Promise<Membership> {
    const membership = await repositories.membership.findByStripeSubscriptionId(subscription.id)

    if (!membership) {
      throw new Error('Membership not found for subscription')
    }

    const planName = subscription.items.data[0]?.price?.nickname || 'Unknown Plan'
    const currentPeriodStart = new Date(subscription.current_period_start * 1000)
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

    // Update membership details
    const updatedMembership = await repositories.membership.update(membership.id, {
      planName,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      status: subscription.status === 'active' ? 'ACTIVE' : membership.status
    })

    // Send updated email if plan changed
    if (membership.planName !== planName) {
      const user = await repositories.user.findById(membership.userId)
      if (user) {
        await emailService.sendSubscriptionUpdatedEmail(user.email, planName)
      }
    }

    return updatedMembership
  }

  async markCancelAtPeriodEnd(userId: string): Promise<Membership> {
    const membership = await repositories.membership.findByUserId(userId)
    
    if (!membership) {
      throw new Error('Membership not found')
    }

    return await repositories.membership.update(membership.id, {
      cancelAtPeriodEnd: true
    })
  }

  async getAllMemberships(status?: string): Promise<Membership[]> {
    // This would need to be implemented in the repository
    // For now, return empty array
    return []
  }
}
