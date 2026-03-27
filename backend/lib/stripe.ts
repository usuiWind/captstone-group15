import Stripe from 'stripe'

// Lazy-initialized so the build doesn't fail when STRIPE_SECRET_KEY is not yet set.
let _stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    })
  }
  return _stripe
}

export { getStripe as stripe }

export const stripePrices = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY!,
  annual: process.env.STRIPE_PRICE_ID_ANNUAL!,
}

export const createCheckoutSession = async (customerId: string, priceId: string, successUrl: string, cancelUrl: string) => {
  return await getStripe().checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    customer_update: {
      address: 'auto',
      name: 'auto',
    },
  })
}

export const createCustomer = async (email: string, name?: string) => {
  return await getStripe().customers.create({
    email,
    name,
    metadata: {
      source: 'club_membership',
    },
  })
}

export const cancelSubscriptionAtPeriodEnd = async (subscriptionId: string) => {
  return await getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

export const reactivateSubscription = async (subscriptionId: string) => {
  return await getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

export const constructWebhookEvent = (payload: string | Buffer, signature: string) => {
  return getStripe().webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}
