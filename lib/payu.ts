import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export interface PayUConfig {
  key: string;
  salt: string;
  clientId: string;
  clientSecret: string;
  env: 'TEST' | 'SANDBOX' | 'PRODUCTION';
  paymentUrl: string;
  serviceUrl: string;
  oauthUrl: string;
  apiBaseUrl: string;
}

export interface PayUPaymentParams {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  hash: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  service_provider?: string;
  address1?: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
}

export interface CreatePaymentOptions {
  txnid: string;
  amount: number;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl?: string;
  furl?: string;
  udf1?: string; // bookingId / userId / orderId
  udf2?: string; // actionType: 'primary_stay' | 'guest_self_pay' | 'id_verification_fee' | 'kinkster_activation_fee' | 'partner_onboarding_fee'
  udf3?: string; // token / metadata / alias
  udf4?: string;
  udf5?: string;
}

// In-memory OAuth token cache
let cachedOAuthToken: { token: string; expiresAt: number } | null = null;

/**
 * Resolve PayU configuration from environment variables with support for
 * PAYU_KEY, PayU_Key, PAYU_SALT, PayU_Salt, PAYU_CLIENT_ID, PayU_ClientID,
 * PAYU_CLIENT_SECRET, PayU_Client_Secret, and PAYU_ENV.
 */
export function getPayUConfig(): PayUConfig {
  const key =
    process.env.PAYU_KEY ||
    process.env.PayU_Key ||
    process.env.NEXT_PUBLIC_PAYU_KEY ||
    process.env.NEXT_PUBLIC_PayU_Key ||
    '';

  const salt =
    process.env.PAYU_SALT ||
    process.env.PayU_Salt ||
    '';

  const clientId =
    process.env.PAYU_CLIENT_ID ||
    process.env.PayU_ClientID ||
    process.env.PayU_ClientId ||
    '';

  const clientSecret =
    process.env.PAYU_CLIENT_SECRET ||
    process.env.PayU_Client_Secret ||
    process.env.PayU_ClientSecret ||
    '';

  const envRaw = (
    process.env.PAYU_ENV ||
    process.env.PayU_Env ||
    (process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'TEST')
  ).toUpperCase();

  const env: 'TEST' | 'SANDBOX' | 'PRODUCTION' =
    envRaw === 'PRODUCTION' ? 'PRODUCTION' : envRaw === 'SANDBOX' ? 'SANDBOX' : 'TEST';

  const isProd = env === 'PRODUCTION';

  const paymentUrl = isProd
    ? 'https://secure.payu.in/_payment'
    : 'https://test.payu.in/_payment';

  const serviceUrl = isProd
    ? 'https://info.payu.in/merchant/postservice.php?form=2'
    : 'https://test.payu.in/merchant/postservice.php?form=2';

  const oauthUrl = isProd
    ? 'https://accounts.payu.in/oauth/token'
    : 'https://test-accounts.payu.in/oauth/token';

  const apiBaseUrl = isProd
    ? 'https://api.payu.in'
    : 'https://test-api.payu.in';

  if (!key || !salt) {
    console.warn('[PayU] Warning: PayU_Key or PayU_Salt environment variables are not configured.');
  }

  return {
    key,
    salt,
    clientId,
    clientSecret,
    env,
    paymentUrl,
    serviceUrl,
    oauthUrl,
    apiBaseUrl,
  };
}

/**
 * Retrieve PayU OAuth 2.0 Bearer Access Token using Client Credentials grant.
 * Caches token in-memory and refreshes before expiration.
 */
