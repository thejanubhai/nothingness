-- Migration: Canonical Social Messaging Architecture & Unified Inbox
-- Implements normalized Conversations -> Participants -> Messages -> Context -> Permissions -> Retention

-- 1. Create kinkster_conversations table
CREATE TABLE IF NOT EXISTS public.kinkster_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(32) NOT NULL CHECK (type IN ('DIRECT', 'MESSAGE_REQUEST', 'RESONANCE', 'EVENT', 'COMMUNITY', 'EPHEMERAL')),
    title VARCHAR(256),
    context_type VARCHAR(32) CHECK (context_type IN ('event', 'community', 'post', 'profile', 'resonance')),
    context_id TEXT,
    context_data JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.kinkster_profiles(id) ON DELETE SET NULL,
    last_message_id UUID,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_preview TEXT,
    retention_policy VARCHAR(32) DEFAULT 'permanent' CHECK (retention_policy IN ('permanent', 'ephemeral_24h', 'ephemeral_48h', 'burn_on_read')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kinkster_convos_type ON public.kinkster_conversations(type);
CREATE INDEX IF NOT EXISTS idx_kinkster_convos_last_msg_at ON public.kinkster_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_kinkster_convos_context ON public.kinkster_conversations(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_kinkster_convos_expires ON public.kinkster_conversations(expires_at) WHERE expires_at IS NOT NULL;

-- 2. Create kinkster_conversation_participants table
CREATE TABLE IF NOT EXISTS public.kinkster_conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.kinkster_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.kinkster_profiles(id) ON DELETE CASCADE,
    role VARCHAR(32) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'pending_request', 'declined', 'left', 'muted', 'blocked')),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    unread_count INT DEFAULT 0,
    is_muted BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_participants_user_status ON public.kinkster_conversation_participants(user_id, status);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON public.kinkster_conversation_participants(conversation_id);

