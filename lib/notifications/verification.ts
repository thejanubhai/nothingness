import { Resend } from 'resend';
import { env } from '@/lib/env';
import { getBookingReceiptEmailHtml } from '@/lib/email-templates';

interface SendApprovedNotificationParams {
  email: string;
  guestName: string;
  spaceTitle?: string;
  checkInDate?: string;
  checkOutDate?: string;
  phone?: string;
}

interface SendRejectedNotificationParams {
  email: string;
  guestName: string;
  reason?: string;
  retryUrl?: string;
  phone?: string;
}

export async function sendVerificationApprovedNotification({
  email,
  guestName,
  spaceTitle,
  checkInDate,
  checkOutDate,
  phone,
}: SendApprovedNotificationParams) {
  console.log(`[Verification Notification] Sending APPROVAL to ${email}${phone ? ` / ${phone}` : ''}`);

  if (!env.RESEND_API_KEY) {
    console.warn('[Verification Notification] RESEND_API_KEY missing. Mocked approval notification sent to:', email);
    return { success: true, mocked: true };
  }

  try {
    const resend = new Resend(env.RESEND_API_KEY);
    const siteUrl = env.NEXT_PUBLIC_SITE_URL && !env.NEXT_PUBLIC_SITE_URL.includes('localhost') ? env.NEXT_PUBLIC_SITE_URL : 'https://nothingness.asia';

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0c0c0e; color: #f3f3f3; padding: 40px 24px; border-radius: 16px; border: 1px solid #1a1a22;">
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #22222e;">
          <h1 style="font-family: Georgia, serif; font-size: 24px; letter-spacing: 2px; color: #e2b866; margin: 0 0 8px 0; text-transform: uppercase;">Nothingness</h1>
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #888899; margin: 0;">Identity Verification Confirmed</p>
        </div>

        <div style="padding: 32px 0;">
          <div style="background-color: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); color: #4ade80; padding: 12px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; text-align: center; margin-bottom: 24px;">
            ✓ Identity Verified Successfully
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #d0d0dc; margin-bottom: 16px;">
            Dear <strong>${guestName}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #a0a0b0; margin-bottom: 24px;">
            Thank you for completing your guest identity verification. Your credentials have been authenticated, and your stay records are fully verified.
          </p>

          ${
            spaceTitle
              ? `
          <div style="background-color: #121218; border: 1px solid #22222e; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #e2b866; margin: 0 0 12px 0;">Reservation Details</p>
            <p style="font-size: 15px; color: #ffffff; margin: 4px 0;"><strong>Sanctuary:</strong> ${spaceTitle}</p>
            ${checkInDate ? `<p style="font-size: 13px; color: #888899; margin: 4px 0;"><strong>Check-In:</strong> ${checkInDate}</p>` : ''}
            ${checkOutDate ? `<p style="font-size: 13px; color: #888899; margin: 4px 0;"><strong>Check-Out:</strong> ${checkOutDate}</p>` : ''}
          </div>
          `
              : ''
          }

          <div style="text-align: center; margin-top: 32px;">
            <a href="${siteUrl}/dashboard" style="display: inline-block; background-color: #e2b866; color: #000000; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
              View Your Guest Dashboard
            </a>
          </div>
        </div>

        <div style="text-align: center; padding-top: 24px; border-top: 1px solid #22222e; color: #666677; font-size: 12px;">
          <p style="margin: 0 0 6px 0;">Need assistance? Contact our concierge at <a href="mailto:concierge@nothingness.asia" style="color: #e2b866; text-decoration: none;">concierge@nothingness.asia</a></p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Nothingness. All rights reserved.</p>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Nothingness Concierge <concierge@nothingness.asia>',
      to: email,
      subject: 'Identity Verification Approved - Nothingness',
      html: htmlContent,
    });

    if (error) {
      console.error('[Verification Notification] Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown exception';
    console.error('[Verification Notification] Exception:', err);
    return { success: false, error: msg };
  }
}

