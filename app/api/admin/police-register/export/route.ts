import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    const supabase = await createClient();

    let query = supabase
      .from('guest_profiles')
      .select('*')
      .order('verification_timestamp', { ascending: false });

    if (fromDate) {
      query = query.gte('verification_timestamp', `${fromDate}T00:00:00.000Z`);
    }
    if (toDate) {
      query = query.lte('verification_timestamp', `${toDate}T23:59:59.999Z`);
    }

    const { data: guests, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate CSV Header & Rows for Police Compliance Hospitality Register Format
    const headers = [
      'S.No',
      'Full Name',
      'DOB',
      'ID Document Type',
      'Document Number',
      'Permanent Residential Address',
      'Nationality',
      'Is Foreign National',
      'Visa Number',
      'Verification Timestamp',
      '3D Face ID Vetted',
      'Extracted Photo URL',
      'Live 3D Face URL',
      'ID Front Document URL',
      'ID Back Document URL'
    ];
    
    const rows = (guests || []).map((g, idx) => [
      idx + 1,
      `"${g.full_name || ''}"`,
      `"${g.dob || ''}"`,
      `"${g.id_document_type || ''}"`,
      `"${g.document_number || ''}"`,
      `"${(g.permanent_address || '').replace(/"/g, '""')}"`,
      `"${g.nationality || 'Indian'}"`,
      g.is_foreign_national ? 'Yes' : 'No',
      `"${g.visa_number || ''}"`,
      `"${g.verification_timestamp || g.created_at || ''}"`,
      g.face_id_vetted ? 'Yes' : 'No',
      `"${g.photo_url || ''}"`,
      `"${g.live_face_url || ''}"`,
      `"${g.id_front_url || ''}"`,
      `"${g.id_back_url || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="police_guest_register_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (err: any) {
    console.error('Police register export error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
