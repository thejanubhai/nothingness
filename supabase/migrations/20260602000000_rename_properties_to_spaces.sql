-- Rename properties table to spaces
ALTER TABLE IF EXISTS properties RENAME TO spaces;

-- Rename sequences if they were auto-generated based on the old table name (optional but good practice)
-- Note: Supabase/PostgreSQL usually names the sequence as table_name_id_seq
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'properties_id_seq') THEN
    ALTER SEQUENCE properties_id_seq RENAME TO spaces_id_seq;
  END IF;
END $$;

-- Update bookings table
ALTER TABLE IF EXISTS bookings RENAME COLUMN property_id TO space_id;

-- Update housekeeping_tasks table
ALTER TABLE IF EXISTS housekeeping_tasks RENAME COLUMN property_id TO space_id;

-- Seed the requested spaces
INSERT INTO spaces (title, slug, description, area, city, state, country, nightly_price, featured_image, images, status)
VALUES 
  ('The Void', 'the-void', 'An expansive underground sensory deprivation suite. Pitch black, silent, and completely secluded.', 'South Delhi', 'New Delhi', 'Delhi', 'India', 35000, '/images/media__1779912812341.png', ARRAY['/images/media__1779912812341.png'], 'active'),
  ('The Mirage', 'the-mirage', 'An illusionary playground featuring two-way mirrors and endless reflections for exhibitionist aesthetics.', 'South Delhi', 'New Delhi', 'Delhi', 'India', 40000, '/images/media__1779907746365.png', ARRAY['/images/media__1779907746365.png'], 'active'),
  ('Bangri', 'bangri', 'A raw, brutalist concrete industrial space designed for intense scenes and raw authentic expression.', 'South Delhi', 'New Delhi', 'Delhi', 'India', 45000, '/images/media__1779776164813.png', ARRAY['/images/media__1779776164813.png'], 'active')
ON CONFLICT (slug) DO NOTHING;
