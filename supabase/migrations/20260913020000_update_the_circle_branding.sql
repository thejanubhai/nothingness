-- Migration: Update brand naming from "Lifestyle Circle" to "The Circle"
-- Establishes canonical prestigious naming across CMS blocks and platform definitions

UPDATE public.cms_content_blocks
SET 
  subtitle = 'The Circle • Private Monikers & Desires',
  body = REPLACE(body, 'Lifestyle Circle', 'The Circle')
WHERE block_key = 'lifestyle_showcase';

UPDATE public.cms_content_blocks
SET body = REPLACE(body, 'Lifestyle Circle', 'The Circle')
WHERE body ILIKE '%Lifestyle Circle%';