export async function sendVerificationRejectedNotification({
  email,
  guestName,
  reason,
  retryUrl,
  phone,
}: SendRejectedNotificationParams) {
  console.log(`[Verification Notification] Sending REJECTION to ${email}${phone ? ` / ${phone}` : ''}`);

  if (!env.RESEND_API_KEY) {
    console.warn('[Verification Notification] RESEND_API_KEY missing. Mocked rejection notification sent to:', email);
    return { success: true, mocked: true };
  }

  try {
    const resend = new Resend(env.RESEND_API_KEY);
    const siteUrl = env.NEXT_PUBLIC_SITE_URL && !env.NEXT_PUBLIC_SITE_URL.includes('localhost') ? env.NEXT_PUBLIC_SITE_URL : 'https://nothingness.asia';
    const link = retryUrl || `${siteUrl}/verify-guest`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0c0c0e; color: #f3f3f3; padding: 40px 24px; border-radius: 16px; border: 1px solid #1a1a22;">
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #22222e;">
          <h1 style="font-family: Georgia, serif; font-size: 24px; letter-spacing: 2px; color: #e2b866; margin: 0 0 8px 0; text-transform: uppercase;">Nothingness</h1>
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #888899; margin: 0;">Identity Verification Update</p>
        </div>

        <div style="padding: 32px 0;">
          <div style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; padding: 12px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; text-align: center; margin-bottom: 24px;">
            ⚠️ Document Verification Action Required
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #d0d0dc; margin-bottom: 16px;">
            Dear <strong>${guestName}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #a0a0b0; margin-bottom: 20px;">
            We were unable to complete identity verification for your document submission.
          </p>

          ${
            reason
              ? `
          <div style="background-color: #161214; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #f87171; margin: 0 0 6px 0;">Reason for Rejection</p>
            <p style="font-size: 14px; color: #f3f3f3; margin: 0;">${reason}</p>
          </div>
          `
              : ''
          }

          <p style="font-size: 13px; line-height: 1.6; color: #888899; margin-bottom: 24px;">
            Please ensure you upload a clear, legible photograph of an official <strong>Aadhaar Card</strong> or <strong>Passport</strong> belonging to a guest who is 18 years of age or older.
          </p>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${link}" style="display: inline-block; background-color: #e2b866; color: #000000; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
              Re-Upload ID Document
            </a>
          </div>
        </div>

        <div style="text-align: center; padding-top: 24px; border-top: 1px solid #22222e; color: #666677; font-size: 12px;">
          <p style="margin: 0 0 6px 0;">Need assistance? Contact our concierge at <a href="mailto:concierge@nothingness.asia" style="color: #e2b866; text-decoration: none;">concierge@nothingness.asia</a></p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Nothingness. All rights reserved.</p>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Nothingness Concierge <concierge@nothingness.asia>',
      to: email,
      subject: 'Action Required: Identity Verification Update - Nothingness',
      html: htmlContent,
    });

    if (error) {
      console.error('[Verification Notification] Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown exception';
    console.error('[Verification Notification] Exception:', err);
    return { success: false, error: msg };
  }
}

