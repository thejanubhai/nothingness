import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  return NextResponse.json({ status: 'success', message: 'Notifications API deprecated after Knock removal.' }, { status: 200 });
}
