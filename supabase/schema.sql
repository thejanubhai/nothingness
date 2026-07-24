-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enums
CREATE TYPE conversation_status AS ENUM ('open', 'closed', 'snoozed');
CREATE TYPE sender_type AS ENUM ('user', 'agent', 'ai');
CREATE TYPE booking_status AS ENUM ('confirmed', 'blocked', 'cancelled');
CREATE TYPE booking_platform AS ENUM ('direct', 'airbnb', 'booking.com');

-- 1. conversations
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    status conversation_status NOT NULL DEFAULT 'open',
    human_override BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. messages
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_type sender_type NOT NULL,
    content TEXT NOT NULL,
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. listings
CREATE TABLE public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    default_price NUMERIC NOT NULL
);

-- 4. bookings
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    platform booking_platform NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    status booking_status NOT NULL DEFAULT 'confirmed',
    external_ical_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. ai_settings
CREATE TABLE public.ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    active_prompt TEXT NOT NULL,
    temperature NUMERIC NOT NULL DEFAULT 0.7,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default AI settings row
INSERT INTO public.ai_settings (active_prompt, temperature) 
VALUES ('You are an AI concierge for Nothingness. Be helpful and polite.', 0.7);

-- 6. ai_knowledge_base
CREATE TABLE public.ai_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    ideal_response TEXT NOT NULL,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Disable RLS (Internal server access only based on requirements)
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_knowledge_base DISABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_bookings_listing_id ON public.bookings(listing_id);
CREATE INDEX idx_bookings_external_ical_id ON public.bookings(external_ical_id);
CREATE INDEX idx_knowledge_embedding ON public.ai_knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RPC for vector similarity search
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  query text,
  ideal_response text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.query,
    k.ideal_response,
    1 - (k.embedding <=> query_embedding) AS similarity
  FROM public.ai_knowledge_base k
  WHERE 1 - (k.embedding <=> query_embedding) > match_threshold
  ORDER BY k.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
