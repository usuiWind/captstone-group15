// lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = "onboarding@resend.dev"; // Replace with your domain email in production
const PORTAL_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const GROUPME_LINK = process.env.GROUPME_INVITE_LINK || "";

// ─── Generic low-level sender ──────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  const data = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  });
  return data;
}

// ─── Email Templates ───────────────────────────────────────────────────────

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
        Questions? Contact us at <a href="mailto:support@fitp.org">support@fitp.org</a><br/>
        FITP Membership Portal — ${portalUrl}
      </p>
    </div>
  `;
}

// ─── Public emailService object (used throughout the codebase) ─────────────

export const emailService = {

  // Called by: webhook checkout.session.completed
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

  // Called by: membershipService.handlePaymentSuccess → invoice.payment_succeeded
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

  // Called by: membershipService.handlePaymentFailed → invoice.payment_failed
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

  // Called by: membershipService.handleCancellation → customer.subscription.deleted
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

  // Called by: membershipService.handleSubscriptionUpdate
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
};