-- Add Action Pricing & PayU OAuth columns to platform_settings
ALTER TABLE IF EXISTS platform_settings
ADD COLUMN IF NOT EXISTS fee_id_verification NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS fee_kinkster_activation NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS fee_partner_onboarding NUMERIC DEFAULT 300000,
ADD COLUMN IF NOT EXISTS payu_client_id TEXT,
ADD COLUMN IF NOT EXISTS payu_client_secret TEXT;

-- Create action_fee_orders table to track real-time payments for user actions
CREATE TABLE IF NOT EXISTS action_fee_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'id_verification' | 'kinkster_activation' | 'partner_onboarding'
  amount NUMERIC NOT NULL,
  payment_order_id TEXT UNIQUE NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid' | 'failed'
  payment_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup on callback and status verification
CREATE INDEX IF NOT EXISTS idx_action_fee_orders_order_id ON action_fee_orders(payment_order_id);
CREATE INDEX IF NOT EXISTS idx_action_fee_orders_user_action ON action_fee_orders(user_id, action_type);
