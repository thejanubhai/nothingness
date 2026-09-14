/**
 * Nothingness Luxury Email Template Suite
 * 
 * Aesthetic: Pure Black (#000000) background, high-contrast crisp white typography,
 * subtle hairline obsidian borders, and the authentic Nothingness Devanagari crest logo.
 * 
 * Includes pre-built templates for:
 * 1. Member Initiation / Welcome
 * 2. Gathering Pass & RSVP Confirmation
 * 3. Dual-Blind Desire Resonance Alert
 * 4. Level 2 Vetting & Identity Accreditation
 * 5. Security OTP Code & Magic Link
 * 6. Sanctuary Booking & Payment Receipt
 */

export const RESEND_TEMPLATE_ALIASES = {
  WELCOME_INITIATION: 'welcome-initiation',
  GATHERING_PASS: 'gathering-pass',
  RESONANCE_MATCH: 'resonance-match',
  VETTING_APPROVED: 'vetting-approved',
  AUTH_OTP: 'auth-otp-magic-link',
  BOOKING_RECEIPT: 'booking-receipt',
} as const;

export const NOTHINGNESS_LOGO_URL = 'https://nothingness.asia/images/logo.png';

interface BaseLayoutOptions {
  badgeText: string;
  headline: string;
  subheadline?: string;
  contentHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  footerMonospaceNote?: string;
}

/**
 * Universal Master Layout: Pure Black (#000000) & White (#ffffff) Minimalist Luxury
 */
