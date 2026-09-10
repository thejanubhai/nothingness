-- Migration: 20260911010000_canonical_kinkster_taxonomy_and_location_engine.sql
-- Establishes the authoritative 50-community Kinkster taxonomy,
-- invisible location-relevance schema, and multi-topic relationships
-- while preserving all legacy groups, posts, events, and user data.

-- 1. Extend public.groups for canonical platform taxonomy
ALTER TABLE public.groups 
    ADD COLUMN IF NOT EXISTS is_canonical BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;

-- Allow owner_id to be NULL for platform-owned canonical communities
ALTER TABLE public.groups ALTER COLUMN owner_id DROP NOT NULL;

-- 2. Add coarse location relevance columns to kinkster_posts
ALTER TABLE public.kinkster_posts 
    ADD COLUMN IF NOT EXISTS city VARCHAR(64),
    ADD COLUMN IF NOT EXISTS region VARCHAR(64),
    ADD COLUMN IF NOT EXISTS country VARCHAR(64) DEFAULT 'India';

-- 3. Add user discovery location preferences to kinkster_profiles
ALTER TABLE public.kinkster_profiles 
    ADD COLUMN IF NOT EXISTS discovery_location_city VARCHAR(64),
    ADD COLUMN IF NOT EXISTS discovery_location_region VARCHAR(64),
    ADD COLUMN IF NOT EXISTS discovery_location_country VARCHAR(64) DEFAULT 'India',
    ADD COLUMN IF NOT EXISTS discovery_location_enabled BOOLEAN DEFAULT TRUE;

-- 4. Multi-Topic Junction Tables (Non-destructive, backward-compatible)
CREATE TABLE IF NOT EXISTS public.post_topics (
    post_id UUID NOT NULL REFERENCES public.kinkster_posts(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, group_id)
);

CREATE TABLE IF NOT EXISTS public.event_topics (
    event_id UUID NOT NULL REFERENCES public.sanctuary_events(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (event_id, group_id)
);

-- Indexes for lightning fast location & topic lookups
CREATE INDEX IF NOT EXISTS idx_groups_canonical ON public.groups(is_canonical, display_order);
CREATE INDEX IF NOT EXISTS idx_groups_slug_canonical ON public.groups(slug, is_canonical);
CREATE INDEX IF NOT EXISTS idx_kinkster_posts_location ON public.kinkster_posts(city, region, country);
CREATE INDEX IF NOT EXISTS idx_post_topics_group ON public.post_topics(group_id);
CREATE INDEX IF NOT EXISTS idx_event_topics_group ON public.event_topics(group_id);

-- 5. Enable RLS on junction tables
ALTER TABLE public.post_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_topics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_topics' AND policyname = 'Allow public read for post_topics') THEN
        DROP POLICY IF EXISTS "Allow public read for post_topics" ON public.post_topics;
        CREATE POLICY "Allow public read for post_topics" ON public.post_topics FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_topics' AND policyname = 'Allow post owner manage post_topics') THEN
        DROP POLICY IF EXISTS "Allow post owner manage post_topics" ON public.post_topics;
        CREATE POLICY "Allow post owner manage post_topics" ON public.post_topics FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM public.kinkster_posts WHERE id = post_topics.post_id AND kinkster_id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_topics' AND policyname = 'Allow public read for event_topics') THEN
        DROP POLICY IF EXISTS "Allow public read for event_topics" ON public.event_topics;
        CREATE POLICY "Allow public read for event_topics" ON public.event_topics FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- Update RLS for public.groups to explicitly allow public read of canonical groups
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read active public groups" ON public.groups;
    CREATE POLICY "Public read active public groups" ON public.groups
        FOR SELECT TO authenticated
        USING (
            (is_canonical = true AND moderation_state = 'active')
            OR (visibility = 'public' AND moderation_state = 'active')
            OR owner_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.group_members 
                WHERE group_members.group_id = groups.id 
                AND group_members.kinkster_id = auth.uid()
                AND group_members.status = 'active'
            )
        );
