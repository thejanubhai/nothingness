import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),

  NEXT_PUBLIC_SITE_URL: z.string().url().default('https://nothingness.asia'),

  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),

  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  // Firebase VAPID WebPush Keys
  FIREBASE_WEBPUSH_CERTIFICATE: z.string().optional(),
  FIREBASE_WEBPUSH_CERTIFICATE_PRIVATEKEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_WEBPUSH_CERTIFICATE: z.string().optional(),

  // PayU Payment Gateway Configuration (Key, Salt, OAuth Client ID & Secret)
  PAYU_KEY: z.string().optional(),
  PayU_Key: z.string().optional(),
  payUTESTKEY: z.string().optional(),
  PAYU_TEST_KEY: z.string().optional(),
  PAYU_SALT: z.string().optional(),
  PayU_Salt: z.string().optional(),
  payUTESTSALT: z.string().optional(),
  PAYU_TEST_SALT: z.string().optional(),
  PAYU_CLIENT_ID: z.string().optional(),
  PayU_ClientID: z.string().optional(),
  PAYU_CLIENT_SECRET: z.string().optional(),
  PayU_Client_Secret: z.string().optional(),
  PAYU_ENV: z.enum(['TEST', 'SANDBOX', 'PRODUCTION']).default('PRODUCTION'),
  NEXT_PUBLIC_PAYU_KEY: z.string().optional(),

  // Cloudinary Media Delivery & Storage Configuration
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_URL: z.string().optional(),
  CLOUDINARY_WEBHOOK_SECRET: z.string().optional(),
  CLOUDINARY_UPLOAD_PRESET: z.string().optional(),

  // Meta Graph API (WhatsApp Cloud API & Instagram Messaging)
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_APP_SECRET: z.string().optional(),
  whatsapp_app_secret: z.string().optional(),
  meta_App_ID: z.string().optional(),
  META_APP_ID: z.string().optional(),
  meta_App_secret: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  INSTAGRAM_ACCESS_TOKEN: z.string().optional(),
  INSTAGRAM_ACCOUNT_ID: z.string().optional(),
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  Instagram_app_ID: z.string().optional(),
  INSTAGRAM_APP_ID: z.string().optional(),
  instagram_app_id: z.string().optional(),
  Instagram_app_name: z.string().optional(),
  INSTAGRAM_APP_NAME: z.string().optional(),
  instagram_app_name: z.string().optional(),
  Instagram_app_secret: z.string().optional(),
  INSTAGRAM_APP_SECRET: z.string().optional(),
  instagram_app_secret: z.string().optional(),

  // Facebook Login for Business Configuration ID
  Facebook_login_Configuration_ID: z.string().optional(),
  FACEBOOK_LOGIN_CONFIGURATION_ID: z.string().optional(),
  facebook_login_configuration_id: z.string().optional(),
  FACEBOOK_CONFIG_ID: z.string().optional(),
  NEXT_PUBLIC_FACEBOOK_LOGIN_CONFIGURATION_ID: z.string().optional(),
  NEXT_PUBLIC_FACEBOOK_CONFIG_ID: z.string().optional(),

  NVIDIA_API_KEY: z.string().optional(),
  NVIDIA_AI_API_KEY: z.string().optional(),
  nVidia_AI_API_Key: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  KNOCK_SECRET_API_KEY: z.string().optional(),
  SUPABASE_AUTH_WEBHOOK_SECRET: z.string().default('secret-auth-hook-token-123'),
  ADMIN: z.string().optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,

  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,

  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,

  FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,

  FIREBASE_WEBPUSH_CERTIFICATE: process.env.FIREBASE_WEBPUSH_CERTIFICATE || process.env.NEXT_PUBLIC_FIREBASE_WEBPUSH_CERTIFICATE,
  FIREBASE_WEBPUSH_CERTIFICATE_PRIVATEKEY: process.env.FIREBASE_WEBPUSH_CERTIFICATE_PRIVATEKEY,
  NEXT_PUBLIC_FIREBASE_WEBPUSH_CERTIFICATE: process.env.NEXT_PUBLIC_FIREBASE_WEBPUSH_CERTIFICATE || process.env.FIREBASE_WEBPUSH_CERTIFICATE,

  PAYU_KEY: process.env.PAYU_KEY || process.env.PayU_Key,
  PayU_Key: process.env.PayU_Key || process.env.PAYU_KEY,
  payUTESTKEY: process.env.payUTESTKEY || process.env.PAYU_TEST_KEY,
  PAYU_TEST_KEY: process.env.PAYU_TEST_KEY || process.env.payUTESTKEY,
  PAYU_SALT: process.env.PAYU_SALT || process.env.PayU_Salt,
  PayU_Salt: process.env.PayU_Salt || process.env.PAYU_SALT,
  payUTESTSALT: process.env.payUTESTSALT || process.env.PAYU_TEST_SALT,
  PAYU_TEST_SALT: process.env.PAYU_TEST_SALT || process.env.payUTESTSALT,
  PAYU_CLIENT_ID: process.env.PAYU_CLIENT_ID || process.env.PayU_ClientID,
  PayU_ClientID: process.env.PayU_ClientID || process.env.PAYU_CLIENT_ID,
  PAYU_CLIENT_SECRET: process.env.PAYU_CLIENT_SECRET || process.env.PayU_Client_Secret,
  PayU_Client_Secret: process.env.PayU_Client_Secret || process.env.PAYU_CLIENT_SECRET,
  PAYU_ENV: process.env.PAYU_ENV || process.env.PayU_Env,
  NEXT_PUBLIC_PAYU_KEY: process.env.NEXT_PUBLIC_PAYU_KEY || process.env.PAYU_KEY || process.env.PayU_Key,

  // Cloudinary
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_URL: process.env.CLOUDINARY_URL,
  CLOUDINARY_WEBHOOK_SECRET: process.env.CLOUDINARY_WEBHOOK_SECRET || process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET,

  // Meta Graph API (WhatsApp Cloud API & Instagram Messaging)
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.whatsapp_phone_number_id || process.env.whatsappPhoneNumberId,
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || process.env.whatsapp_access_token || process.env.whatsappAccessToken,
  WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || process.env.whatsapp_business_account_id || process.env.whatsappBusinessAccountId,
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || process.env.whatsapp_webhook_verify_token || process.env.whatsappWebhookVerifyToken,
  WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET || process.env.whatsapp_app_secret || process.env.meta_App_secret || process.env.META_APP_SECRET,
  whatsapp_app_secret: process.env.whatsapp_app_secret || process.env.WHATSAPP_APP_SECRET || process.env.meta_App_secret || process.env.META_APP_SECRET,
  meta_App_ID: process.env.meta_App_ID || process.env.META_APP_ID || process.env.meta_app_id || process.env.metaAppId || process.env.Instagram_app_ID || process.env.INSTAGRAM_APP_ID || process.env.instagram_app_id,
  META_APP_ID: process.env.META_APP_ID || process.env.meta_App_ID || process.env.meta_app_id || process.env.metaAppId || process.env.Instagram_app_ID || process.env.INSTAGRAM_APP_ID || process.env.instagram_app_id,
  meta_App_secret: process.env.meta_App_secret || process.env.META_APP_SECRET || process.env.meta_app_secret || process.env.metaAppSecret || process.env.Instagram_app_secret || process.env.INSTAGRAM_APP_SECRET || process.env.instagram_app_secret,
  META_APP_SECRET: process.env.META_APP_SECRET || process.env.meta_App_secret || process.env.meta_app_secret || process.env.metaAppSecret || process.env.Instagram_app_secret || process.env.INSTAGRAM_APP_SECRET || process.env.instagram_app_secret,
  INSTAGRAM_ACCESS_TOKEN: process.env.INSTAGRAM_ACCESS_TOKEN || process.env.instagram_access_token || process.env.instagramAccessToken,
  INSTAGRAM_ACCOUNT_ID: process.env.INSTAGRAM_ACCOUNT_ID || process.env.instagram_account_id || process.env.instagramAccountId,
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN: process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || process.env.instagram_webhook_verify_token,
  Instagram_app_ID: process.env.Instagram_app_ID || process.env.INSTAGRAM_APP_ID || process.env.instagram_app_id || process.env.meta_App_ID || process.env.META_APP_ID,
  INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID || process.env.Instagram_app_ID || process.env.instagram_app_id || process.env.meta_App_ID || process.env.META_APP_ID,
  instagram_app_id: process.env.instagram_app_id || process.env.Instagram_app_ID || process.env.INSTAGRAM_APP_ID || process.env.meta_App_ID || process.env.META_APP_ID,
  Instagram_app_name: process.env.Instagram_app_name || process.env.INSTAGRAM_APP_NAME || process.env.instagram_app_name,
  INSTAGRAM_APP_NAME: process.env.INSTAGRAM_APP_NAME || process.env.Instagram_app_name || process.env.instagram_app_name,
  instagram_app_name: process.env.instagram_app_name || process.env.Instagram_app_name || process.env.INSTAGRAM_APP_NAME,
  Instagram_app_secret: process.env.Instagram_app_secret || process.env.INSTAGRAM_APP_SECRET || process.env.instagram_app_secret || process.env.meta_App_secret || process.env.META_APP_SECRET,
  INSTAGRAM_APP_SECRET: process.env.INSTAGRAM_APP_SECRET || process.env.Instagram_app_secret || process.env.instagram_app_secret || process.env.meta_App_secret || process.env.META_APP_SECRET,
  instagram_app_secret: process.env.instagram_app_secret || process.env.Instagram_app_secret || process.env.INSTAGRAM_APP_SECRET || process.env.meta_App_secret || process.env.META_APP_SECRET,

  // Facebook Login for Business Configuration ID
  Facebook_login_Configuration_ID:
    process.env.Facebook_login_Configuration_ID ||
    process.env.FACEBOOK_LOGIN_CONFIGURATION_ID ||
    process.env.facebook_login_configuration_id ||
    process.env.FACEBOOK_CONFIG_ID ||
    process.env.NEXT_PUBLIC_FACEBOOK_LOGIN_CONFIGURATION_ID ||
    process.env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID,
  FACEBOOK_LOGIN_CONFIGURATION_ID:
    process.env.FACEBOOK_LOGIN_CONFIGURATION_ID ||
    process.env.Facebook_login_Configuration_ID ||
    process.env.facebook_login_configuration_id ||
    process.env.FACEBOOK_CONFIG_ID ||
    process.env.NEXT_PUBLIC_FACEBOOK_LOGIN_CONFIGURATION_ID ||
    process.env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID,
  facebook_login_configuration_id:
    process.env.facebook_login_configuration_id ||
    process.env.Facebook_login_Configuration_ID ||
    process.env.FACEBOOK_LOGIN_CONFIGURATION_ID ||
    process.env.FACEBOOK_CONFIG_ID ||
    process.env.NEXT_PUBLIC_FACEBOOK_LOGIN_CONFIGURATION_ID ||
    process.env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID,
  FACEBOOK_CONFIG_ID:
    process.env.FACEBOOK_CONFIG_ID ||
    process.env.Facebook_login_Configuration_ID ||
    process.env.FACEBOOK_LOGIN_CONFIGURATION_ID ||
    process.env.facebook_login_configuration_id ||
    process.env.NEXT_PUBLIC_FACEBOOK_LOGIN_CONFIGURATION_ID ||
    process.env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID,
  NEXT_PUBLIC_FACEBOOK_LOGIN_CONFIGURATION_ID:
    process.env.NEXT_PUBLIC_FACEBOOK_LOGIN_CONFIGURATION_ID ||
    process.env.Facebook_login_Configuration_ID ||
    process.env.FACEBOOK_LOGIN_CONFIGURATION_ID ||
    process.env.facebook_login_configuration_id ||
    process.env.FACEBOOK_CONFIG_ID,
  NEXT_PUBLIC_FACEBOOK_CONFIG_ID:
    process.env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID ||
    process.env.Facebook_login_Configuration_ID ||
    process.env.FACEBOOK_LOGIN_CONFIGURATION_ID ||
    process.env.facebook_login_configuration_id ||
    process.env.FACEBOOK_CONFIG_ID,

  NVIDIA_API_KEY: process.env.NVIDIA_API_KEY || process.env.nVidia_AI_API_Key || process.env.NVIDIA_AI_API_KEY,
  NVIDIA_AI_API_KEY: process.env.NVIDIA_AI_API_KEY || process.env.nVidia_AI_API_Key || process.env.NVIDIA_API_KEY,
  nVidia_AI_API_Key: process.env.nVidia_AI_API_Key || process.env.NVIDIA_API_KEY || process.env.NVIDIA_AI_API_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  KNOCK_SECRET_API_KEY: process.env.KNOCK_SECRET_API_KEY,
  SUPABASE_AUTH_WEBHOOK_SECRET: process.env.SUPABASE_AUTH_WEBHOOK_SECRET,
  ADMIN: process.env.ADMIN,
});
