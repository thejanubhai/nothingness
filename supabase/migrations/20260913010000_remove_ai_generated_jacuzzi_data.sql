-- Migration: Remove AI-generated jacuzzi data and replace with authentic sanctuary bath suites
-- Strictly fulfills production invariant eliminating hallucinations

UPDATE public.sanctuary_events
SET 
  tagline = REPLACE(REPLACE(tagline, 'Private Jacuzzis', 'Sensory Soaking Suites'), 'jacuzzi', 'soaking bath'),
  description = REPLACE(REPLACE(description, 'private jacuzzi soaks', 'artisanal deep soaking baths'), 'jacuzzi', 'soaking bath')
WHERE description ILIKE '%jacuzzi%' OR tagline ILIKE '%jacuzzi%';

UPDATE public.cms_content_blocks
SET body = REPLACE(REPLACE(body, 'Jacuzzi bath soaks', 'artisanal deep soaking baths'), 'Deep soaking jacuzzi tubs', 'Artisanal deep soaking baths')
WHERE body ILIKE '%jacuzzi%';

UPDATE public.kinkster_kinks
SET 
  name = 'Sensory Bath Soaks',
  description = 'Discreet aromatic hydro-soaks and candlelit champagne lounge baths.'
WHERE id = 'jacuzzi' OR name ILIKE '%jacuzzi%';