END $$;

-- 6. Seed Authoritative 50 Canonical Kinkster Communities into public.groups
INSERT INTO public.groups (id, name, slug, description, rules, category, visibility, is_canonical, display_order, moderation_state, avatar_url, cover_url) VALUES
('10000000-0000-4000-8000-000000000001', 'Dominance', 'dominance', 'Ecosystem dedicated to sovereign leadership, psychological authority, protocols, and conscious restraint dynamics.', 'Mutual consent and active communication compulsory.', 'Dynamics', 'public', true, 1, 'active', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000002', 'Submission', 'submission', 'Devoted to the mindful art of release, deep surrender, vulnerability, trust, and structured protocols.', 'Sovereign safety words honored unconditionally.', 'Dynamics', 'public', true, 2, 'active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000003', 'Role Play', 'role-play', 'Immersive character exploration, fantasy scenarios, and narrative escapism within confidential settings.', 'Maintain character boundaries and explicit out-of-character cues.', 'Fantasy & Play', 'public', true, 3, 'active', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000004', 'BDSM', 'bdsm', 'Foundational discipline bridging Bondage, Discipline, Dominance, Submission, Sadism, and Masochism.', 'SSC & RACK principles govern all shared spaces.', 'Core Practices', 'public', true, 4, 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000005', 'Bondage', 'bondage', 'The practice of consensual physical restraint using soft silks, leather cuffs, ties, and structured holds.', 'Prioritize physical safety and continuous circulation checks.', 'Physical Restraint', 'public', true, 5, 'active', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000006', 'Dirty Talk', 'dirty-talk', 'Erotic verbalization, sultry vocal guidance, praise, instruction, and psychological arousal through speech.', 'Respect comfort thresholds and vocal consent.', 'Sensory & Voice', 'public', true, 6, 'active', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000007', 'Praise Kink', 'praise-kink', 'Sensory and emotional arousal derived from genuine verbal validation, reassurance, compliments, and admiration.', 'Affirmation and mindful encouragement required.', 'Emotional & Erotic', 'public', true, 7, 'active', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000008', 'Voyeurism', 'voyeurism', 'The aesthetic appreciation of observing consensual intimacy, aesthetic play, and erotic beauty.', 'Strictly consensual viewing with full participant awareness.', 'Observation & Gaze', 'public', true, 8, 'active', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000009', 'Exhibitionism', 'exhibitionism', 'Sensory thrill and creative self-expression found in being admired and observed within private spaces.', 'Confidential sanctuary environments only.', 'Observation & Gaze', 'public', true, 9, 'active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000010', 'Threesome', 'threesome', 'Triadic intimacy, group chemistry, balanced attention, and consensual multi-partner explorations.', 'Equal consideration and open dialogue for all three participants.', 'Group & Multi-Partner', 'public', true, 10, 'active', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000011', 'Handcuffs', 'handcuffs', 'Exploration of metal, hinged, and leather wrist and ankle restraints in structured power dynamics.', 'Key must always be immediately accessible on site.', 'Physical Restraint', 'public', true, 11, 'active', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000012', 'Blindfolds', 'blindfolds', 'Sensory deprivation through darkness, heightening tactile sensitivity, anticipation, and auditory focus.', 'Ensure clear vocal presence and gentle touch calibration.', 'Sensory', 'public', true, 12, 'active', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000013', 'Spanking', 'spanking', 'Rhythmic tactile impact and erotic stinging sensations across fleshy targets, from light taps to deep warmth.', 'Consent check before increasing intensity.', 'Impact Play', 'public', true, 13, 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000014', 'Seduction', 'seduction', 'The delicate tension of slow arousal, teasing glances, subtle touch, and aesthetic allure.', 'Unrushed cadence and sophisticated ambiance.', 'Intimacy & Romance', 'public', true, 14, 'active', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000015', 'Sensory Deprivation', 'sensory-deprivation', 'Isolating vision, hearing, or movement to create deep trance states, heightened somatic awareness, and surrender.', 'Continuous observation and grounding touch required.', 'Sensory', 'public', true, 15, 'active', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000016', 'Foot Fetish', 'foot-fetish', 'Appreciation, massage, worship, and erotic focus centered on feet, soles, arches, and footwear.', 'Cleanliness and mutual enjoyment prioritized.', 'Fetish & Body', 'public', true, 16, 'active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000017', 'Age Gap Play', 'age-gap-play', 'Consensual adult dynamic exploring maturity differentials, mentorship, guidance, and generational chemistry.', 'All participants must be verified legal adults.', 'Dynamics', 'public', true, 17, 'active', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000018', 'Cuckolding', 'cuckolding', 'Consensual erotic dynamic where a partner observes or encourages their significant other with another lover.', 'Absolute transparency and zero non-consensual deception.', 'Relationship Dynamics', 'public', true, 18, 'active', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000019', 'Primal Play', 'primal-play', 'Instinctive, animalistic energy exchanges involving chasing, wrestling, growling, and uninhibited physical connection.', 'Maintain somatic boundary safety and padded flooring.', 'Energy & Raw Play', 'public', true, 19, 'active', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000020', 'Overstimulation', 'overstimulation', 'Sensory flooding through continuous tactile input, prolonged pleasure, and sustained physical sensitivity.', 'Listen attentively to non-verbal cues and aftercare readiness.', 'Sensory & Climax', 'public', true, 20, 'active', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000021', 'Orgasm Control', 'orgasm-control', 'The intentional pacing, delay, denial, or command over release governed by a dominant partner.', 'Trust and clear communication on stamina limits.', 'Control & Surrender', 'public', true, 21, 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000022', 'Edging', 'edging', 'The practice of bringing a partner repeatedly to the brink of climax before deliberately holding back.', 'Sensory pacing and dedicated attention to partner responses.', 'Control & Surrender', 'public', true, 22, 'active', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000023', 'Biting', 'biting', 'Erotic oral sensation ranging from gentle nibbling and pressure to deeper marks of possession and intensity.', 'Respect anatomical safety; avoid carotid neck zones.', 'Tactile & Mark Making', 'public', true, 23, 'active', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000024', 'Scratching', 'scratching', 'Light or deliberate pressure with nails tracing across shoulders, back, and torso during heightened passion.', 'Skin hygiene and clear intensity calibration required.', 'Tactile & Mark Making', 'public', true, 24, 'active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000025', 'Temperature Play', 'temperature-play', 'Sensory contrast created using ice cubes, warming oils, heated stones, or cool drafts across sensitive skin.', 'Test temperatures on inner forearm before application.', 'Sensory', 'public', true, 25, 'active', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000026', 'Wax Play', 'wax-play', 'Dripping low-temperature soy or paraffin wax onto skin for thermal sensation, visual beauty, and tactile peel.', 'Use only body-safe low-temperature candles.', 'Sensory & Thermal', 'public', true, 26, 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000027', 'Degradation', 'degradation', 'Consensual verbal or situational play exploring feelings of worthlessness, filth, or objectification within safe containers.', 'Dedicated grounding and aftercare mandatory.', 'Psychological Play', 'public', true, 27, 'active', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000028', 'Humiliation', 'humiliation', 'Psychological exploration of consensual embarrassment, modesty surrender, exposure, or subservience.', 'Pre-negotiate hard limits and emotional boundaries.', 'Psychological Play', 'public', true, 28, 'active', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000029', 'Consensual Non-Consent', 'consensual-non-consent', 'Advanced roleplay exploring simulated resistance and total surrender within strictly established trust boundaries.', 'Prior written consent, established safewords, and deep aftercare required.', 'Advanced Dynamics', 'public', true, 29, 'active', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000030', 'Impact Play', 'impact-play', 'The disciplined use of floggers, paddles, crops, and hands for endorphin release and sensory grounding.', 'Never strike over kidneys, spine, or joints.', 'Impact Play', 'public', true, 30, 'active', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000031', 'Body Worship', 'body-worship', 'Reverent touch, adoration, kissing, and mindful adoration celebrating a partner''s physique from crown to sole.', 'Focus on devotion and unhurried tactile pleasure.', 'Intimacy & Devotion', 'public', true, 31, 'active', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000032', 'Uniform Role Play', 'uniform-role-play', 'Aesthetic and psychological dynamics framed around structured uniforms (suits, military, service, medical, corporate).', 'Respect aesthetic nuance and fantasy containment.', 'Fantasy & Play', 'public', true, 32, 'active', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000033', 'Teacher Student Fantasy', 'teacher-student-fantasy', 'Consensual intellectual authority scenarios, disciplinary guidance, homework rituals, and scholastic power dynamics.', 'Strictly adult roleplay between consenting adults.', 'Fantasy & Play', 'public', true, 33, 'active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000034', 'Strangers Role Play', 'strangers-role-play', 'The thrill of meeting as complete strangers in hotel lounges, private bars, or secret penthouses for anonymous intrigue.', 'Preset boundaries prior to initiating the role.', 'Fantasy & Play', 'public', true, 34, 'active', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000035', 'Boss Employee Fantasy', 'boss-employee-fantasy', 'Corporate hierarchy dynamics, late-night boardroom scenarios, performance reviews, and executive dominance.', 'Adult fantasy containment with mutual signoff.', 'Fantasy & Play', 'public', true, 35, 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000036', 'Hair Pulling', 'hair-pulling', 'Sensory tension through deliberate root grip, guiding head tilt, establishing control, and expressing passionate intensity.', 'Grip close to scalp to avoid uncomfortable sharp tugs.', 'Tactile & Mark Making', 'public', true, 36, 'active', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000037', 'Shibari Rope Bondage', 'shibari-rope-bondage', 'The ancient Japanese discipline of artistic jute rope tying, kinetic suspension, somatic mindfulness, and emotional grounding.', 'Rope shears immediately available at all times. Constant nerve & circulation checks.', 'Rope & Shibari', 'public', true, 37, 'active', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000038', 'Mirror Play', 'mirror-play', 'Visual feedback through full-length mirrors, observing mutual pleasure, posture, eye contact, and aesthetic vulnerability.', 'Private spaces with intentional mood lighting.', 'Visual & Erotic', 'public', true, 38, 'active', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000039', 'Public Sex Fantasy', 'public-sex-fantasy', 'The psychological adrenaline of risk, exhibition, and clandestine encounters within safe, controlled private sanctuaries.', 'Never expose unconsenting public; sanctuary staging only.', 'Fantasy & Play', 'public', true, 39, 'active', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000040', 'Group Sex', 'group-sex', 'Orgiastic and multi-partner intimacy celebrated among vetted peers in curated sanctuary salons.', 'All participants vetted; mutual consent continuous.', 'Group & Multi-Partner', 'public', true, 40, 'active', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000041', 'Fetish Fashion', 'fetish-fashion', 'Haute-couture aesthetics featuring patent leather, velvet, silk corsetry, dark tailoring, latex, and statement collars.', 'Dress codes celebrated with style and mutual respect.', 'Fashion & Aesthetics', 'public', true, 41, 'active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000042', 'Choking', 'choking', 'Erotic breath control and throat contact exploring intense surrender and visceral adrenaline.', 'Severe risk awareness: never apply continuous airway pressure or arterial occlusion. Pre-negotiate strictly.', 'Breath & Edge Play', 'public', true, 42, 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000043', 'Tickling', 'tickling', 'Lighthearted, playful physical torment combining teasing touch, laughter, writhing restraint, and sensory sensitivity.', 'Safewords immediately honored; prevent exhaustion.', 'Play & Sensation', 'public', true, 43, 'active', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000044', 'Sensory Play', 'sensory-play', 'Exploring tactile variety using feathers, wands, silk, velvet, ice, aromatic balms, and sonic frequencies.', 'Gradual sensory escalation with continuous feedback.', 'Sensory', 'public', true, 44, 'active', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000045', 'Aftercare Kink', 'aftercare-kink', 'The sacred post-play sanctuary ritual: warm tea, heavy blankets, emotional debriefing, holding, and physiological grounding.', 'Mandatory after any intense somatic or power exchange session.', 'Emotional & Healing', 'public', true, 45, 'active', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000046', 'Telephone Sex', 'telephone-sex', 'Intimate remote erotic dialogue, vocal cadence, breathing, and erotic storytelling across encrypted digital channels.', 'Absolute audio confidentiality and mutual discretion.', 'Sensory & Voice', 'public', true, 46, 'active', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000047', 'Maid Servant Fantasy', 'maid-servant-fantasy', 'Service submission, domestic devotion, tea ceremony protocols, grooming rituals, and quiet domestic order.', 'Pre-agreed service duties and gracious acknowledgement.', 'Fantasy & Play', 'public', true, 47, 'active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000048', 'Submissive Male', 'submissive-male', 'Honoring masculine surrender, devotion, obedience, emotional vulnerability, and yielding authority to a dominant partner.', 'Judgment-free container for sovereign male submission.', 'Dynamics', 'public', true, 48, 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000049', 'Dominant Female', 'dominant-female', 'Female sovereignty, queenly authority, emotional command, sadistic finesse, and confident leadership.', 'Reverence and respectful submission.', 'Dynamics', 'public', true, 49, 'active', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200'),
('10000000-0000-4000-8000-000000000050', 'Candy Panties Fetish', 'candy-panties-fetish', 'Playful edible lingerie rituals, slow unwrapping, oral delight, and sweet sensory anticipation.', 'Hygienic sweetness and playful, consensual pacing.', 'Fetish & Body', 'public', true, 50, 'active', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=1200')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    rules = EXCLUDED.rules,
    category = EXCLUDED.category,
    is_canonical = true,
    display_order = EXCLUDED.display_order,
    moderation_state = 'active',
    visibility = 'public';

-- 7. Harmonize with public.kinkster_kinks reference table
INSERT INTO public.kinkster_kinks (id, name, category, description, icon_name)
SELECT slug, name, category, description, 'Sparkles'
FROM public.groups
WHERE is_canonical = true
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description;

-- 8. Backfill existing production relationships safely
-- Link existing events to canonical communities
INSERT INTO public.event_topics (event_id, group_id)
SELECT id, '10000000-0000-4000-8000-000000000037'::UUID -- Shibari Rope Bondage
FROM public.sanctuary_events
WHERE title ILIKE '%shibari%'
ON CONFLICT (event_id, group_id) DO NOTHING;

INSERT INTO public.event_topics (event_id, group_id)
SELECT id, '10000000-0000-4000-8000-000000000003'::UUID -- Role Play
FROM public.sanctuary_events
WHERE title ILIKE '%masquerade%'
ON CONFLICT (event_id, group_id) DO NOTHING;

INSERT INTO public.event_topics (event_id, group_id)
SELECT id, '10000000-0000-4000-8000-000000000001'::UUID -- Dominance
FROM public.sanctuary_events
WHERE title ILIKE '%obsidian%' OR title ILIKE '%surrender%'
ON CONFLICT (event_id, group_id) DO NOTHING;

-- Link existing post(s) to canonical communities
INSERT INTO public.post_topics (post_id, group_id)
SELECT id, '10000000-0000-4000-8000-000000000001'::UUID -- Dominance
FROM public.kinkster_posts
WHERE caption ILIKE '%dynamics%' OR caption ILIKE '%queen%'
ON CONFLICT (post_id, group_id) DO NOTHING;
