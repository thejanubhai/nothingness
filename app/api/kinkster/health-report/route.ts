import { NextRequest, NextResponse } from 'next/server';
import { POST as verifyHealthPost } from '../verify-health/route';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const imagePayload = body.report_image_url || body.file_data || body.image_url;

    if (!imagePayload) {
      return NextResponse.json({ error: 'Report image URL or Base64 is required.' }, { status: 400 });
    }

    // Proxy into verify-health
    const simulatedReq = new NextRequest(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify({ report_image_url: imagePayload })
    });

    const response = await verifyHealthPost(simulatedReq);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({
      ...data,
      health_badges: data.badges || []
    });
  } catch (err: any) {
    console.error('Health report proxy error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
