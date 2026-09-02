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
  curl?: string;
  hash: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
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
  curl?: string;
  udf1?: string; // bookingId / userId / orderId
  udf2?: string; // actionType: 'primary_stay' | 'guest_self_pay' | 'id_verification_fee' | 'kinkster_activation_fee' | 'partner_onboarding_fee' | 'sanctuary_pass_fee' | 'event_ticket_fee'
  udf3?: string; // token / metadata / alias
  udf4?: string;
  udf5?: string;
}

// In-memory OAuth token cache
let cachedOAuthToken: { token: string; expiresAt: number } | null = null;
let cachedDbConfig: { key?: string; salt?: string; clientId?: string; clientSecret?: string; env?: 'TEST' | 'SANDBOX' | 'PRODUCTION'; fetchedAt: number } | null = null;

/**
 * Resolve PayU configuration from environment variables or platform settings.
 */
export function getPayUConfig(dbFallback?: { key?: string; salt?: string; clientId?: string; clientSecret?: string; env?: string }): PayUConfig {
  // Check for Test Credentials in Vercel: payUTESTKEY / payUTESTSALT / PAYU_TEST_KEY / PAYU_TEST_SALT
  const testKey = (
    process.env.payUTESTKEY ||
    process.env.PAYU_TEST_KEY ||
    process.env.PayU_Test_Key ||
    process.env.NEXT_PUBLIC_payUTESTKEY ||
    ''
  ).trim();

  const testSalt = (
    process.env.payUTESTSALT ||
    process.env.PAYU_TEST_SALT ||
    process.env.PayU_Test_Salt ||
    ''
  ).trim();

  // If user provided payUTESTKEY or payUTESTSALT in Vercel, automatically switch to TEST environment!
  const isTestMode = Boolean(testKey || testSalt);

  const key = isTestMode
    ? testKey
    : (
        process.env.PAYU_KEY ||
        process.env.PayU_Key ||
        process.env.PAYU_MERCHANT_KEY ||
        process.env.NEXT_PUBLIC_PAYU_KEY ||
        process.env.NEXT_PUBLIC_PayU_Key ||
        dbFallback?.key ||
        cachedDbConfig?.key ||
        ''
      ).trim();

  const salt = isTestMode
    ? testSalt
    : (
        process.env.PAYU_SALT ||
        process.env.PayU_Salt ||
        process.env.PAYU_MERCHANT_SALT ||
        dbFallback?.salt ||
        cachedDbConfig?.salt ||
        ''
      ).trim();

  const clientId =
    process.env.PAYU_CLIENT_ID ||
    process.env.PayU_ClientID ||
    process.env.PayU_ClientId ||
    dbFallback?.clientId ||
    cachedDbConfig?.clientId ||
    '';

  const clientSecret =
    process.env.PAYU_CLIENT_SECRET ||
    process.env.PayU_Client_Secret ||
    process.env.PayU_ClientSecret ||
    dbFallback?.clientSecret ||
    cachedDbConfig?.clientSecret ||
    '';

  const envRaw = isTestMode
    ? 'TEST'
    : (
        process.env.PAYU_ENV ||
        process.env.PayU_Env ||
        dbFallback?.env ||
        cachedDbConfig?.env ||
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

  return {
    key,
    salt,
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    env,
    paymentUrl,
    serviceUrl,
    oauthUrl,
    apiBaseUrl,
  };
}

/**
 * Async PayU config resolver that queries platform_settings in Supabase if env vars are missing.
 */
export async function getPayUConfigAsync(): Promise<PayUConfig> {
  const syncConfig = getPayUConfig();
  if (syncConfig.key && syncConfig.salt) {
    return syncConfig;
  }

  // Check cache (TTL 2 minutes)
  const now = Date.now();
  if (cachedDbConfig && cachedDbConfig.fetchedAt > now - 120000) {
    return getPayUConfig();
  }

  try {
    const adminSupabase = createAdminClient();
    const { data } = await adminSupabase
      .from('platform_settings')
      .select('payu_key, payu_salt, payu_client_id, payu_client_secret, payu_env')
      .maybeSingle();

    if (data) {
      cachedDbConfig = {
        key: data.payu_key || undefined,
        salt: data.payu_salt || undefined,
        clientId: data.payu_client_id || undefined,
        clientSecret: data.payu_client_secret || undefined,
        env: data.payu_env ? (data.payu_env.toUpperCase() as any) : undefined,
        fetchedAt: now,
      };
      return getPayUConfig();
    }
  } catch (err) {
    console.warn('[PayU] Could not fetch DB platform_settings fallback:', err);
  }

  return syncConfig;
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
export function verifyPayUResponseHash(responseParams: Record<string, any>, saltOverride?: string): boolean {
  const config = getPayUConfig();
  const receivedHash = (responseParams.hash || responseParams.signature || '').toLowerCase();

  if (!receivedHash) {
    return false;
  }

  const testSalt = (
    process.env.payUTESTSALT ||
    process.env.PAYU_TEST_SALT ||
    process.env.PayU_Test_Salt ||
    ''
  ).trim();

  const liveSalt = (
    process.env.PAYU_SALT ||
    process.env.PayU_Salt ||
    process.env.PAYU_MERCHANT_SALT ||
    ''
  ).trim();

  const candidateSalts = Array.from(
    new Set([saltOverride?.trim(), config.salt, testSalt, liveSalt].filter(Boolean) as string[])
  );

  if (candidateSalts.length === 0) {
    return false;
  }

  const status = (responseParams.status || '').trim();
  const txnid = (responseParams.txnid || '').trim();
  const rawAmount = responseParams.amount !== undefined && responseParams.amount !== null ? String(responseParams.amount).trim() : '';
  const formattedAmount = rawAmount ? Number(rawAmount).toFixed(2) : '';
  const productinfo = (responseParams.productinfo || '').trim();
  const firstname = (responseParams.firstname || '').trim();
  const email = (responseParams.email || '').trim();
  const key = (responseParams.key || config.key || '').trim();

  const udf1 = (responseParams.udf1 || '').trim();
  const udf2 = (responseParams.udf2 || '').trim();
  const udf3 = (responseParams.udf3 || '').trim();
  const udf4 = (responseParams.udf4 || '').trim();
  const udf5 = (responseParams.udf5 || '').trim();

  const additionalCharges = responseParams.additionalCharges ? String(responseParams.additionalCharges).trim() : undefined;

  // Build candidate reverse sequences
  // Official sequence: sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
  const candidateAmounts = [rawAmount, formattedAmount].filter(Boolean);
  const uniqueAmounts = Array.from(new Set(candidateAmounts));

  for (const currentSalt of candidateSalts) {
    for (const amt of uniqueAmounts) {
      const standardSequence = [
        currentSalt,
        status,
        '', // udf10
        '', // udf9
        '', // udf8
        '', // udf7
        '', // udf6
        udf5,
        udf4,
        udf3,
        udf2,
        udf1,
        email,
        firstname,
        productinfo,
        amt,
        txnid,
        key,
      ].join('|');

      // 1. Check with additionalCharges if present
      if (additionalCharges) {
        const addHash = crypto
          .createHash('sha512')
          .update(`${additionalCharges}|${standardSequence}`)
          .digest('hex')
          .toLowerCase();
        if (addHash === receivedHash) return true;

        // Also try with formatted additional charges
        const formattedAddCharges = Number(additionalCharges).toFixed(2);
        if (formattedAddCharges !== additionalCharges) {
          const addHashFmt = crypto
            .createHash('sha512')
            .update(`${formattedAddCharges}|${standardSequence}`)
            .digest('hex')
            .toLowerCase();
          if (addHashFmt === receivedHash) return true;
        }
      }

      // 2. Check standard sequence without additional charges
      const standardHash = crypto
        .createHash('sha512')
        .update(standardSequence)
        .digest('hex')
        .toLowerCase();
      if (standardHash === receivedHash) return true;
    }
  }

  return false;
}

/**
 * Constructs complete PayU form parameters and hashes for initiating payment.
 */
export function createPayUPaymentRequest(options: CreatePaymentOptions, configOverride?: PayUConfig): {
  paymentUrl: string;
  params: PayUPaymentParams;
} {
  const config = configOverride || getPayUConfig();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia';

  if (!config.key || !config.salt) {
    console.warn('[PayU] Warning: Initiating payment request without configured key or salt.');
  }

  console.log(`[PayU] Initiating ${options.txnid} in ${config.env} mode (Endpoint: ${config.paymentUrl}, Key: ${config.key ? config.key.slice(0, 4) + '...' : 'none'})`);

  const surl = options.surl || `${siteUrl}/api/payment/payu-callback`;
  const furl = options.furl || `${siteUrl}/api/payment/payu-callback`;
  const curl = options.curl || options.furl || `${siteUrl}/api/payment/payu-callback`;

  const cleanPhone = options.phone.replace(/[^0-9]/g, '');
  const customerPhone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : '9999999999';
  const customerEmail = options.email || 'concierge@nothingness.asia';
  const customerName = options.firstname.trim() || 'Nothingness Guest';
  const formattedAmount = typeof options.amount === 'number'
    ? options.amount.toFixed(2)
    : Number(options.amount).toFixed(2);
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
    curl,
    hash,
    udf1: options.udf1,
    udf2: options.udf2,
    udf3: options.udf3,
    udf4: options.udf4,
    udf5: options.udf5,
  };

  return {
    paymentUrl: config.paymentUrl,
    params,
  };
}

/**
 * Async version that ensures database platform_settings fallback is queried before generating hash.
 */
export async function createPayUPaymentRequestAsync(options: CreatePaymentOptions): Promise<{
  paymentUrl: string;
  params: PayUPaymentParams;
}> {
  const config = await getPayUConfigAsync();
  return createPayUPaymentRequest(options, config);
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
