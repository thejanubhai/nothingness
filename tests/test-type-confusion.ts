import { NextRequest } from 'next/server';
import { POST as verifyInPersonPost } from '../app/api/admin/gatherings/verify-in-person/route';

async function testTypeConfusion() {
  const req = new NextRequest('http://localhost:3000/api/admin/gatherings/verify-in-person', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: JSON.stringify({ token: 99999 }),
      marshallPin: '1991',
    }),
  });

  const res = await verifyInPersonPost(req);
  const data = await res.json();
  console.log('STATUS:', res.status);
  console.log('RESPONSE:', JSON.stringify(data, null, 2));
}

testTypeConfusion();
