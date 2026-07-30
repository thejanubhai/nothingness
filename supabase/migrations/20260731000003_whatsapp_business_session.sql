-- Table to store local WhatsApp Business QR Connection status & session details
CREATE TABLE IF NOT EXISTS public.whatsapp_business_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT,
  device_name TEXT DEFAULT 'Business Phone',
  status TEXT DEFAULT 'disconnected', -- 'disconnected', 'pairing', 'connected'
  qr_code_data TEXT,
  last_connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default single business session record
INSERT INTO public.whatsapp_business_sessions (id, status, device_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'disconnected', 'Nothingness Business WhatsApp')
ON CONFLICT (id) DO NOTHING;
