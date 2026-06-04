-- Add state tracking columns to conversations table for the Intelligent Chatflow Engine
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS active_flow TEXT,
ADD COLUMN IF NOT EXISTS flow_step TEXT,
ADD COLUMN IF NOT EXISTS flow_context JSONB DEFAULT '{}'::jsonb;

-- Ensure conversation_messages table exists in case it was missing from other migrations
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- 'guest', 'admin', 'system'
  sender_name TEXT,
  channel TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_by_admin BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_conv_messages_conv_id ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_messages_created_at ON public.conversation_messages(created_at DESC);
