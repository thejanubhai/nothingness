-- Phase 1: Supabase PostgreSQL Schema

-- 1. conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL, -- whatsapp, instagram, etc.
    customer_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', -- open, closed, snoozed
    human_override BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Disable RLS for internal server access
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;

-- 2. messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL, -- user, agent, ai
    content TEXT,
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- 3. listings
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    default_price NUMERIC
);

ALTER TABLE public.listings DISABLE ROW LEVEL SECURITY;

-- 4. bookings
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    platform TEXT DEFAULT 'direct', -- direct, airbnb, booking.com
    check_in DATE,
    check_out DATE,
    status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed, blocked, cancelled
    external_ical_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure listing_id and omnichannel columns exist if bookings was created in an earlier migration
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'direct',
    ADD COLUMN IF NOT EXISTS external_ical_id TEXT;

ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- Create an index on listing_id and dates for faster queries
CREATE INDEX IF NOT EXISTS bookings_listing_id_idx ON public.bookings(listing_id);
CREATE INDEX IF NOT EXISTS bookings_dates_idx ON public.bookings(check_in, check_out);
