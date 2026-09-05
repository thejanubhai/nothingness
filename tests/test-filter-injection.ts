import { NextRequest } from 'next/server';
import { POST as verifyInPersonPost } from '../app/api/admin/gatherings/verify-in-person/route';

async function testFilterInjection() {
  // Try to certify non-existent user @ghost, but inject a filter clause
  const req = new NextRequest('http://localhost:3000/api/admin/gatherings/verify-in-person', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: 'ghost,id.neq.00000000-0000-0000-0000-000000000000',
      marshallPin: '1991',
    }),
  });

  const res = await verifyInPersonPost(req);
  const data = await res.json();
  console.log('STATUS:', res.status);
  console.log('RESPONSE:', JSON.stringify(data, null, 2));
}

testFilterInjection();
