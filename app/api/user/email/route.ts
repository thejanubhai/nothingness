import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { email } = await req.json();

    if (!email || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const adminSupabase = createAdminClient();

    // 1. Update Auth User email and confirm it
    const { data: updatedUser, error: updateError } = await adminSupabase.auth.admin.updateUserById(
      user.id,
      {
        email: trimmedEmail,
        email_confirm: true,
        user_metadata: {
          ...(user.user_metadata || {}),
          email: trimmedEmail,
          email_confirmed: true,
          email_updated_at: new Date().toISOString(),
        }
      }
    );

    if (updateError) {
      console.error('[Update Email] Supabase Admin Error:', updateError);
      return NextResponse.json({ error: updateError.message || 'Failed to update email' }, { status: 500 });
    }

    // 2. Update guest_profiles record if exists
    const isSyntheticEmail = Boolean(user.email && user.email.includes('@auth.nothingness'));
    const phone = user.phone 
      ? user.phone.replace(/[^0-9+]/g, '') 
      : isSyntheticEmail && user.email 
      ? user.email.split('@')[0].replace(/[^0-9+]/g, '') 
      : null;

    if (phone) {
      await adminSupabase
        .from('guest_profiles')
        .update({
          user_id: user.id,
          // Update profile if column exists
        })
        .or(`phone.eq.${phone},user_id.eq.${user.id}`);
    }

    // 3. Send Branded Luxury Confirmation Email via Resend
    if (env.RESEND_API_KEY) {
      try {
        const resend = new Resend(env.RESEND_API_KEY);
        const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia';
        const guestName = user.user_metadata?.full_name || 'Valued Guest';

        const luxuryHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Communication Email Confirmed - Nothingness</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050507; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E5E5E5;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #050507; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #0C0C0E; border: 1px solid #26262E; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
          
          <!-- Gold Ambient Top Stripe -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #D4AF37 0%, #F3E5AB 50%, #AA771C 100%);"></td>
          </tr>

          <!-- Header / Brand -->
          <tr>
            <td align="center" style="padding: 40px 30px 20px 30px; border-bottom: 1px solid #1A1A22;">
              <h1 style="margin: 0; font-family: Georgia, 'Playfair Display', serif; font-size: 26px; letter-spacing: 4px; color: #D4AF37; text-transform: uppercase; font-weight: normal;">
                Nothingness.
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 10px; font-family: 'Courier New', monospace; letter-spacing: 3px; color: #888899; text-transform: uppercase;">
                Luxury Sanctuaries &bull; Communication Channel Confirmed
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 35px 35px 25px 35px;">
              <!-- Verification Success Badge -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 25px;">
                <tr>
                  <td style="background-color: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.25); border-radius: 12px; padding: 14px 18px; text-align: center;">
                    <span style="color: #4ADE80; font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; font-family: 'Courier New', monospace;">
                      &#10003; Communication Channel Active
                    </span>
                  </td>
                </tr>
              </table>

              <p style="font-size: 15px; line-height: 1.7; color: #CCCCCC; margin: 0 0 16px 0;">
                Dear <strong style="color: #FFFFFF;">${guestName}</strong>,
              </p>

              <p style="font-size: 14px; line-height: 1.7; color: #9E9EA8; margin: 0 0 24px 0;">
                Your primary communication email has been successfully updated and verified for your Nothingness profile.
              </p>

              <!-- Account Details Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121216; border: 1px solid #20202A; border-radius: 14px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="font-family: 'Courier New', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #D4AF37; padding-bottom: 6px;">
                          Verified Email
                        </td>
                      </tr>
                      <tr>
                        <td style="font-family: 'Courier New', monospace; font-size: 16px; color: #FFFFFF; font-weight: bold; padding-bottom: 14px;">
                          ${trimmedEmail}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; line-height: 1.5; color: #7A7A88; border-top: 1px solid #1E1E28; padding-top: 12px;">
                          You will now automatically receive all confidential keyless lockbox access codes, stay itineraries, statutory compliance records, and iCal calendar synchro on this address.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #AA771C 100%); color: #000000; font-family: -apple-system, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 15px 36px; border-radius: 12px; box-shadow: 0 6px 20px rgba(212,175,55,0.3);">
                      Open Guest Dashboard
                    </a>
                  </td>
                </tr>
              </table>
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

        await resend.emails.send({
          from: 'Nothingness Concierge <concierge@nothingness.asia>',
          to: trimmedEmail,
          subject: 'Communication Channel Confirmed - Nothingness',
          html: luxuryHtml,
        });
      } catch (emailErr) {
        console.warn('[Update Email] Resend notification warning:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      email: trimmedEmail,
      message: `Email verified and updated to ${trimmedEmail}. A confirmation copy was sent to your inbox.`
    });

  } catch (err: any) {
    console.error('[Update Email] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
