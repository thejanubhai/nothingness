import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWhatsAppMessage } from '@/lib/omnichannel/meta';
import { logAdminAction } from '@/lib/audit-logger';
import { Resend } from 'resend';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adminSupabase = createAdminClient();

    // 1. Fetch Inbound Franchise Leads
    const { data: leads, error: leadsError } = await adminSupabase
      .from('franchise_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (leadsError) {
      console.warn('Franchise leads fetch warning:', leadsError);
    }

    // 2. Fetch Partner Profiles with their properties
    const { data: partners, error: partnersError } = await adminSupabase
      .from('partner_profiles')
      .select(`
        *,
        partner_properties (*)
      `)
      .order('created_at', { ascending: false });

    if (partnersError) {
      console.warn('Partner profiles fetch warning:', partnersError);
    }

    // 3. Fetch All Partner Properties
    const { data: properties, error: propsError } = await adminSupabase
      .from('partner_properties')
      .select(`
        *,
        partner_profiles (id, full_name, email, phone, status, payout_frequency, bank_name, bank_account_number, upi_id)
      `)
      .order('created_at', { ascending: false });

    // 4. Calculate Stats
    const totalLeads = leads?.length || 0;
    const newLeads = leads?.filter(l => l.status === 'new').length || 0;
    const activePartners = partners?.filter(p => p.status === 'active' || p.verified_by_admin).length || 0;
    const pendingVerification = partners?.filter(p => p.status === 'under_review' || (p.affidavit_uploaded && !p.verified_by_admin)).length || 0;
    const paidSetupCount = partners?.filter(p => p.setup_fee_paid).length || 0;
    const totalSetupRevenue = paidSetupCount * 300000;

    return NextResponse.json({
      success: true,
      stats: {
        totalLeads,
        newLeads,
        activePartners,
        pendingVerification,
        paidSetupCount,
        totalSetupRevenue,
      },
      leads: leads || [],
      partners: partners || [],
      properties: properties || [],
    });
  } catch (err: any) {
    console.error('Admin partners GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminSupabase = createAdminClient();
    const body = await req.json();
    const { 
      type, 
      id, 
      status, 
      notes, 
      setup_fee_paid, 
      verified_by_admin, 
      lounge_eligible, 
      housekeeping_status, 
      space_tier 
    } = body;

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and ID are required.' }, { status: 400 });
    }

    // 1. UPDATE FRANCHISE LEAD
    if (type === 'lead') {
      const updatePayload: any = { updated_at: new Date().toISOString() };
      if (status) updatePayload.status = status;

      const { data, error } = await adminSupabase
        .from('franchise_leads')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, lead: data, message: 'Franchise lead updated.' });
    }

    // 2. UPDATE PARTNER PROFILE & VERIFICATION
    if (type === 'partner') {
      const updatePayload: any = { updated_at: new Date().toISOString() };
      
      if (status) updatePayload.status = status;
      if (verified_by_admin !== undefined) {
        updatePayload.verified_by_admin = verified_by_admin;
        if (verified_by_admin) {
          updatePayload.status = 'active';
          updatePayload.verified_at = new Date().toISOString();
        }
      }
      if (setup_fee_paid !== undefined) {
        updatePayload.setup_fee_paid = setup_fee_paid;
        if (setup_fee_paid) {
          updatePayload.setup_fee_tx_id = `admin_override_${Date.now()}`;
        }
      }
      if (notes !== undefined) updatePayload.affidavit_notes = notes;

      const { data, error } = await adminSupabase
        .from('partner_profiles')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // If partner was verified and activated, dispatch external notifications
      if (verified_by_admin && data) {
        const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia';
        const partnerDashboardUrl = `${siteUrl}/partner/dashboard`;

        if (data.phone) {
          try {
            const waMsg = `Namaste ${data.full_name || 'Partner'}! 🏛️\n\nCongratulations! Your Nothingness Host Partner account has been approved and activated.\n\nYou now have full live sanctuary hosting and revenue-sharing privileges. Access your partner dashboard here:\n${partnerDashboardUrl}`;
            await sendWhatsAppMessage({ to: data.phone, text: waMsg });
          } catch (waErr) {
            console.warn('[Admin Partners] WhatsApp dispatch error:', waErr);
          }
        }

        if (data.email && env.RESEND_API_KEY) {
          try {
            const resend = new Resend(env.RESEND_API_KEY);
            await resend.emails.send({
              from: 'Nothingness Partnerships <concierge@nothingness.asia>',
              to: data.email,
              subject: 'Partner Account Approved & Live - Nothingness',
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0c0c0e; color: #f3f3f3; padding: 40px 24px; border-radius: 16px; border: 1px solid #1a1a22;">
                  <h1 style="font-family: Georgia, serif; font-size: 22px; color: #e2b866; text-align: center; text-transform: uppercase;">Nothingness</h1>
                  <p style="text-align: center; color: #888899; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Partner Host Clearance</p>
                  <div style="padding: 24px 0;">
                    <p>Dear <strong>${data.full_name}</strong>,</p>
                    <p style="color: #a0a0b0; font-size: 14px; line-height: 1.6;">
                      Your partner host credentials and property documentation have been audited and approved. Your sanctuary host account is now <strong>Active & Online</strong>.
                    </p>
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${partnerDashboardUrl}" style="display: inline-block; background-color: #e2b866; color: #000000; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; text-transform: uppercase;">
                        Access Partner Dashboard
                      </a>
                    </div>
                  </div>
                </div>
              `
            });
          } catch (emailErr) {
            console.warn('[Admin Partners] Resend dispatch error:', emailErr);
          }
        }
      }

      await logAdminAction(
        verified_by_admin ? 'partner_approved' : 'partner_updated',
        'partner',
        id,
        { status: data.status, verified_by_admin: data.verified_by_admin, setup_fee_paid: data.setup_fee_paid }
      );

      return NextResponse.json({ success: true, partner: data, message: 'Partner profile updated.' });
    }

    // 3. UPDATE PARTNER PROPERTY
    if (type === 'property') {
      const updatePayload: any = { updated_at: new Date().toISOString() };
      if (lounge_eligible !== undefined) updatePayload.lounge_eligible = lounge_eligible;
      if (housekeeping_status) updatePayload.housekeeping_status = housekeeping_status;
      if (space_tier) updatePayload.space_tier = space_tier;

      const { data, error } = await adminSupabase
        .from('partner_properties')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, property: data, message: 'Partner property updated.' });
    }

    return NextResponse.json({ error: 'Invalid update type.' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin partners PATCH error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminSupabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and ID are required.' }, { status: 400 });
    }

    if (type === 'lead') {
      const { error } = await adminSupabase
        .from('franchise_leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Franchise lead deleted.' });
    }

    if (type === 'property') {
      const { error } = await adminSupabase
        .from('partner_properties')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Partner property deleted.' });
    }

    return NextResponse.json({ error: 'Invalid delete type.' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin partners DELETE error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
