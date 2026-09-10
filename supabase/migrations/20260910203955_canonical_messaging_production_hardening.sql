-- 1. Covering indexes for social messaging foreign keys
CREATE INDEX IF NOT EXISTS idx_kinkster_conversations_created_by ON public.kinkster_conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_kinkster_reports_reporter ON public.kinkster_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_kinkster_blocks_blocker ON public.kinkster_blocks(blocker_id);

-- 2. Optimized RLS policies with (select auth.uid()) to avoid per-row re-evaluation
DROP POLICY IF EXISTS "Participants can view their conversations" ON public.kinkster_conversations;
CREATE POLICY "Participants can view their conversations" ON public.kinkster_conversations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.kinkster_conversation_participants cp
            WHERE cp.conversation_id = kinkster_conversations.id
            AND cp.user_id = (SELECT auth.uid())
            AND cp.status IN ('active', 'pending_request', 'muted')
        )
        OR created_by = (SELECT auth.uid())
    );

DROP POLICY IF EXISTS "Users can create conversations" ON public.kinkster_conversations;
CREATE POLICY "Users can create conversations" ON public.kinkster_conversations
    FOR INSERT TO authenticated
    WITH CHECK (
        created_by = (SELECT auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.kinkster_profiles
            WHERE id = (SELECT auth.uid()) AND is_activated = true
        )
    );

DROP POLICY IF EXISTS "Participants can update conversation timestamp" ON public.kinkster_conversations;
CREATE POLICY "Participants can update conversation timestamp" ON public.kinkster_conversations
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.kinkster_conversation_participants cp
            WHERE cp.conversation_id = kinkster_conversations.id
            AND cp.user_id = (SELECT auth.uid())
            AND cp.status IN ('active', 'pending_request', 'muted')
        )
    );

DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.kinkster_conversation_participants;
CREATE POLICY "Users can view participants in their conversations" ON public.kinkster_conversation_participants
    FOR SELECT TO authenticated
    USING (
        user_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.kinkster_conversation_participants cp2
            WHERE cp2.conversation_id = kinkster_conversation_participants.conversation_id
            AND cp2.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can insert participants during conversation creation" ON public.kinkster_conversation_participants;
CREATE POLICY "Users can insert participants during conversation creation" ON public.kinkster_conversation_participants
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.kinkster_conversations c
            WHERE c.id = conversation_id
            AND c.created_by = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update their own participant record" ON public.kinkster_conversation_participants;
CREATE POLICY "Users can update their own participant record" ON public.kinkster_conversation_participants
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can leave conversations" ON public.kinkster_conversation_participants;
CREATE POLICY "Users can leave conversations" ON public.kinkster_conversation_participants
    FOR DELETE TO authenticated
    USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Active participants can read messages" ON public.kinkster_messages;
CREATE POLICY "Active participants can read messages" ON public.kinkster_messages
    FOR SELECT TO authenticated
    USING (
        (expires_at IS NULL OR expires_at > NOW())
        AND EXISTS (
            SELECT 1 FROM public.kinkster_conversation_participants cp
            WHERE cp.conversation_id = kinkster_messages.conversation_id
            AND cp.user_id = (SELECT auth.uid())
            AND cp.status IN ('active', 'pending_request', 'muted')
        )
    );

DROP POLICY IF EXISTS "Active participants can send messages" ON public.kinkster_messages;
CREATE POLICY "Active participants can send messages" ON public.kinkster_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = (SELECT auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.kinkster_conversation_participants cp
            WHERE cp.conversation_id = kinkster_messages.conversation_id
            AND cp.user_id = (SELECT auth.uid())
            AND cp.status IN ('active', 'pending_request', 'muted')
        )
    );

DROP POLICY IF EXISTS "Participants can update message read or burn state" ON public.kinkster_messages;
CREATE POLICY "Participants can update message read or burn state" ON public.kinkster_messages
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.kinkster_conversation_participants cp
            WHERE cp.conversation_id = kinkster_messages.conversation_id
            AND cp.user_id = (SELECT auth.uid())
            AND cp.status IN ('active', 'pending_request', 'muted')
        )
    );

DROP POLICY IF EXISTS "Users can view their own blocks" ON public.kinkster_blocks;
CREATE POLICY "Users can view their own blocks" ON public.kinkster_blocks
    FOR SELECT TO authenticated
    USING (blocker_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own blocks" ON public.kinkster_blocks;
CREATE POLICY "Users can manage their own blocks" ON public.kinkster_blocks
    FOR ALL TO authenticated
    USING (blocker_id = (SELECT auth.uid()))
    WITH CHECK (blocker_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert reports" ON public.kinkster_reports;
CREATE POLICY "Users can insert reports" ON public.kinkster_reports
    FOR INSERT TO authenticated
    WITH CHECK (reporter_id = (SELECT auth.uid()));
