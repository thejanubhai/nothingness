-- Migration: Unified Groups, Events & Messaging Architecture
-- Connects Groups as persistent communities, links sanctuary_events and kinkster_posts to groups,
-- and configures row level security and initial community seed data.

-- 1. Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,
    slug VARCHAR(128) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    rules TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    category VARCHAR(64) DEFAULT 'general',
    visibility VARCHAR(32) CHECK (visibility IN ('public', 'private', 'invite_only', 'approval_required')) DEFAULT 'public',
    owner_id UUID NOT NULL REFERENCES public.kinkster_profiles(id) ON DELETE CASCADE,
    moderation_state VARCHAR(32) CHECK (moderation_state IN ('active', 'pending', 'suspended')) DEFAULT 'active',
    members_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_slug ON public.groups(slug);
CREATE INDEX IF NOT EXISTS idx_groups_category ON public.groups(category);
CREATE INDEX IF NOT EXISTS idx_groups_visibility ON public.groups(visibility);
CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON public.groups(owner_id);

-- 2. Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    kinkster_id UUID NOT NULL REFERENCES public.kinkster_profiles(id) ON DELETE CASCADE,
    role VARCHAR(32) CHECK (role IN ('owner', 'admin', 'moderator', 'member')) DEFAULT 'member',
    status VARCHAR(32) CHECK (status IN ('active', 'pending', 'banned')) DEFAULT 'active',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, kinkster_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_kinkster_id ON public.group_members(kinkster_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON public.group_members(status);

-- 3. Add group_id to sanctuary_events (Canonical Events Table)
ALTER TABLE public.sanctuary_events 
    ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sanctuary_events_group_id ON public.sanctuary_events(group_id);

-- 4. Add group_id to kinkster_posts
ALTER TABLE public.kinkster_posts 
    ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_kinkster_posts_group_id ON public.kinkster_posts(group_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for groups
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Public read active public groups') THEN
        CREATE POLICY "Public read active public groups" ON public.groups
            FOR SELECT TO authenticated
            USING (
                (visibility = 'public' AND moderation_state = 'active')
                OR owner_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.group_members 
                    WHERE group_members.group_id = groups.id 
                    AND group_members.kinkster_id = auth.uid()
                    AND group_members.status = 'active'
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Activated profiles can create groups') THEN
        CREATE POLICY "Activated profiles can create groups" ON public.groups
            FOR INSERT TO authenticated
            WITH CHECK (
                auth.uid() = owner_id
                AND EXISTS (
                    SELECT 1 FROM public.kinkster_profiles 
                    WHERE id = auth.uid() AND is_activated = true
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Owners and admins can update groups') THEN
        CREATE POLICY "Owners and admins can update groups" ON public.groups
            FOR UPDATE TO authenticated
            USING (
                owner_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.group_members 
                    WHERE group_members.group_id = groups.id 
                    AND group_members.kinkster_id = auth.uid()
                    AND group_members.role IN ('owner', 'admin')
                    AND group_members.status = 'active'
                )
            );
    END IF;
END $$;

-- 7. RLS Policies for group_members
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'group_members' AND policyname = 'View members of accessible groups') THEN
        CREATE POLICY "View members of accessible groups" ON public.group_members
            FOR SELECT TO authenticated
            USING (
                kinkster_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.groups 
                    WHERE groups.id = group_members.group_id 
                    AND (
                        groups.visibility = 'public'
                        OR groups.owner_id = auth.uid()
                        OR EXISTS (
                            SELECT 1 FROM public.group_members gm 
                            WHERE gm.group_id = groups.id 
                            AND gm.kinkster_id = auth.uid() 
                            AND gm.status = 'active'
                        )
                    )
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'group_members' AND policyname = 'Members can join groups') THEN
        CREATE POLICY "Members can join groups" ON public.group_members
            FOR INSERT TO authenticated
            WITH CHECK (
                kinkster_id = auth.uid()
                AND EXISTS (
                    SELECT 1 FROM public.kinkster_profiles 
                    WHERE id = auth.uid() AND is_activated = true
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'group_members' AND policyname = 'Members can leave or admins manage') THEN
        CREATE POLICY "Members can leave or admins manage" ON public.group_members
            FOR DELETE TO authenticated
            USING (
                kinkster_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.groups 
                    WHERE groups.id = group_members.group_id 
                    AND groups.owner_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM public.group_members gm 
                    WHERE gm.group_id = group_members.group_id 
                    AND gm.kinkster_id = auth.uid() 
                    AND gm.role IN ('owner', 'admin')
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'group_members' AND policyname = 'Admins can update membership') THEN
        CREATE POLICY "Admins can update membership" ON public.group_members
            FOR UPDATE TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.groups 
                    WHERE groups.id = group_members.group_id 
                    AND groups.owner_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM public.group_members gm 
                    WHERE gm.group_id = group_members.group_id 
                    AND gm.kinkster_id = auth.uid() 
                    AND gm.role IN ('owner', 'admin')
                )
            );
    END IF;
END $$;

-- 8. Seed Initial Communities (using first available kinkster_profile if present)
DO $$
DECLARE
    v_creator_id UUID;
    v_group_shibari UUID;
    v_group_noir UUID;
    v_group_sensory UUID;
    v_group_intimates UUID;
BEGIN
    SELECT id INTO v_creator_id FROM public.kinkster_profiles LIMIT 1;

    IF v_creator_id IS NOT NULL THEN
        -- Seed Group 1: Shibari & Kinetic Aesthetics
        INSERT INTO public.groups (name, slug, description, rules, category, visibility, owner_id, cover_url, avatar_url, members_count)
        VALUES (
            'Shibari & Kinetic Aesthetics',
            'shibari-aesthetics',
            'Dedicated to the mindful discipline of Japanese rope bondage, tension dynamics, and emotional somatic suspension.',
            'Consensual touch only. Prioritize physical safety and continuous nerve checks. Absolute discretion required.',
            'Shibari & Rope',
            'public',
            v_creator_id,
            'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400',
            1
        )
        ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
        RETURNING id INTO v_group_shibari;

        INSERT INTO public.group_members (group_id, kinkster_id, role, status)
        VALUES (v_group_shibari, v_creator_id, 'owner', 'active')
        ON CONFLICT (group_id, kinkster_id) DO NOTHING;

        -- Seed Group 2: Noir Masquerade Society
        INSERT INTO public.groups (name, slug, description, rules, category, visibility, owner_id, cover_url, avatar_url, members_count)
        VALUES (
            'Noir Masquerade Society',
            'noir-masquerade',
            'Curated midnight salons, velvet masks, darkwave ambient vinyl, and anonymous dialogue in Delhi penthouses.',
            'Masks compulsory until midnight chime. Photography and recording strictly prohibited.',
            'Noir & Aesthetics',
            'public',
            v_creator_id,
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
            1
        )
        ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
        RETURNING id INTO v_group_noir;

        INSERT INTO public.group_members (group_id, kinkster_id, role, status)
        VALUES (v_group_noir, v_creator_id, 'owner', 'active')
        ON CONFLICT (group_id, kinkster_id) DO NOTHING;

        -- Seed Group 3: Sensory & Mindfulness Salon
        INSERT INTO public.groups (name, slug, description, rules, category, visibility, owner_id, cover_url, avatar_url, members_count)
        VALUES (
            'Sensory & Mindfulness Salon',
            'sensory-mindfulness',
            'Exploration of sensory deprivation, blindfold rituals, temperature play, and dedicated grounding aftercare.',
            'Mindful pacing. Sober presence required during active sensory immersion.',
            'Sensory & Mindful',
            'public',
            v_creator_id,
            'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
            1
        )
        ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
        RETURNING id INTO v_group_sensory;

        INSERT INTO public.group_members (group_id, kinkster_id, role, status)
        VALUES (v_group_sensory, v_creator_id, 'owner', 'active')
        ON CONFLICT (group_id, kinkster_id) DO NOTHING;

        -- Seed Group 4: South Delhi Intimates
        INSERT INTO public.groups (name, slug, description, rules, category, visibility, owner_id, cover_url, avatar_url, members_count)
        VALUES (
            'South Delhi Intimates',
            'south-delhi-intimates',
            'Private munches, secret coffee meetups, and curated co-stay coordination across South Delhi sanctuaries.',
            'Vetted members only. Respect anonymity inside and outside the sanctuary network.',
            'Social & Salons',
            'approval_required',
            v_creator_id,
            'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
            1
        )
        ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
        RETURNING id INTO v_group_intimates;

        INSERT INTO public.group_members (group_id, kinkster_id, role, status)
        VALUES (v_group_intimates, v_creator_id, 'owner', 'active')
        ON CONFLICT (group_id, kinkster_id) DO NOTHING;

        -- Link initial sanctuary_events to groups where matching
        UPDATE public.sanctuary_events 
        SET group_id = v_group_noir 
        WHERE tier = 'soiree' AND group_id IS NULL;

        UPDATE public.sanctuary_events 
        SET group_id = v_group_shibari 
        WHERE tier = 'munch' AND group_id IS NULL;

        UPDATE public.sanctuary_events 
        SET group_id = v_group_sensory 
        WHERE tier = 'rave' AND group_id IS NULL;

        -- Link initial kinkster_posts to groups if any
        UPDATE public.kinkster_posts
        SET group_id = v_group_noir
        WHERE group_id IS NULL;
    END IF;
END $$;
