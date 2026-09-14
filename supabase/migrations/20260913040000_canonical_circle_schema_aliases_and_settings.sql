-- Migration: Canonical Circle Schema Aliases, Views & Settings
-- Establishes canonical "The Circle" schema support alongside legacy table compatibility

ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS fee_circle_activation numeric DEFAULT 1001;

UPDATE public.platform_settings 
SET fee_circle_activation = COALESCE(fee_kinkster_activation, 1001)
WHERE fee_circle_activation IS NULL;

-- Canonical Views for The Circle
CREATE OR REPLACE VIEW public.circle_profiles AS 
SELECT * FROM public.kinkster_profiles;

CREATE OR REPLACE VIEW public.circle_posts AS 
SELECT * FROM public.kinkster_posts;

CREATE OR REPLACE VIEW public.circle_events AS 
SELECT * FROM public.kinkster_events;

-- Update CMS Content Blocks to canonical branding
UPDATE public.cms_content_blocks
SET 
  title = 'Where Private Desires Find Their Sanctuary.',
  subtitle = 'The Circle • Private Monikers & Desires',
  body = 'An intimate, confidential society reserved exclusively for verified guests of Nothingness. Connect under complete anonymity with private @aliases, explore deep aesthetic chemistry, and unlock private sanctuary suites. Protected by a one-time lifetime membership entry barrier.'
WHERE block_key = 'lifestyle_showcase';