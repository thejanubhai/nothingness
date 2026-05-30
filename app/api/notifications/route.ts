import { NextResponse } from 'next/server';
import { Knock } from '@knocklabs/node';

// Only initialize if API key is present
const knock = process.env.KNOCK_SECRET_API_KEY ? new Knock({ apiKey: process.env.KNOCK_SECRET_API_KEY as string }) : null;

export async function POST(req: Request) {
  try {
    const { workflow, recipient, data } = await req.json();

    if (!workflow || !recipient) {
      return NextResponse.json({ error: 'Missing required fields (workflow, recipient)' }, { status: 400 });
    }

    if (!knock) {
      console.warn("KNOCK_SECRET_API_KEY is missing. Notification was not sent, but API returned success for demo purposes.");
      return NextResponse.json({ status: 'mock_success', message: 'No API key configured.' }, { status: 200 });
    }

    const triggerResult = await knock.workflows.trigger(workflow, {
      recipients: [recipient],
      data: data || {},
    });

    return NextResponse.json({ status: 'success', triggerResult }, { status: 200 });
  } catch (error: any) {
    console.error('Knock error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
