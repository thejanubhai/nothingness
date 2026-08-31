-- Migration: Add Cloudinary Media Assets Tracking
-- Created: 2026-08-28

CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT NOT NULL UNIQUE,
  secure_url TEXT NOT NULL,
  original_filename TEXT,
  format TEXT,
  resource_type TEXT DEFAULT 'image',
  bytes BIGINT,
  width INTEGER,
  height INTEGER,
  folder TEXT,
  entity_type TEXT, -- e.g. 'space', 'journal', 'guest_id', 'site'
  entity_id TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indices for fast lookups
CREATE INDEX IF NOT EXISTS idx_media_assets_public_id ON public.media_assets(public_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_entity ON public.media_assets(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_folder ON public.media_assets(folder);

-- Enable RLS
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Allow public read access to media metadata for active resources
CREATE POLICY "Public read media assets"
  ON public.media_assets
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert/update their media
CREATE POLICY "Authenticated users manage media"
  ON public.media_assets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Service role full access media"
  ON public.media_assets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
