-- Revert the custom email hook so Supabase handles Auth natively
DROP FUNCTION IF EXISTS public.custom_email_hook(jsonb);