-- 3. Create kinkster_messages table
CREATE TABLE IF NOT EXISTS public.kinkster_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.kinkster_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.kinkster_profiles(id) ON DELETE CASCADE,
    message_type VARCHAR(32) DEFAULT 'text' CHECK (message_type IN ('text', 'photo', 'video', 'voice', 'burn_photo', 'share_post', 'share_event', 'share_profile', 'system')),
    content TEXT NOT NULL DEFAULT '',
    media_url TEXT,
    media_metadata JSONB DEFAULT '{}'::jsonb,
    is_view_once BOOLEAN DEFAULT FALSE,
    is_burnt BOOLEAN DEFAULT FALSE,
    burnt_at TIMESTAMPTZ,
    burn_countdown_seconds INT DEFAULT 5,
    status VARCHAR(32) DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
    idempotency_key TEXT,
    context_type VARCHAR(32),
    context_id TEXT,
    context_data JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kinkster_messages_conv_created ON public.kinkster_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_kinkster_messages_sender ON public.kinkster_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_kinkster_messages_idempotency ON public.kinkster_messages(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kinkster_messages_expires ON public.kinkster_messages(expires_at) WHERE expires_at IS NOT NULL;

-- 4. Create kinkster_blocks table
CREATE TABLE IF NOT EXISTS public.kinkster_blocks (
    blocker_id UUID NOT NULL REFERENCES public.kinkster_profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.kinkster_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_kinkster_blocks_blocked ON public.kinkster_blocks(blocked_id);

-- 5. Create kinkster_reports table
CREATE TABLE IF NOT EXISTS public.kinkster_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.kinkster_profiles(id) ON DELETE SET NULL,
    target_type VARCHAR(32) NOT NULL CHECK (target_type IN ('post', 'message', 'conversation', 'profile')),
    target_id TEXT NOT NULL,
    reason VARCHAR(128) NOT NULL,
    details TEXT,
    status VARCHAR(32) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kinkster_reports_target ON public.kinkster_reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_kinkster_reports_status ON public.kinkster_reports(status);

-- 6. Add messaging settings columns to kinkster_profiles
ALTER TABLE public.kinkster_profiles
    ADD COLUMN IF NOT EXISTS messaging_privacy VARCHAR(32) DEFAULT 'broader' CHECK (messaging_privacy IN ('everyone', 'broader', 'connections', 'community_members', 'event_participants', 'resonance_matches', 'nobody')),
    ADD COLUMN IF NOT EXISTS read_receipts_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS typing_indicators_enabled BOOLEAN DEFAULT TRUE;

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.kinkster_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinkster_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinkster_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinkster_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinkster_reports ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for kinkster_conversations
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_conversations' AND policyname = 'Participants can view their conversations') THEN
        DROP POLICY IF EXISTS "Participants can view their conversations" ON public.kinkster_conversations;
        CREATE POLICY "Participants can view their conversations" ON public.kinkster_conversations
            FOR SELECT TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.kinkster_conversation_participants cp
                    WHERE cp.conversation_id = kinkster_conversations.id
                    AND cp.user_id = auth.uid()
                    AND cp.status IN ('active', 'pending_request', 'muted')
                )
                OR created_by = auth.uid()
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_conversations' AND policyname = 'Users can create conversations') THEN
        DROP POLICY IF EXISTS "Users can create conversations" ON public.kinkster_conversations;
        CREATE POLICY "Users can create conversations" ON public.kinkster_conversations
            FOR INSERT TO authenticated
            WITH CHECK (
                auth.uid() = created_by
                AND EXISTS (
                    SELECT 1 FROM public.kinkster_profiles
                    WHERE id = auth.uid() AND is_activated = true
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_conversations' AND policyname = 'Participants can update conversation timestamp') THEN
        DROP POLICY IF EXISTS "Participants can update conversation timestamp" ON public.kinkster_conversations;
        CREATE POLICY "Participants can update conversation timestamp" ON public.kinkster_conversations
            FOR UPDATE TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.kinkster_conversation_participants cp
                    WHERE cp.conversation_id = kinkster_conversations.id
                    AND cp.user_id = auth.uid()
                    AND cp.status IN ('active', 'pending_request', 'muted')
                )
            );
    END IF;
END $$;

-- 9. RLS Policies for kinkster_conversation_participants
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_conversation_participants' AND policyname = 'Users can view participants in their conversations') THEN
        DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.kinkster_conversation_participants;
        CREATE POLICY "Users can view participants in their conversations" ON public.kinkster_conversation_participants
            FOR SELECT TO authenticated
            USING (
                user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.kinkster_conversation_participants cp2
                    WHERE cp2.conversation_id = kinkster_conversation_participants.conversation_id
                    AND cp2.user_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_conversation_participants' AND policyname = 'Users can insert participants during conversation creation') THEN
        DROP POLICY IF EXISTS "Users can insert participants during conversation creation" ON public.kinkster_conversation_participants;
        CREATE POLICY "Users can insert participants during conversation creation" ON public.kinkster_conversation_participants
            FOR INSERT TO authenticated
            WITH CHECK (
                user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.kinkster_conversations c
                    WHERE c.id = conversation_id
                    AND c.created_by = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_conversation_participants' AND policyname = 'Users can update their own participant record') THEN
        DROP POLICY IF EXISTS "Users can update their own participant record" ON public.kinkster_conversation_participants;
        CREATE POLICY "Users can update their own participant record" ON public.kinkster_conversation_participants
            FOR UPDATE TO authenticated
            USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_conversation_participants' AND policyname = 'Users can leave conversations') THEN
        DROP POLICY IF EXISTS "Users can leave conversations" ON public.kinkster_conversation_participants;
        CREATE POLICY "Users can leave conversations" ON public.kinkster_conversation_participants
            FOR DELETE TO authenticated
            USING (user_id = auth.uid());
    END IF;
END $$;

-- 10. RLS Policies for kinkster_messages
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_messages' AND policyname = 'Active participants can read messages') THEN
        DROP POLICY IF EXISTS "Active participants can read messages" ON public.kinkster_messages;
        CREATE POLICY "Active participants can read messages" ON public.kinkster_messages
            FOR SELECT TO authenticated
            USING (
                (expires_at IS NULL OR expires_at > NOW())
                AND EXISTS (
                    SELECT 1 FROM public.kinkster_conversation_participants cp
                    WHERE cp.conversation_id = kinkster_messages.conversation_id
                    AND cp.user_id = auth.uid()
                    AND cp.status IN ('active', 'pending_request', 'muted')
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_messages' AND policyname = 'Active participants can send messages') THEN
        DROP POLICY IF EXISTS "Active participants can send messages" ON public.kinkster_messages;
        CREATE POLICY "Active participants can send messages" ON public.kinkster_messages
            FOR INSERT TO authenticated
            WITH CHECK (
                auth.uid() = sender_id
                AND EXISTS (
                    SELECT 1 FROM public.kinkster_conversation_participants cp
                    WHERE cp.conversation_id = kinkster_messages.conversation_id
                    AND cp.user_id = auth.uid()
                    AND cp.status IN ('active', 'pending_request', 'muted')
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_messages' AND policyname = 'Participants can update message read or burn state') THEN
        DROP POLICY IF EXISTS "Participants can update message read or burn state" ON public.kinkster_messages;
        CREATE POLICY "Participants can update message read or burn state" ON public.kinkster_messages
            FOR UPDATE TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.kinkster_conversation_participants cp
                    WHERE cp.conversation_id = kinkster_messages.conversation_id
                    AND cp.user_id = auth.uid()
                    AND cp.status IN ('active', 'pending_request', 'muted')
                )
            );
    END IF;
END $$;

-- 11. RLS Policies for kinkster_blocks
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_blocks' AND policyname = 'Users can view their own blocks') THEN
        DROP POLICY IF EXISTS "Users can view their own blocks" ON public.kinkster_blocks;
        CREATE POLICY "Users can view their own blocks" ON public.kinkster_blocks
            FOR SELECT TO authenticated
            USING (auth.uid() = blocker_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_blocks' AND policyname = 'Users can manage their own blocks') THEN
        DROP POLICY IF EXISTS "Users can manage their own blocks" ON public.kinkster_blocks;
        CREATE POLICY "Users can manage their own blocks" ON public.kinkster_blocks
            FOR ALL TO authenticated
            USING (auth.uid() = blocker_id)
            WITH CHECK (auth.uid() = blocker_id);
    END IF;
END $$;

-- 12. RLS Policies for kinkster_reports
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_reports' AND policyname = 'Users can insert reports') THEN
        DROP POLICY IF EXISTS "Users can insert reports" ON public.kinkster_reports;
        CREATE POLICY "Users can insert reports" ON public.kinkster_reports
            FOR INSERT TO authenticated
            WITH CHECK (auth.uid() = reporter_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_reports' AND policyname = 'Users can view their own reports') THEN
        DROP POLICY IF EXISTS "Users can view their own reports" ON public.kinkster_reports;
        CREATE POLICY "Users can view their own reports" ON public.kinkster_reports
            FOR SELECT TO authenticated
            USING (auth.uid() = reporter_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_reports' AND policyname = 'Service role full access on reports') THEN
        DROP POLICY IF EXISTS "Service role full access on reports" ON public.kinkster_reports;
        CREATE POLICY "Service role full access on reports" ON public.kinkster_reports
            FOR ALL TO service_role
            USING (true);
    END IF;
END $$;

-- 13. Enable Realtime Publications
DO $$ BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.kinkster_conversations;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.kinkster_conversation_participants;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.kinkster_messages;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;
