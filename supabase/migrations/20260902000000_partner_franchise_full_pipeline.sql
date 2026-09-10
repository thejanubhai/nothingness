-- Migration: Partner & Franchise Pipeline Enhancements
-- Adds support for full onboarding lifecycle, admin verification, and franchise lead management

-- 1. Ensure franchise_leads table has all necessary columns
CREATE TABLE IF NOT EXISTS public.franchise_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    property_location TEXT,
    investment_budget TEXT,
    message TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure partner_profiles table has all necessary fields
CREATE TABLE IF NOT EXISTS public.partner_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'contract_pending', 'affidavit_pending', 'under_review', 'active', 'rejected')),
    setup_fee_paid BOOLEAN DEFAULT FALSE,
    setup_fee_tx_id TEXT,
    contract_signed BOOLEAN DEFAULT FALSE,
    contract_signed_at TIMESTAMPTZ,
    contract_city TEXT,
    affidavit_uploaded BOOLEAN DEFAULT FALSE,
    affidavit_url TEXT,
    affidavit_notes TEXT,
    verified_by_admin BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    payout_frequency VARCHAR(16) DEFAULT 'monthly' CHECK (payout_frequency IN ('monthly', 'quarterly', 'yearly')),
    bank_name TEXT,
    bank_account_number TEXT,
    bank_ifsc TEXT,
    bank_account_name TEXT,
    upi_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. Ensure partner_properties table
CREATE TABLE IF NOT EXISTS public.partner_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    state TEXT NOT NULL,
    city TEXT NOT NULL,
    locality TEXT NOT NULL,
    carpet_area TEXT,
    space_tier VARCHAR(16) DEFAULT 'luxury' CHECK (space_tier IN ('budget', 'luxury')),
    ownership_confirmed BOOLEAN DEFAULT TRUE,
    lounge_eligible BOOLEAN DEFAULT FALSE,
    lounge_type VARCHAR(32) DEFAULT 'terrace' CHECK (lounge_type IN ('terrace', 'basement', 'open_space', 'nearby_suite', 'none')),
    housekeeping_status VARCHAR(32) DEFAULT 'ready' CHECK (housekeeping_status IN ('ready', 'turnover_in_progress', 'inspection_pending', 'maintenance')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.franchise_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if need replacement
DROP POLICY IF EXISTS "Public insert franchise_leads" ON public.franchise_leads;
DROP POLICY IF EXISTS "Service role read franchise_leads" ON public.franchise_leads;
DROP POLICY IF EXISTS "Service role all partner_profiles" ON public.partner_profiles;
DROP POLICY IF EXISTS "Service role all partner_properties" ON public.partner_properties;

-- Franchise leads policies
DROP POLICY IF EXISTS "Public insert franchise_leads" ON public.franchise_leads;
DROP POLICY IF EXISTS "Service role read franchise_leads" ON public.franchise_leads;
CREATE POLICY "Public insert franchise_leads" ON public.franchise_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role read franchise_leads" ON public.franchise_leads FOR ALL USING (true);

-- Partner profiles policies
DROP POLICY IF EXISTS "Users can view own partner profile" ON public.partner_profiles;
DROP POLICY IF EXISTS "Users can insert own partner profile" ON public.partner_profiles;
DROP POLICY IF EXISTS "Users can update own partner profile" ON public.partner_profiles;
CREATE POLICY "Users can view own partner profile" ON public.partner_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own partner profile" ON public.partner_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own partner profile" ON public.partner_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Partner properties policies
DROP POLICY IF EXISTS "Partners can view own properties" ON public.partner_properties;
DROP POLICY IF EXISTS "Partners can insert own properties" ON public.partner_properties;
DROP POLICY IF EXISTS "Partners can update own properties" ON public.partner_properties;
CREATE POLICY "Partners can view own properties" ON public.partner_properties FOR SELECT TO authenticated USING (
    partner_id IN (SELECT id FROM public.partner_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Partners can insert own properties" ON public.partner_properties FOR INSERT TO authenticated WITH CHECK (
    partner_id IN (SELECT id FROM public.partner_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Partners can update own properties" ON public.partner_properties FOR UPDATE TO authenticated USING (
    partner_id IN (SELECT id FROM public.partner_profiles WHERE user_id = auth.uid())
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_franchise_leads_status ON public.franchise_leads(status);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_user_id ON public.partner_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_status ON public.partner_profiles(status);
CREATE INDEX IF NOT EXISTS idx_partner_properties_partner_id ON public.partner_properties(partner_id);
