import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      location,
      state,
      city,
      space_tier,
      units,
      carpet_area,
      property_status,
      budget,
      experience,
      wants_lounge
    } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    const resolvedLocation = location || `${city || ''}, ${state || ''}`.trim() || 'Location Not Specified';
    const resolvedBudget = budget || 'Not Specified';

    const formattedMessage = [
      `Space Tier: ${space_tier ? space_tier.toUpperCase() : 'N/A'}`,
      `Units: ${units || '1'}`,
      `Property Status: ${property_status || 'N/A'}`,
      `Carpet Area: ${carpet_area || 'N/A'}`,
      `nothingness. Lounge Eligible: ${wants_lounge ? 'YES' : 'NO'}`,
      `State: ${state || 'N/A'}`,
      `City: ${city || 'N/A'}`,
      `\nNotes / Experience:\n${experience || 'No additional notes provided.'}`
    ].join('\n');

    const adminSupabase = createAdminClient();

    const { data: lead, error } = await adminSupabase
      .from('franchise_leads')
      .insert({
        name,
        email,
        phone: phone || null,
        property_location: resolvedLocation,
        investment_budget: resolvedBudget,
        message: formattedMessage,
        status: 'new'
      })
      .select()
      .single();

    if (error) {
      console.error('Partner lead insert error:', error);
      return NextResponse.json({ error: 'Failed to submit partner application.' }, { status: 500 });
    }

    // Attempt email notification via Resend if key is configured
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'nothingness. Partner Network <hello@nothingness.asia>',
          to: 'admin@nothingness.asia',
          subject: `✨ New nothingness. Partner Application: ${name} (${state || 'Pan-India'})`,
          html: `
            <div style="font-family: sans-serif; background: #000; color: #fff; padding: 24px; border-radius: 12px;">
              <h2 style="color: #D4AF37; margin-bottom: 8px;">New nothingness. Partner Application</h2>
              <p><b>Name:</b> ${name}</p>
              <p><b>Email:</b> ${email}</p>
              <p><b>Phone:</b> ${phone || 'N/A'}</p>
              <p><b>Location:</b> ${resolvedLocation}</p>
              <p><b>Space Tier:</b> ${space_tier || 'N/A'} (${units || 1} units)</p>
              <p><b>Carpet Area:</b> ${carpet_area || 'N/A'}</p>
              <p><b>Investment Budget:</b> ${resolvedBudget}</p>
              <p><b>Property Status:</b> ${property_status || 'N/A'}</p>
              <p><b>Lounge Interest:</b> ${wants_lounge ? 'Yes (>2 properties in state)' : 'No'}</p>
              <hr style="border-color: #333; margin: 16px 0;" />
              <p><b>Notes / Background:</b></p>
              <p style="color: #ccc; white-space: pre-wrap;">${experience || 'None'}</p>
            </div>
          `
        });
      }
    } catch (emailError) {
      console.error('Partner email notification failed, lead saved to database:', emailError);
    }

    return NextResponse.json({ success: true, leadId: lead?.id }, { status: 200 });

  } catch (error: any) {
    console.error('Franchise API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
