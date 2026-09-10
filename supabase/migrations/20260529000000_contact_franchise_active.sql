-- Update properties to be active
UPDATE public.properties SET active = true;

-- Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'unread',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Franchise Leads Table
CREATE TABLE IF NOT EXISTS public.franchise_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  property_location text,
  investment_budget text,
  message text,
  status text DEFAULT 'new',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchise_leads ENABLE ROW LEVEL SECURITY;

-- Contact Messages Policies
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON contact_messages;
DROP POLICY IF EXISTS "Enable insert for anonymous users on contact_messages" ON public.contact_messages;
CREATE POLICY "Enable insert for anonymous users on contact_messages" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read for service role" ON contact_messages;
DROP POLICY IF EXISTS "Enable read for service role on contact_messages" ON public.contact_messages;
CREATE POLICY "Enable read for service role on contact_messages" ON public.contact_messages
  FOR SELECT USING (true);

-- Franchise Leads Policies
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON franchise_leads;
DROP POLICY IF EXISTS "Enable insert for anonymous users on franchise_leads" ON public.franchise_leads;
CREATE POLICY "Enable insert for anonymous users on franchise_leads" ON public.franchise_leads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read for service role" ON franchise_leads;
DROP POLICY IF EXISTS "Enable read for service role on franchise_leads" ON public.franchise_leads;
CREATE POLICY "Enable read for service role on franchise_leads" ON public.franchise_leads
  FOR SELECT USING (true);
