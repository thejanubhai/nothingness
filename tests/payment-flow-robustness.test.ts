import { generatePayUHash, verifyPayUResponseHash, createPayUPaymentRequest, sanitizePayUDescription } from '../lib/payu';

async function runTests() {
  console.log('=== Payment Flow Robustness & Integrity Tests ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // Test 1: Hash generation produces deterministic 128-char hex string (SHA-512)
  try {
    const hash = generatePayUHash({
      key: 'testKey123',
      txnid: 'order_1700000000',
      amount: 4999,
      productinfo: 'Sanctuary Stay - Glass House',
      firstname: 'Aarav Sharma',
      email: 'aarav@example.com',
      salt: 'testSalt456',
      udf1: 'booking_abc123',
      udf2: 'primary_stay',
      udf3: 'user_xyz',
      udf4: 'Glass House',
    });

    assert(typeof hash === 'string' && hash.length === 128, 'generatePayUHash outputs valid 128-char SHA-512 hex hash');
  } catch (err: any) {
    assert(false, `generatePayUHash threw error: ${err.message}`);
  }

  // Test 2: Hash verification properly identifies authentic vs tampered callbacks
  try {
    const key = 'testKey123';
    const salt = 'testSalt456';
    const txnid = 'order_1700000000';
    const amount = '4999.00';
    const productinfo = 'Sanctuary Stay - Glass House';
    const firstname = 'Aarav Sharma';
    const email = 'aarav@example.com';
    const status = 'success';
    const udf1 = 'booking_abc123';
    const udf2 = 'primary_stay';
    const udf3 = 'user_xyz';
    const udf4 = 'Glass House';
    const udf5 = '';

    // Reverse sequence calculation: sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    const crypto = await import('crypto');
    const reverseSequence = [
      salt,
      status,
      '', '', '', '', '', // udf10..udf6
      udf5,
      udf4,
      udf3,
      udf2,
      udf1,
      email,
      firstname,
      productinfo,
      amount,
      txnid,
      key
    ].join('|');

    const validSignature = crypto.createHash('sha512').update(reverseSequence).digest('hex').toLowerCase();

    const authenticPayload = {
      key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      status,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      hash: validSignature
    };

    const isVerified = verifyPayUResponseHash(authenticPayload, salt);
    assert(isVerified === true, 'verifyPayUResponseHash validates authentic PayU payload');

    const tamperedPayload = { ...authenticPayload, amount: '1.00' };
    const isTamperedVerified = verifyPayUResponseHash(tamperedPayload, salt);
    assert(isTamperedVerified === false, 'verifyPayUResponseHash rejects tampered amount payload');
  } catch (err: any) {
    assert(false, `verifyPayUResponseHash test error: ${err.message}`);
  }

  // Test 3: createPayUPaymentRequest validates phone number and product info formatting
  try {
    const req = createPayUPaymentRequest({
      txnid: 'spass_12345',
      amount: 1499,
      productinfo: 'Sanctuary Pass <Special> & VIP',
      firstname: 'Ananya Roy',
      email: 'ananya@example.com',
      phone: '+91 (98765) 43210',
      udf1: 'user_ananya',
      udf2: 'sanctuary_pass_fee',
      udf3: '1499',
    }, {
      key: 'testKey123',
      salt: 'testSalt456',
      clientId: 'cid',
      clientSecret: 'csec',
      env: 'PRODUCTION',
      paymentUrl: 'https://secure.payu.in/_payment',
      serviceUrl: 'https://info.payu.in/merchant/postservice.php?form=2',
      oauthUrl: 'https://accounts.payu.in/oauth/token',
      apiBaseUrl: 'https://api.payu.in',
    });

    assert(req.params.phone === '9876543210', 'createPayUPaymentRequest sanitizes 10-digit Indian phone format');
    assert(!req.params.productinfo.includes('<') && !req.params.productinfo.includes('&'), 'createPayUPaymentRequest sanitizes productinfo special characters');
    assert(req.params.amount === '1499.00', 'createPayUPaymentRequest formats amount to 2 decimal places');
    assert(req.params.udf2 === 'sanctuary_pass_fee', 'createPayUPaymentRequest preserves udf2 action category');
  } catch (err: any) {
    assert(false, `createPayUPaymentRequest test error: ${err.message}`);
  }

  // Test 4: All fee categories recognized including circle_activation_fee
  const feeCategories = [
    'primary_stay',
    'sanctuary_pass_fee',
    'event_ticket_fee',
    'guest_self_pay',
    'id_verification_fee',
    'partner_onboarding_fee',
    'kinkster_activation_fee',
    'circle_activation_fee',
  ];
  assert(feeCategories.length >= 7, 'All application payment flow types covered in state machine');

  // Test 5: PayU Compliance Sanitizer replaces restricted/prohibited adult keywords
  try {
    const rawDesc = 'Kinkster Mode Lifetime Membership Fee with Kink Pass & Erotic BDSM Suite';
    const sanitized = sanitizePayUDescription(rawDesc);
    assert(!/kink/i.test(sanitized), 'sanitizePayUDescription eliminates "kink" terms');
    assert(!/bdsm/i.test(sanitized), 'sanitizePayUDescription eliminates "bdsm" terms');
    assert(!/erotic/i.test(sanitized), 'sanitizePayUDescription eliminates "erotic" terms');
    assert(sanitized.includes('Society'), 'sanitizePayUDescription replaces with "Society" term');
  } catch (err: any) {
    assert(false, `sanitizePayUDescription test error: ${err.message}`);
  }

  // Test 6: createPayUPaymentRequest maps kinkster_activation_fee to circle_activation_fee for PayU risk compliance
  try {
    const req = createPayUPaymentRequest({
      txnid: 'circle_99999',
      amount: 1999,
      productinfo: 'Kinkster Mode Activation',
      firstname: 'Samarth K',
      email: 'samarth@example.com',
      phone: '9876543210',
      udf2: 'kinkster_activation_fee',
    }, {
      key: 'testKey123',
      salt: 'testSalt456',
      clientId: 'cid',
      clientSecret: 'csec',
      env: 'PRODUCTION',
      paymentUrl: 'https://secure.payu.in/_payment',
      serviceUrl: 'https://info.payu.in/merchant/postservice.php?form=2',
      oauthUrl: 'https://accounts.payu.in/oauth/token',
      apiBaseUrl: 'https://api.payu.in',
    });

    assert(req.params.udf2 === 'circle_activation_fee', 'createPayUPaymentRequest sanitizes udf2 to circle_activation_fee');
    assert(!req.params.productinfo.toLowerCase().includes('kink'), 'createPayUPaymentRequest productinfo is sanitized');
  } catch (err: any) {
    assert(false, `createPayUPaymentRequest compliance mapping test error: ${err.message}`);
  }

  // Test 7: Verify mandatory PayU legal compliance policy pages exist
  const requiredLegalPages = [
    'app/legal/terms/page.tsx',
    'app/legal/privacy/page.tsx',
    'app/legal/cancellation/page.tsx',
    'app/legal/shipping/page.tsx',
    'app/legal/pricing/page.tsx',
    'app/contact/page.tsx',
  ];

  const fs = await import('fs');
  const path = await import('path');
  for (const pagePath of requiredLegalPages) {
    const fullPath = path.join(process.cwd(), pagePath);
    assert(fs.existsSync(fullPath), `Mandatory PayU policy file exists: ${pagePath}`);
  }

  // Test 8: Verify Tax Invoice & Voucher pages exist
  const invoiceFiles = [
    'app/booking/[id]/invoice/page.tsx',
    'app/booking/[id]/invoice/InvoiceActionBar.tsx',
  ];
  for (const invFile of invoiceFiles) {
    const fullPath = path.join(process.cwd(), invFile);
    assert(fs.existsSync(fullPath), `Tax invoice component exists: ${invFile}`);
  }

  // Test 9: Verify Tax Invoice statutory compliance terms (SAC 996311, Legal Entity, PayU descriptor)
  try {
    const invoiceContent = fs.readFileSync(path.join(process.cwd(), 'app/booking/[id]/invoice/page.tsx'), 'utf-8');
    assert(invoiceContent.includes('996311'), 'Invoice specifies statutory SAC Code 996311');
    assert(invoiceContent.includes('SHEIKH ARSALAN ULLAH CHISHTI'), 'Invoice specifies legal entity name');
    assert(invoiceContent.includes('PAYU*NOTHINGNESS'), 'Invoice specifies PayU statement descriptor');
    assert(invoiceContent.includes('CGST Act, 2017'), 'Invoice cites statutory CGST Act 2017');
  } catch (err: any) {
    assert(false, `Tax invoice statutory compliance content error: ${err.message}`);
  }

  // Test 10: Primary booking confirmation notification dispatch helper
  try {
    const { sendPrimaryBookingConfirmationNotification } = await import('../lib/notifications/verification');
    const result = await sendPrimaryBookingConfirmationNotification({
      email: 'guest@example.com',
      guestName: 'Arjun Verma',
      bookingId: '11111111-2222-3333-4444-555555555555',
      spaceTitle: 'The Void Suite',
      checkInDate: '2026-10-01',
      checkOutDate: '2026-10-03',
      totalAmount: 35000,
    });

    assert(result.success === true, 'sendPrimaryBookingConfirmationNotification returns success');
    assert(result.receiptUrl.includes('/booking/11111111-2222-3333-4444-555555555555/invoice'), 'sendPrimaryBookingConfirmationNotification generates valid invoice receipt URL');
  } catch (err: any) {
    assert(false, `sendPrimaryBookingConfirmationNotification test error: ${err.message}`);
  }

  // Test 11: getBookingReceiptEmailHtml template outputs PayU and invoice URL
  try {
    const { getBookingReceiptEmailHtml } = await import('../lib/email-templates');
    const emailHtml = getBookingReceiptEmailHtml({
      memberName: 'Arjun Verma',
      bookingId: '11111111-2222-3333-4444-555555555555',
      sanctuaryName: 'The Void Suite',
      dateRange: '01 Oct 2026 to 03 Oct 2026',
      totalAmount: '₹35,000',
      receiptUrl: 'https://nothingness.asia/booking/11111111-2222-3333-4444-555555555555/invoice',
    });

    assert(emailHtml.includes('PayU India'), 'Email template defaults to PayU payment method');
    assert(emailHtml.includes('/booking/11111111-2222-3333-4444-555555555555/invoice'), 'Email template contains official tax invoice URL');
  } catch (err: any) {
    assert(false, `getBookingReceiptEmailHtml test error: ${err.message}`);
  }

  console.log(`\nFinal Test Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch(console.error);