export function renderBaseEmailLayout({
  badgeText,
  headline,
  subheadline,
  contentHtml,
  ctaText,
  ctaUrl,
  footerMonospaceNote = 'Strictly Confidential • Intended For Verified Recipient Only',
}: BaseLayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${headline}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#000000" style="background-color: #000000; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #09090b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9);">
          
          <!-- Brand Header with Actual Nothingness Logo -->
          <tr>
            <td align="center" style="padding: 40px 32px 24px 32px; border-bottom: 1px solid #18181b;">
              <img src="${NOTHINGNESS_LOGO_URL}" alt="Nothingness" width="120" style="display: block; border: 0; margin: 0 auto; max-width: 120px; height: auto;" />
              <p style="margin: 12px 0 0 0; font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 4px; color: #71717a; text-transform: uppercase;">
                Private Sanctuaries &bull; Discreet Gatherings
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px;">
              <!-- Category Badge -->
              <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background-color: #18181b; border: 1px solid #27272a; border-radius: 9999px; padding: 4px 14px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 2px; color: #a1a1aa; text-transform: uppercase;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Main Headline -->
              <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 600; color: #ffffff; letter-spacing: -0.5px; line-height: 1.3;">
                ${headline}
              </h1>

              ${subheadline ? `
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.7; color: #d4d4d8;">
                ${subheadline}
              </p>` : ''}

              <!-- Injected Dynamic Content -->
              ${contentHtml}

              <!-- Primary Call To Action (Optional) -->
              ${ctaText && ctaUrl ? `
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" style="background-color: #ffffff; color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 14px 36px; border-radius: 8px; display: inline-block;">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>` : ''}

              <!-- Footer Security / Guidance Note -->
              <p style="margin: 24px 0 0 0; font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.6; color: #52525b; text-align: center;">
                ${footerMonospaceNote}
              </p>
            </td>
          </tr>

          <!-- Permanent Footer -->
          <tr>
            <td align="center" style="padding: 24px 32px; background-color: #050507; border-top: 1px solid #18181b;">
              <p style="margin: 0 0 6px 0; font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 2px; color: #52525b; text-transform: uppercase;">
                Total Confidentiality &bull; Zero Blind Data Retention
              </p>
              <p style="margin: 0; font-size: 11px; color: #3f3f46;">
                &copy; ${new Date().getFullYear()} Nothingness Asia. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ==========================================================================
   1. Welcome & Member Initiation Template
   ========================================================================== */

export interface WelcomeEmailData {
  memberName: string;
  membershipTier?: string;
  memberMoniker?: string;
  dashboardUrl?: string;
}

export function getWelcomeEmailHtml({
  memberName,
  membershipTier = 'Obsidian Sovereign',
  memberMoniker = 'Anonymous',
  dashboardUrl = 'https://nothingness.asia/dashboard',
}: WelcomeEmailData): string {
  const content = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121215; border: 1px solid #27272a; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding-bottom: 12px; border-bottom: 1px solid #1f1f23;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 2px; color: #71717a; text-transform: uppercase; display: block; margin-bottom: 4px;">Membership Tier</span>
                <span style="font-size: 14px; font-weight: 500; color: #ffffff;">${membershipTier}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #1f1f23;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 2px; color: #71717a; text-transform: uppercase; display: block; margin-bottom: 4px;">Member Moniker</span>
                <span style="font-size: 14px; font-weight: 500; color: #ffffff;">${memberMoniker}</span>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 12px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 2px; color: #71717a; text-transform: uppercase; display: block; margin-bottom: 4px;">Pillars of Nothingness</span>
                <span style="font-size: 13px; color: #a1a1aa; line-height: 1.5;">Total Confidentiality &bull; Dual-Blind Intention &bull; Zero Blind Data Retention</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return renderBaseEmailLayout({
    badgeText: 'Member Initiation',
    headline: `Welcome to Nothingness, ${memberName}.`,
    subheadline: 'Your initiation into our private collective has been accepted. Nothingness operates on strict discretion, sovereign boundaries, and mutual reverence.',
    contentHtml: content,
    ctaText: 'Enter Sanctuary Dashboard',
    ctaUrl: dashboardUrl,
  });
}

/* ==========================================================================
   2. Gathering Pass & RSVP Confirmation Template
   ========================================================================== */

export interface GatheringPassData {
  memberName: string;
  eventTitle: string;
  eventDate: string;
  sanctuaryLocation: string;
  entryPasscode: string;
  passUrl?: string;
}

export function getGatheringPassEmailHtml({
  memberName,
  eventTitle,
  eventDate,
  sanctuaryLocation,
  entryPasscode,
  passUrl = 'https://nothingness.asia/profile/pass',
}: GatheringPassData): string {
  const content = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121215; border: 1px solid #27272a; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding-bottom: 12px; border-bottom: 1px solid #1f1f23;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 2px; color: #71717a; text-transform: uppercase; display: block; margin-bottom: 4px;">Schedule</span>
                <span style="font-size: 14px; font-weight: 500; color: #ffffff;">${eventDate}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #1f1f23;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 2px; color: #71717a; text-transform: uppercase; display: block; margin-bottom: 4px;">Sanctuary Location</span>
                <span style="font-size: 14px; font-weight: 500; color: #ffffff;">${sanctuaryLocation}</span>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 12px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 2px; color: #71717a; text-transform: uppercase; display: block; margin-bottom: 4px;">Entry Passcode</span>
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 4px;">${entryPasscode}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #18181b; border-left: 3px solid #ffffff; padding: 14px 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
      <tr>
        <td>
          <p style="margin: 0; font-size: 12px; color: #d4d4d8; line-height: 1.5;">
            <strong style="color: #ffffff;">Marshall Check-in Protocol:</strong> Present your cryptographic QR pass to the Sanctuary Marshall upon threshold arrival.
          </p>
        </td>
      </tr>
    </table>
  `;

  return renderBaseEmailLayout({
    badgeText: 'Sanctuary Access Pass',
    headline: `Gathering Confirmed: ${eventTitle}`,
    subheadline: `Greetings ${memberName}, your reservation has been confirmed. Below are your admittance credentials.`,
    contentHtml: content,
    ctaText: 'View Digital QR Pass',
    ctaUrl: passUrl,
  });
}

/* ==========================================================================
   3. Dual-Blind Desire Resonance Alert Template
   ========================================================================== */

export interface ResonanceMatchData {
  memberName: string;
  resonanceAlias: string;
  expirationHours?: string | number;
  chamberUrl?: string;
}

export function getResonanceMatchEmailHtml({
  memberName,
  resonanceAlias,
  expirationHours = 48,
  chamberUrl = 'https://nothingness.asia/kinkster-mode/chamber',
}: ResonanceMatchData): string {
  const content = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121215; border: 1px solid #27272a; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding-bottom: 12px; border-bottom: 1px solid #1f1f23;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 2px; color: #71717a; text-transform: uppercase; display: block; margin-bottom: 4px;">Ephemeral Chamber Status</span>
                <span style="font-size: 14px; font-weight: 600; color: #ffffff;">Active (Mutual 48-Hour Lock)</span>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 12px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 2px; color: #71717a; text-transform: uppercase; display: block; margin-bottom: 4px;">Auto-Purge Window</span>
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #a1a1aa;">${expirationHours} Hours Remaining &bull; Burn-on-Read Enabled</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #a1a1aa;">
      All whispers, voice notes, and media exchanged inside this chamber are subject to our zero-retention guarantee and will permanently shred upon chamber expiration.
    </p>
  `;

  return renderBaseEmailLayout({
    badgeText: '• Dual-Blind Mutual Resonance •',
    headline: 'Mutual Intent Confirmed.',
    subheadline: `Greetings ${memberName}, an intention was mutually reciprocated with member <strong style="color: #ffffff;">${resonanceAlias}</strong> under our dual-blind resonance engine.`,
    contentHtml: content,
    ctaText: 'Enter Ephemeral Chamber',
    ctaUrl: chamberUrl,
    footerMonospaceNote: 'Zero-Retention Security • Complete Privacy Camouflage Guaranteed',
  });
}

/* ==========================================================================
   4. Level 2 Vetting & Identity Accreditation Template
   ========================================================================== */

export interface VettingApprovedData {
  memberName: string;
  vettingLevel?: string;
  marshallBadge?: string;
  dashboardUrl?: string;
}

export function getVettingApprovedEmailHtml({
  memberName,
  vettingLevel = 'Level 2 In-Person Verified',
  marshallBadge = 'AUDIT-MARSHALL-OK',
  dashboardUrl = 'https://nothingness.asia/gatherings',
}: VettingApprovedData): string {
  const content = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121215; border: 1px solid #27272a; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding-bottom: 12px; border-bottom: 1px solid #1f1f23;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 2px; color: #71717a; text-transform: uppercase; display: block; margin-bottom: 4px;">Accreditation Status</span>
                <span style="font-size: 14px; font-weight: 600; color: #ffffff;">${vettingLevel}</span>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 12px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 2px; color: #71717a; text-transform: uppercase; display: block; margin-bottom: 4px;">Marshall Signature</span>
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #a1a1aa;">${marshallBadge}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return renderBaseEmailLayout({
    badgeText: '✓ Verification Complete',
    headline: 'Vetting Approved: Level 2 Cleared.',
    subheadline: `Greetings ${memberName}, your credentials and in-person verification have been audited and signed by the Sanctuary Marshall. You now hold unfettered access to all Level 2 private gatherings.`,
    contentHtml: content,
    ctaText: 'Explore Gatherings Hub',
    ctaUrl: dashboardUrl,
  });
}

