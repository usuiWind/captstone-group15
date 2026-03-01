export const emailService = {
  sendWelcomeEmail: async (email: string, registerLink: string) => {
    console.log(`[EMAIL STUB] Welcome email to ${email}: ${registerLink}`)
  },

  sendPaymentFailedEmail: async (email: string) => {
    console.log(`[EMAIL STUB] Payment failed email to ${email}`)
  },

  sendCancellationEmail: async (email: string) => {
    console.log(`[EMAIL STUB] Cancellation email to ${email}`)
  },

  sendSubscriptionUpdatedEmail: async (email: string, planName: string) => {
    console.log(`[EMAIL STUB] Subscription updated email to ${email} - Plan: ${planName}`)
  },

  sendPaymentSuccessEmail: async (email: string, amount: number) => {
    console.log(`[EMAIL STUB] Payment success email to ${email} - Amount: $${amount}`)
  }
}
