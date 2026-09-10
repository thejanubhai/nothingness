-- Expand platform_settings table
ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS default_check_in_time TEXT DEFAULT '14:00',
ADD COLUMN IF NOT EXISTS default_check_out_time TEXT DEFAULT '11:00',
ADD COLUMN IF NOT EXISTS min_advance_booking_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_advance_booking_days INTEGER DEFAULT 180,
ADD COLUMN IF NOT EXISTS cancellation_policy_text TEXT,
ADD COLUMN IF NOT EXISTS base_tax_rate_percent NUMERIC DEFAULT 18.0,
ADD COLUMN IF NOT EXISTS default_security_deposit NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_system_prompt TEXT DEFAULT 'You are a helpful and professional AI assistant for Nothingness. Answer guest inquiries accurately and concisely based on the listing information. Ensure all check-in and check-out rules are strictly communicated.',
ADD COLUMN IF NOT EXISTS frontend_banner_text TEXT,
ADD COLUMN IF NOT EXISTS frontend_banner_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_api_key TEXT,
ADD COLUMN IF NOT EXISTS cashfree_app_id TEXT,
ADD COLUMN IF NOT EXISTS cashfree_secret_key TEXT,
ADD COLUMN IF NOT EXISTS resend_api_key TEXT,
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
