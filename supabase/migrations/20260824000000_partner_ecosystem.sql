-- Migration: Comprehensive Partner Ecosystem
-- Includes Partner Onboarding, ₹3L Setup, Legal MoU Contract, NOC Affidavit Verification,
-- 70/30 Financials & Payout Preferences, Hyperlocal Inventory & Gated Lounge Access

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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.partner_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.partner_properties(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category VARCHAR(32) DEFAULT 'amenities' CHECK (category IN ('linens', 'amenities', 'consumables', 'hardware')),
    current_stock INTEGER DEFAULT 10,
    min_threshold INTEGER DEFAULT 3,
    vendor_name TEXT,
    vendor_phone TEXT,
    last_refill_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lounge_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_property_id UUID REFERENCES public.partner_properties(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL,
    past_stays_count INTEGER DEFAULT 1,
    verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Configuration
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lounge_access_logs ENABLE ROW LEVEL SECURITY;

-- Policies for partner_profiles
CREATE POLICY "Users can view own partner profile" ON public.partner_profiles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own partner profile" ON public.partner_profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own partner profile" ON public.partner_profiles
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Policies for partner_properties
CREATE POLICY "Partners can view own properties" ON public.partner_properties
    FOR SELECT TO authenticated USING (
        partner_id IN (SELECT id FROM public.partner_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Partners can insert own properties" ON public.partner_properties
    FOR INSERT TO authenticated WITH CHECK (
        partner_id IN (SELECT id FROM public.partner_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Partners can update own properties" ON public.partner_properties
    FOR UPDATE TO authenticated USING (
        partner_id IN (SELECT id FROM public.partner_profiles WHERE user_id = auth.uid())
    );

-- Policies for partner_inventory
CREATE POLICY "Partners can manage own inventory" ON public.partner_inventory
    FOR ALL TO authenticated USING (
        property_id IN (
            SELECT p.id FROM public.partner_properties p
            JOIN public.partner_profiles pp ON p.partner_id = pp.id
            WHERE pp.user_id = auth.uid()
        )
    );

-- Policies for lounge_access_logs
CREATE POLICY "Partners can view lounge logs" ON public.lounge_access_logs
    FOR ALL TO authenticated USING (true);
