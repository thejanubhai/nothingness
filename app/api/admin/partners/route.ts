import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