export async function sendAdditionalGuestInviteNotification({
  phone,
  email,
  guestName,
  spaceTitle,
  primaryGuestName,
  checkInDate,
  checkOutDate,
  verificationToken,
  isSelfPay,
  paymentAmount,
}: {
  phone?: string;
  email?: string;
  guestName: string;
  spaceTitle: string;
  primaryGuestName: string;
  checkInDate: string;
  checkOutDate: string;
  verificationToken: string;
  isSelfPay: boolean;
  paymentAmount?: number;
}) {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia';
  const verificationLink = `${siteUrl}/verify-guest/${verificationToken}`;

  console.log(`[Guest Invite] Dispatching invitation to ${guestName} (${phone || email}) - Link: ${verificationLink}`);

  if (email && env.RESEND_API_KEY) {
    try {
      const resend = new Resend(env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Nothingness Concierge <concierge@nothingness.asia>',
        to: email,
        subject: `Guest Invitation & Verification - ${spaceTitle}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0c0c0e; color: #f3f3f3; padding: 40px 24px; border-radius: 16px; border: 1px solid #1a1a22;">
            <h1 style="font-family: Georgia, serif; font-size: 22px; color: #e2b866; text-align: center; text-transform: uppercase;">Nothingness</h1>
            <p style="text-align: center; color: #888899; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Guest Stay Invitation</p>
            <div style="padding: 24px 0;">
              <p>Dear <strong>${guestName}</strong>,</p>
              <p style="color: #a0a0b0; font-size: 14px; line-height: 1.6;">
                <strong>${primaryGuestName}</strong> has registered you as a guest for a private sanctuary stay at <strong>${spaceTitle}</strong> (${checkInDate} to ${checkOutDate}).
              </p>
              ${
                isSelfPay && paymentAmount
                  ? `<p style="color: #e2b866; font-size: 14px; background: rgba(226,184,102,0.1); padding: 12px; border-radius: 8px; border: 1px solid rgba(226,184,102,0.2);">
                      <strong>Stay Tariff Contribution:</strong> ₹${paymentAmount} (to be paid upon verification)
                    </p>`
                  : `<p style="color: #4ade80; font-size: 14px;">Your stay tariff has been completely settled by ${primaryGuestName}.</p>`
              }
              <div style="text-align: center; margin: 32px 0;">
                <a href="${verificationLink}" style="display: inline-block; background-color: #e2b866; color: #000000; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; text-transform: uppercase;">
                  ${isSelfPay ? 'Pay Tariff & Upload ID' : 'Upload ID Document'}
                </a>
              </div>
            </div>
          </div>
        `
      });
    } catch (e) {
      console.error('[Guest Invite] Email send error:', e);
    }
  }

  return {
    success: true,
    verificationLink,
  };
}

export interface SendPrimaryBookingConfirmationParams {
  email: string;
  guestName: string;
  bookingId: string;
  spaceTitle: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number | string;
  paymentMethod?: string;
}

export async function sendPrimaryBookingConfirmationNotification({
  email,
  guestName,
  bookingId,
  spaceTitle,
  checkInDate,
  checkOutDate,
  totalAmount,
  paymentMethod = 'PayU India (UPI / Cards / Net Banking)',
}: SendPrimaryBookingConfirmationParams) {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia';
  const receiptUrl = `${siteUrl}/booking/${bookingId}/invoice`;
  const formattedAmount =
    typeof totalAmount === 'number'
      ? `₹${totalAmount.toLocaleString('en-IN')}`
      : String(totalAmount).startsWith('₹')
      ? totalAmount
      : `₹${Number(totalAmount || 0).toLocaleString('en-IN')}`;

  console.log(`[Booking Confirmation] Dispatching confirmation & receipt to ${email} for booking ${bookingId}`);

  if (!env.RESEND_API_KEY) {
    console.warn('[Booking Confirmation] RESEND_API_KEY missing. Mocked receipt email sent to:', email);
    return { success: true, mocked: true, receiptUrl };
  }

  try {
    const resend = new Resend(env.RESEND_API_KEY);
    const htmlContent = getBookingReceiptEmailHtml({
      memberName: guestName || 'Sanctuary Guest',
      bookingId,
      sanctuaryName: spaceTitle || 'Private Sanctuary',
      dateRange: `${checkInDate} to ${checkOutDate}`,
      totalAmount: formattedAmount,
      paymentMethod,
      receiptUrl,
    });

    const { data, error } = await resend.emails.send({
      from: 'Nothingness Concierge <concierge@nothingness.asia>',
      to: email,
      subject: `Booking Confirmed & Tax Invoice: ${spaceTitle} - Nothingness`,
      html: htmlContent,
    });

    if (error) {
      console.error('[Booking Confirmation] Resend error:', error);
      return { success: false, error: error.message, receiptUrl };
    }

    return { success: true, data, receiptUrl };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown exception';
    console.error('[Booking Confirmation] Exception:', err);
    return { success: false, error: msg, receiptUrl };
  }
}