export async function getPayUOAuthToken(): Promise<string | null> {
  const config = getPayUConfig();
  if (!config.clientId || !config.clientSecret) {
    return null;
  }

  const now = Date.now();
  if (cachedOAuthToken && cachedOAuthToken.expiresAt > now + 60000) {
    return cachedOAuthToken.token;
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      scope: 'create_payment_order verify_payment refund_payment',
    });

    const res = await fetch(config.oauthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[PayU OAuth] Failed to obtain token:', res.status, errText);
      return null;
    }

    const data = await res.json();
    const token = data.access_token;
    const expiresInSec = data.expires_in || 3600;

    if (token) {
      cachedOAuthToken = {
        token,
        expiresAt: now + expiresInSec * 1000,
      };
      return token;
    }

    return null;
  } catch (err: any) {
    console.error('[PayU OAuth] Token request exception:', err);
    return null;
  }
}

/**
 * Generate standard PayU Request Hash (SHA-512).
 * Formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 */
export function generatePayUHash(params: {
  key: string;
  txnid: string;
  amount: string | number;
  productinfo: string;
  firstname: string;
  email: string;
  salt: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}): string {
  const formattedAmount = typeof params.amount === 'number'
    ? params.amount.toFixed(2)
    : Number(params.amount).toFixed(2);

  const hashString = [
    params.key.trim(),
    params.txnid.trim(),
    formattedAmount,
    params.productinfo.trim(),
    params.firstname.trim(),
    params.email.trim(),
    params.udf1?.trim() || '',
    params.udf2?.trim() || '',
    params.udf3?.trim() || '',
    params.udf4?.trim() || '',
    params.udf5?.trim() || '',
    '', // udf6
    '', // udf7
    '', // udf8
    '', // udf9
    '', // udf10
    params.salt.trim(),
  ].join('|');

  return crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();
}

/**
 * Verify PayU Response Callback Hash (SHA-512).
 * Formula with additionalCharges: sha512(additionalCharges|SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 * Formula standard: sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
export function verifyPayUResponseHash(responseParams: Record<string, any>): boolean {
  const config = getPayUConfig();
  const salt = config.salt;
  const receivedHash = (responseParams.hash || responseParams.signature || '').toLowerCase();

  if (!receivedHash || !salt) {
    return false;
  }

  const status = responseParams.status || '';
  const txnid = responseParams.txnid || '';
  const amount = responseParams.amount ? Number(responseParams.amount).toFixed(2) : '';
  const productinfo = responseParams.productinfo || '';
  const firstname = responseParams.firstname || '';
  const email = responseParams.email || '';
  const key = responseParams.key || config.key;

  const udf1 = responseParams.udf1 || '';
  const udf2 = responseParams.udf2 || '';
  const udf3 = responseParams.udf3 || '';
  const udf4 = responseParams.udf4 || '';
  const udf5 = responseParams.udf5 || '';

  const additionalCharges = responseParams.additionalCharges;

  // Calculate standard reverse hash
  const standardSequence = [
    salt.trim(),
    status.trim(),
    '', // udf10
    '', // udf9
    '', // udf8
    '', // udf7
    '', // udf6
    udf5.trim(),
    udf4.trim(),
    udf3.trim(),
    udf2.trim(),
    udf1.trim(),
    email.trim(),
    firstname.trim(),
    productinfo.trim(),
    amount,
    txnid.trim(),
    key.trim(),
  ];

  let hashSequence = standardSequence;
  if (additionalCharges) {
    hashSequence = [Number(additionalCharges).toFixed(2), ...standardSequence];
  }

  const calculatedHash = crypto
    .createHash('sha512')
    .update(hashSequence.join('|'))
    .digest('hex')
    .toLowerCase();

  if (calculatedHash === receivedHash) {
    return true;
  }

  // Fallback check without additional charges if initial check failed
  if (additionalCharges) {
    const fallbackHash = crypto
      .createHash('sha512')
      .update(standardSequence.join('|'))
      .digest('hex')
      .toLowerCase();
    if (fallbackHash === receivedHash) return true;
  }

  return false;
}

/**
 * Constructs complete PayU form parameters and hashes for initiating payment.
 */
