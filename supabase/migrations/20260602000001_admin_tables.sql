-- Create messages table for Omnichannel Inbox
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  guest_profile_id UUID REFERENCES guest_profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL, -- 'whatsapp', 'email', 'sms', 'web'
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  content TEXT NOT NULL,
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_by_admin BOOLEAN DEFAULT FALSE
);

-- Create chatflows table for auto-responders
CREATE TABLE IF NOT EXISTS chatflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL, -- 'booking_confirmed', 'check_in', 'keyword'
  trigger_keyword TEXT, -- If trigger_event is 'keyword'
  response_template TEXT NOT NULL,
  channel TEXT DEFAULT 'whatsapp',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create financials/payments table? We already have bookings storing total_price and payment_status.
-- Let's just create indexes for faster queries in admin panel
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_guest_profile_id ON messages(guest_profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Enable RLS (Assuming admins bypass RLS via service role key, but let's add basic policies if needed)
-- For now, if we access via service role in server actions, RLS policies are bypassed.
-- But if we query from client components with anon key, we'd need policies.
-- In our admin routes, we usually do `createClient` and get the user's session.
-- If the user is an admin, we can check their role, but currently the project just checks email on the server.
-- So we can just leave RLS enabled with a policy that allows admins.

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow admins to read messages" ON messages;
CREATE POLICY "Allow admins to read messages" ON messages
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR auth.jwt() ->> 'email' LIKE '%admin%');

DROP POLICY IF EXISTS "Allow admins to insert messages" ON messages;
CREATE POLICY "Allow admins to insert messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR auth.jwt() ->> 'email' LIKE '%admin%');

DROP POLICY IF EXISTS "Allow admins to read chatflows" ON chatflows;
CREATE POLICY "Allow admins to read chatflows" ON chatflows
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR auth.jwt() ->> 'email' LIKE '%admin%');
