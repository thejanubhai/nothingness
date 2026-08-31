import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    // 1. Verify Webhook Secret
    const authHeader = req.headers.get('Authorization');
    const secret = process.env.SUPABASE_AUTH_WEBHOOK_SECRET || 'secret-auth-hook-token-123';
    
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Event Payload from Supabase
    const event = await req.json();
    
    const emailType = event?.email_data?.email_action_type;
    const tokenHash = event?.email_data?.token_hash;
    const redirectTo = event?.email_data?.redirect_to;
    const siteUrl = event?.email_data?.site_url;
    const userEmail = event?.user?.email;

    if (!userEmail || !emailType || !tokenHash || !siteUrl) {
      return NextResponse.json({ error: 'Missing required email data' }, { status: 400 });
    }

    // 3. Construct Magic Link & HTML Template
    // 3. Construct Luxury Branded HTML Template
    const magicLink = `${siteUrl}/auth/callback?token_hash=${tokenHash}&type=${emailType}&next=${redirectTo || '/dashboard'}`;
    let subjectText = 'Confidential Access Link • Nothingness';
    let headline = 'Guest Access Portal';
    let subtitle = 'Secure Authentication Token';
    let badgeText = 'Discreet Access';
    let messageText = 'Click the secure link below to proceed with your Nothingness authentication.';
    let ctaLabel = 'Access Portal';

    if (emailType === 'signup') {
      subjectText = 'Welcome to Nothingness • Confirm Your Account';
      headline = 'Welcome to Nothingness';
      subtitle = 'Member Verification Required';
      badgeText = 'Account Activation';
      messageText = 'Thank you for stepping into Nothingness. Please confirm your email address to activate your guest portal and enable keyless access credentials.';
      ctaLabel = 'Confirm & Enter Portal';
    } else if (emailType === 'magiclink') {
      subjectText = 'Your Keyless Portal Access Link • Nothingness';
      headline = 'Guest Portal Access';
      subtitle = 'One-Time Secret Access Token';
      badgeText = 'Instant Sign-In';
      messageText = 'Click the button below to securely access your Nothingness sanctuary dashboard, bookings, and verified access credentials.';
      ctaLabel = 'Sign In to Portal';
    } else if (emailType === 'email_change') {
      subjectText = 'Verify Your New Email Address • Nothingness';
      headline = 'Communication Update';
      subtitle = 'Email Verification Request';
      badgeText = 'Security Confirmation';
      messageText = 'We received a request to update the primary communication email for your Nothingness profile. Click below to verify and link this new address.';
      ctaLabel = 'Verify New Email';
    } else if (emailType === 'recovery') {
      subjectText = 'Reset Your Account Password • Nothingness';
      headline = 'Password Reset';
      subtitle = 'Security Verification';
      badgeText = 'Account Recovery';
      messageText = 'A password reset request was initiated for your Nothingness account. Click the button below to choose a new secure password.';
      ctaLabel = 'Reset Password';
    }

    const luxuryHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subjectText}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050507; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E5E5E5;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #050507; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #0C0C0E; border: 1px solid #26262E; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
          
          <!-- Gold Gradient Ambient Top Stripe -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #D4AF37 0%, #F3E5AB 50%, #AA771C 100%);"></td>
          </tr>

          <!-- Header / Brand -->
          <tr>
            <td align="center" style="padding: 40px 30px 20px 30px; border-bottom: 1px solid #1A1A22;">
              <h1 style="margin: 0; font-family: Georgia, 'Playfair Display', serif; font-size: 28px; letter-spacing: 4px; color: #D4AF37; text-transform: uppercase; font-weight: normal;">
                Nothingness.
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 10px; font-family: 'Courier New', monospace; letter-spacing: 3px; color: #888899; text-transform: uppercase;">
                Luxury Alternate Lifestyle &bull; Private Sanctuaries
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 35px 35px 25px 35px;">
              <!-- Badge -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 25px;">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; background-color: rgba(212, 175, 55, 0.08); border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 20px; padding: 6px 18px; color: #D4AF37; font-size: 10px; font-family: 'Courier New', monospace; letter-spacing: 2px; text-transform: uppercase;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>

              <h2 style="font-family: Georgia, 'Playfair Display', serif; font-size: 22px; color: #FFFFFF; text-align: center; margin: 0 0 10px 0; font-weight: normal;">
                ${headline}
              </h2>
              
              <p style="font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 1px; color: #777788; text-align: center; margin: 0 0 24px 0; text-transform: uppercase;">
                ${subtitle}
              </p>

              <p style="font-size: 14px; line-height: 1.7; color: #AAAAAA; text-align: center; margin: 0 0 30px 0;">
                ${messageText}
              </p>

              <!-- CTA Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #AA771C 100%); color: #000000; font-family: -apple-system, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 16px 36px; border-radius: 12px; box-shadow: 0 6px 20px rgba(212,175,55,0.3);">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 11px; line-height: 1.5; color: #666677; text-align: center; margin: 0; font-family: 'Courier New', monospace;">
                This link will expire in 15 minutes. If you did not make this request, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 35px; background-color: #08080A; border-top: 1px solid #1A1A22; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #555566; font-family: -apple-system, sans-serif;">
                24/7 Confidential Concierge: <a href="mailto:concierge@nothingness.asia" style="color: #D4AF37; text-decoration: none;">concierge@nothingness.asia</a>
              </p>
              <p style="margin: 0; font-size: 10px; color: #444455; font-family: 'Courier New', monospace; letter-spacing: 1px;">
                &copy; ${new Date().getFullYear()} Nothingness. India's Premier Sanctuary Network. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // 4. Send via Resend
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Nothingness Concierge <concierge@nothingness.asia>',
        to: userEmail,
        subject: subjectText,
        html: luxuryHtml,
      });
    } else {
      console.warn('RESEND_API_KEY is not set. Email was not sent.');
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error sending custom auth email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