export function createPayUPaymentRequest(options: CreatePaymentOptions): {
  paymentUrl: string;
  params: PayUPaymentParams;
} {
  const config = getPayUConfig();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia';

  const surl = options.surl || `${siteUrl}/api/payment/payu-callback`;
  const furl = options.furl || `${siteUrl}/api/payment/payu-callback`;

  const cleanPhone = options.phone.replace(/[^0-9]/g, '');
  const customerPhone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : '9999999999';
  const customerEmail = options.email || 'concierge@nothingness.asia';
  const customerName = options.firstname.trim() || 'Nothingness Guest';
  const formattedAmount = options.amount.toFixed(2);
  const cleanProductInfo = options.productinfo.replace(/[^a-zA-Z0-9\s_-]/g, '').slice(0, 100) || 'Sanctuary Reservation';

  const hash = generatePayUHash({
    key: config.key,
    txnid: options.txnid,
    amount: formattedAmount,
    productinfo: cleanProductInfo,
    firstname: customerName,
    email: customerEmail,
    salt: config.salt,
    udf1: options.udf1,
    udf2: options.udf2,
    udf3: options.udf3,
    udf4: options.udf4,
    udf5: options.udf5,
  });

  const params: PayUPaymentParams = {
    key: config.key,
    txnid: options.txnid,
    amount: formattedAmount,
    productinfo: cleanProductInfo,
    firstname: customerName,
    email: customerEmail,
    phone: customerPhone,
    surl,
    furl,
    hash,
    udf1: options.udf1,
    udf2: options.udf2,
    udf3: options.udf3,
    udf4: options.udf4,
    udf5: options.udf5,
    service_provider: 'payu_paisa',
  };

  return {
    paymentUrl: config.paymentUrl,
    params,
  };
}

/**
 * Query PayU S2S (Server to Server) Verify Payment Web Service.
 */
export async function verifyPaymentWithPayUS2S(txnid: string): Promise<{
  success: boolean;
  status: string;
  data?: any;
  error?: string;
}> {
  try {
    const config = getPayUConfig();
    if (!config.key || !config.salt) {
      return { success: false, status: 'unknown', error: 'PayU credentials missing' };
    }

    const command = 'verify_payment';
    const hashString = `${config.key}|${command}|${txnid}|${config.salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();

    const postData = new URLSearchParams({
      key: config.key,
      command,
      var1: txnid,
      hash,
    });

    const res = await fetch(config.serviceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: postData.toString(),
    });

    const json = await res.json();

    if (json?.status === 1 && json?.transaction_details?.[txnid]) {
      const txn = json.transaction_details[txnid];
      const isSuccess = txn.status === 'success';
      return {
        success: isSuccess,
        status: txn.status,
        data: txn,
      };
    }

    return {
      success: false,
      status: 'failed',
      data: json,
    };
  } catch (err: any) {
    console.error('[PayU S2S Verify Error]:', err);
    return {
      success: false,
      status: 'error',
      error: err.message,
    };
  }
}

/**
 * Fetch dynamic user action fees from platform_settings table.
 */
export async function getPlatformActionFees(): Promise<{
  fee_id_verification: number;
  fee_kinkster_activation: number;
  fee_partner_onboarding: number;
}> {
  try {
    const adminSupabase = createAdminClient();
    const { data } = await adminSupabase
      .from('platform_settings')
      .select('fee_id_verification, fee_kinkster_activation, fee_partner_onboarding')
      .maybeSingle();

    return {
      fee_id_verification: Number(data?.fee_id_verification) || 0,
      fee_kinkster_activation: Number(data?.fee_kinkster_activation) || 0,
      fee_partner_onboarding: data?.fee_partner_onboarding !== undefined && data?.fee_partner_onboarding !== null
        ? Number(data.fee_partner_onboarding)
        : 300000,
    };
  } catch (err) {
    console.warn('[PayU] Error fetching platform action fees, using defaults:', err);
    return {
      fee_id_verification: 0,
      fee_kinkster_activation: 0,
      fee_partner_onboarding: 300000,
    };
  }
}
