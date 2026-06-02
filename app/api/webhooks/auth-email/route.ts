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
    const magicLink = `${siteUrl}/auth/callback?token_hash=${tokenHash}&type=${emailType}&next=${redirectTo || '/dashboard'}`;
    let subjectText = 'Message from Nothingness';
    let htmlBody = '';

    if (emailType === 'signup') {
      subjectText = 'Welcome to Nothingness';
      htmlBody = `
        <div style="font-family: Arial, sans-serif; background-color: #080808; color: #F5F5F5; padding: 40px; text-align: center;">
          <h2 style="color: #D4AF37; font-family: serif; font-size: 24px; margin-bottom: 20px;">Welcome to Nothingness</h2>
          <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 30px;">Please confirm your email address to access your Guest Portal.</p>
          <a href="${magicLink}" style="background-color: #D4AF37; color: #000; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Confirm Email</a>
        </div>
      `;
    } else if (emailType === 'magiclink') {
      subjectText = 'Your Access Portal Link';
      htmlBody = `
        <div style="font-family: Arial, sans-serif; background-color: #080808; color: #F5F5F5; padding: 40px; text-align: center;">
          <h2 style="color: #D4AF37; font-family: serif; font-size: 24px; margin-bottom: 20px;">Guest Portal Access</h2>
          <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 30px;">Click the button below to securely sign into your Nothingness account.</p>
          <a href="${magicLink}" style="background-color: #D4AF37; color: #000; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Enter Portal</a>
        </div>
      `;
    } else if (emailType === 'email_change') {
      subjectText = 'Confirm your new email address';
      htmlBody = `
        <div style="font-family: Arial, sans-serif; background-color: #080808; color: #F5F5F5; padding: 40px; text-align: center;">
          <h2 style="color: #D4AF37; font-family: serif; font-size: 24px; margin-bottom: 20px;">Email Update Request</h2>
          <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 30px;">We received a request to update the email address linked to your Nothingness profile. Click below to verify this change.</p>
          <a href="${magicLink}" style="background-color: #D4AF37; color: #000; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Verify New Email</a>
        </div>
      `;
    } else if (emailType === 'recovery') {
      subjectText = 'Reset your password';
      htmlBody = `
        <div style="font-family: Arial, sans-serif; background-color: #080808; color: #F5F5F5; padding: 40px; text-align: center;">
          <h2 style="color: #D4AF37; font-family: serif; font-size: 24px; margin-bottom: 20px;">Password Reset</h2>
          <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 30px;">Click the button below to reset your Nothingness account password.</p>
          <a href="${magicLink}" style="background-color: #D4AF37; color: #000; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Reset Password</a>
        </div>
      `;
    } else {
      subjectText = 'Message from Nothingness';
      htmlBody = `
        <div style="font-family: Arial, sans-serif; background-color: #080808; color: #F5F5F5; padding: 40px; text-align: center;">
          <h2 style="color: #D4AF37; font-family: serif; font-size: 24px; margin-bottom: 20px;">Notice</h2>
          <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 30px;">Please click the link below to proceed.</p>
          <a href="${magicLink}" style="background-color: #D4AF37; color: #000; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Proceed</a>
        </div>
      `;
    }

    // 4. Send via Resend
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Nothingness <hello@nothingness.asia>',
        to: userEmail,
        subject: subjectText,
        html: htmlBody,
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
