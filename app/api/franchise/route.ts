import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      const { Resend } = await import('resend');
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'Nothingness Franchise <hello@nothingness.asia>',
          to: 'admin@nothingness.asia',
          subject: 'New Franchise Lead Received',
          html: `<p>New Lead: <b>${name}</b> (${email})</p><p>Location: ${location}</p><p>Budget: ${budget}</p>`
        });
      }
    } catch (emailError) {
      console.error("Email notification failed, but lead was saved:", emailError);
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('Franchise API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
