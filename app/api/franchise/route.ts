import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { knock } from '@/lib/knock';

export async function POST(req: Request) {
  try {
    const { name, email, phone, location, budget, experience } = await req.json();

    if (!name || !email || !location || !budget) {
      return NextResponse.json({ error: 'Name, email, location, and budget are required.' }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('franchise_leads')
      .insert({
        name,
        email,
        phone,
        property_location: location,
        investment_budget: budget,
        experience,
        status: 'new'
      })
      .select()
      .single();

    if (error) {
      console.error('Franchise lead error:', error);
      return NextResponse.json({ error: 'Failed to submit application.' }, { status: 500 });
    }

    try {
      await knock.workflows.trigger("franchise-lead-received", {
        recipients: ["admin-team"],
        data: {
          lead_name: name,
          lead_email: email,
          lead_location: location,
          lead_budget: budget
        },
      });
    } catch (knockError) {
      console.error("Knock notification failed, but lead was saved:", knockError);
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('Franchise API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
