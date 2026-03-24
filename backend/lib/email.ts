// Email service using Resend (https://resend.com)
// Requires RESEND_API_KEY and FROM_EMAIL env vars.
// Falls back to console logging if RESEND_API_KEY is not set (dev/test).

import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.FROM_EMAIL ?? 'noreply@example.com'

const resend = apiKey ? new Resend(apiKey) : null

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    console.log(`[EMAIL STUB] To: ${to} | Subject: ${subject}`)
    return
  }
  const { error } = await resend.emails.send({ from: fromEmail, to, subject, html })
  if (error) {
    console.error(`[EMAIL] Failed to send "${subject}" to ${to}:`, error)
  }
}

export const emailService = {
  sendWelcomeEmail: async (email: string, registerLink: string): Promise<void> => {
    await sendEmail(
      email,
      'Welcome — complete your registration',
      `<p>Thanks for joining! Click the link below to set your password and activate your account.</p>
       <p><a href="${registerLink}">${registerLink}</a></p>
       <p>This link expires in 24 hours.</p>`
    )
  },

  sendPaymentFailedEmail: async (email: string): Promise<void> => {
    await sendEmail(
      email,
      'Action required: payment failed',
      `<p>We were unable to process your membership payment. Please update your payment method to keep your membership active.</p>`
    )
  },

  sendCancellationEmail: async (email: string): Promise<void> => {
    await sendEmail(
      email,
      'Your membership has been cancelled',
      `<p>Your membership has been cancelled. We're sorry to see you go. You can rejoin at any time.</p>`
    )
  },

  sendSubscriptionUpdatedEmail: async (email: string, planName: string): Promise<void> => {
    await sendEmail(
      email,
      'Your membership plan has been updated',
      `<p>Your membership has been updated to the <strong>${planName}</strong> plan.</p>`
    )
  },

  sendPaymentSuccessEmail: async (email: string, amount: number): Promise<void> => {
    await sendEmail(
      email,
      'Payment received — thank you!',
      `<p>We received your payment of <strong>$${amount.toFixed(2)}</strong>. Your membership is active.</p>`
    )
  }
}
