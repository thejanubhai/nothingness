import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: spaces, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching spaces:', error);
      return NextResponse.json({ spaces: [] }, { status: 200 });
    }

    return NextResponse.json({ spaces: spaces || [] });
  } catch (err: any) {
    console.error('Failed to fetch spaces:', err);
    return NextResponse.json({ spaces: [], error: err.message }, { status: 500 });
  }
}
