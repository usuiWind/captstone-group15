// Email service using Resend (https://resend.com)
// Requires RESEND_API_KEY and FROM_EMAIL env vars.
// Falls back to console logging if RESEND_API_KEY is not set (dev/test).

import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'
const PORTAL_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
const GROUPME_LINK = process.env.GROUPME_INVITE_LINK || ""

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

function membershipConfirmationTemplate(
  planName: string,
  expirationDate: Date,
  portalUrl: string,
  groupmeLink: string
): string {
  const formattedDate = expirationDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb;">🎉 Welcome to FITP!</h1>
      <p>Your membership has been activated. Here are your details:</p>
      <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p><strong>Membership Plan:</strong> ${planName}</p>
        <p><strong>Membership Expires:</strong> ${formattedDate}</p>
      </div>
      <h2>Next Steps</h2>
      <p>
        <a href="${portalUrl}/dashboard"
           style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
          Access Your Portal
        </a>
      </p>
      <p>
        <a href="${groupmeLink}"
           style="background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
          Join Our GroupMe
        </a>
      </p>
      <hr style="margin: 30px 0;" />
      <p style="color: #6b7280; font-size: 14px;">
        Questions? Contact us at <a href="mailto:support@fitpuh.org">support@fitpuh.org</a><br/>
        FITP Membership Portal — ${portalUrl}
      </p>
    </div>
  `;
}

export const emailService = {

  async sendWelcomeEmail(to: string, registerLink: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Welcome to FITP!</h1>
        <p>Your payment was successful. Please complete your registration to access the portal.</p>
        <p>
          <a href="${registerLink}"
             style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
            Complete Registration
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">This link expires in 24 hours.</p>
      </div>
    `;
    await sendEmail(to, "Welcome to FITP — Complete Your Registration", html);
  },

  async sendPaymentSuccessEmail(
    to: string,
    amountPaid: number,
    planName?: string,
    expirationDate?: Date
  ): Promise<void> {
    const plan = planName || "FITP Membership";
    const expiry = expirationDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const html = membershipConfirmationTemplate(plan, expiry, PORTAL_URL, GROUPME_LINK);
    await sendEmail(to, "✅ Payment Confirmed — FITP Membership Active", html);
  },

  async sendPaymentFailedEmail(to: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc2626;">Payment Failed</h1>
        <p>We were unable to process your FITP membership payment.</p>
        <p>Please update your payment method to keep your membership active.</p>
        <p>
          <a href="${PORTAL_URL}/dashboard"
             style="background: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
            Update Payment Method
          </a>
        </p>
      </div>
    `;
    await sendEmail(to, "⚠️ Payment Failed — Action Required", html);
  },

  async sendCancellationEmail(to: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6b7280;">Membership Cancelled</h1>
        <p>Your FITP membership has been cancelled.</p>
        <p>You can reactivate at any time by visiting the portal.</p>
        <p>
          <a href="${PORTAL_URL}/pricing"
             style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
            Rejoin FITP
          </a>
        </p>
      </div>
    `;
    await sendEmail(to, "FITP Membership Cancelled", html);
  },

  async sendAdminOtpEmail(to: string, otp: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #03082e;">Admin Sign-In Code</h1>
        <p>Use the code below to complete your FITP admin sign-in. It expires in <strong>10 minutes</strong>.</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
          <span style="font-family: 'Courier New', monospace; font-size: 2.4rem; font-weight: 700; letter-spacing: 10px; color: #03082e;">
            ${otp}
          </span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          If you did not attempt to sign in, your account credentials may be compromised.
          Please contact <a href="mailto:support@fitpuh.org">support@fitpuh.org</a> immediately.
        </p>
        <hr style="margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          FITP Admin Portal — ${PORTAL_URL}
        </p>
      </div>
    `
    await sendEmail(to, 'FITP Admin Sign-In Code', html)
  },

  async sendSubscriptionUpdatedEmail(to: string, newPlanName: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Membership Plan Updated</h1>
        <p>Your FITP membership plan has been updated to: <strong>${newPlanName}</strong></p>
        <p>
          <a href="${PORTAL_URL}/dashboard"
             style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
            View Your Membership
          </a>
        </p>
      </div>
    `;
    await sendEmail(to, "Your FITP Plan Has Been Updated", html);
  },

  async sendOtpCode(to: string, code: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Your Login Verification Code</h1>
        <p>Use the code below to complete your sign-in:</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px;">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code expires in 5 minutes. Do not share it with anyone.</p>
      </div>
    `;
    await sendEmail(to, 'Your FITP verification code', html);
  },
}