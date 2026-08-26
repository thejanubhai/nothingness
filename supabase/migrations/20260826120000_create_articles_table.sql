-- Migration: Create Articles / Blog Table for Pan-India SEO & Editorial Engine
-- Created: 2026-08-26

CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Hospitality & Culture',
    tags TEXT[] NOT NULL DEFAULT '{}',
    author_name TEXT NOT NULL DEFAULT 'Nothingness Editorial',
    author_role TEXT NOT NULL DEFAULT 'Hospitality & Culture Curator',
    author_avatar TEXT DEFAULT '/images/logo.png',
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
    featured BOOLEAN NOT NULL DEFAULT false,
    reading_time_minutes INTEGER NOT NULL DEFAULT 5,
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT[] DEFAULT '{}',
    view_count INTEGER NOT NULL DEFAULT 0,
    canonical_url TEXT
);

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published articles
DROP POLICY IF EXISTS "Public can view published articles" ON public.articles;
CREATE POLICY "Public can view published articles"
    ON public.articles
    FOR SELECT
    USING (status = 'published');

-- Allow authenticated users / service role full access
DROP POLICY IF EXISTS "Admins have full access to articles" ON public.articles;
CREATE POLICY "Admins have full access to articles"
    ON public.articles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status_published_at ON public.articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON public.articles(featured);
