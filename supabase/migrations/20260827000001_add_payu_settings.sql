-- Add PayU configuration columns to platform_settings
ALTER TABLE IF EXISTS platform_settings
ADD COLUMN IF NOT EXISTS payu_key TEXT,
ADD COLUMN IF NOT EXISTS payu_salt TEXT,
ADD COLUMN IF NOT EXISTS payu_env TEXT DEFAULT 'PRODUCTION';