/* ==========================================================================
   5. Security OTP Code & Magic Link Template
   ========================================================================== */

export interface AuthOtpData {
  authCode: string;
  magicLinkUrl?: string;
  expirationMinutes?: number | string;
  requestDevice?: string;
}

export function getAuthOtpEmailHtml({
  authCode,
  magicLinkUrl = 'https://nothingness.asia/auth/verify',
  expirationMinutes = 10,
  requestDevice = 'Secure Browser Session',
}: AuthOtpData): string {
  const content = `
    <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" style="max-width: 360px; background-color: #121215; border: 1px solid #3f3f46; border-radius: 12px; margin: 0 auto 24px auto;">
      <tr>
        <td align="center" style="padding: 24px 20px;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: 12px; display: inline-block;">
            ${authCode}
          </span>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 8px 0; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #a1a1aa; text-align: center;">
      Code expires in ${expirationMinutes} minutes &bull; Requested on ${requestDevice}
    </p>
  `;

  return renderBaseEmailLayout({
    badgeText: 'Security Verification',
    headline: 'Your Access Code',
    subheadline: 'Use the single-use verification code below to authenticate your session, or tap the secure button.',
    contentHtml: content,
    ctaText: '1-Click Instant Sign In',
    ctaUrl: magicLinkUrl,
    footerMonospaceNote: 'If you did not request this verification code, please disregard this alert.',
  });
}

/* ==========================================================================
   6. Sanctuary Booking & Payment Receipt Template
   ========================================================================== */

export interface BookingReceiptData {
  memberName: string;
  bookingId: string;
  sanctuaryName: string;
  dateRange: string;
  totalAmount: string;
  paymentMethod?: string;
  receiptUrl?: string;
}

export function getBookingReceiptEmailHtml({
  memberName,
  bookingId,
  sanctuaryName,
  dateRange,
  totalAmount,
  paymentMethod = 'PayU India (UPI / Cards / Net Banking)',
  receiptUrl = 'https://nothingness.asia/reservations/view',
}: BookingReceiptData): string {
  const content = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121215; border: 1px solid #27272a; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding-bottom: 12px; border-bottom: 1px solid #1f1f23;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 2px; color: #71717a; text-transform: uppercase; display: block; margin-bottom: 4px;">Sanctuary</span>
                <span style="font-size: 14px; font-weight: 500; color: #ffffff;">${sanctuaryName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #1f1f23;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 2px; color: #71717a; text-transform: uppercase; display: block; margin-bottom: 4px;">Duration & Dates</span>
                <span style="font-size: 14px; font-weight: 500; color: #ffffff;">${dateRange}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #1f1f23;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 2px; color: #71717a; text-transform: uppercase; display: block; margin-bottom: 4px;">Payment Method</span>
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #a1a1aa;">${paymentMethod}</span>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 14px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 2px; color: #71717a; text-transform: uppercase; display: block; margin-bottom: 4px;">Total Amount Paid</span>
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: 700; color: #ffffff;">${totalAmount}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return renderBaseEmailLayout({
    badgeText: 'Receipt • Paid',
    headline: 'Payment Receipt Confirmed',
    subheadline: `Greetings ${memberName}, your payment for reservation <strong style="color: #ffffff;">${bookingId}</strong> has processed successfully. Below is your itemized summary.`,
    contentHtml: content,
    ctaText: 'View Reservation Details',
    ctaUrl: receiptUrl,
    footerMonospaceNote: 'Cryptographic Invoice Stamped • Nothingness Finance Concierge',
  });
}
