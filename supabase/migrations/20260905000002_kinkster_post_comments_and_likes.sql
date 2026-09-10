-- Migration: Persistent Post Comments and Likes for Kinkster Feed
CREATE TABLE IF NOT EXISTS public.kinkster_post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.kinkster_posts(id) ON DELETE CASCADE,
    kinkster_id UUID NOT NULL REFERENCES public.kinkster_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kinkster_post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.kinkster_posts(id) ON DELETE CASCADE,
    kinkster_id UUID NOT NULL REFERENCES public.kinkster_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, kinkster_id)
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.kinkster_post_comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.kinkster_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_kinkster ON public.kinkster_post_likes(kinkster_id);

ALTER TABLE public.kinkster_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinkster_post_likes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_post_comments' AND policyname = 'Allow public read for post comments') THEN
    DROP POLICY IF EXISTS "Allow public read for post comments" ON public.kinkster_post_comments;
    CREATE POLICY "Allow public read for post comments" ON public.kinkster_post_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_post_comments' AND policyname = 'Allow authenticated insert post comments') THEN
    DROP POLICY IF EXISTS "Allow authenticated insert post comments" ON public.kinkster_post_comments;
    CREATE POLICY "Allow authenticated insert post comments" ON public.kinkster_post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = kinkster_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_post_likes' AND policyname = 'Allow public read for post likes') THEN
    DROP POLICY IF EXISTS "Allow public read for post likes" ON public.kinkster_post_likes;
    CREATE POLICY "Allow public read for post likes" ON public.kinkster_post_likes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_post_likes' AND policyname = 'Allow authenticated manage post likes') THEN
    DROP POLICY IF EXISTS "Allow authenticated manage post likes" ON public.kinkster_post_likes;
    CREATE POLICY "Allow authenticated manage post likes" ON public.kinkster_post_likes FOR ALL TO authenticated USING (auth.uid() = kinkster_id);
  END IF;
END $$;
