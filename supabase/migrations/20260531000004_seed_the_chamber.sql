INSERT INTO public.properties (id, title, slug, city, area, description, nightly_price, cleaning_fee, max_guests, images, featured_image, rules, active)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000', -- standard fixed UUID for this specific property
  'The Chamber',
  'the-chamber',
  'Delhi',
  'South Delhi',
  'A sensory isolation tank of a stay. Curated for those who seek the deepest levels of intimacy and aesthetic indulgence.',
  12000,
  2500,
  4,
  ARRAY['/images/the-chamber/image-1.jpg', '/images/the-chamber/image-2.jpg', '/images/the-chamber/image-3.jpg', '/images/the-chamber/image-4.jpg'],
  '/images/the-chamber/image-1.jpg',
  '1. Strict privacy protocol. 2. No unverified guests.',
  true
) ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  nightly_price = EXCLUDED.nightly_price,
  featured_image = EXCLUDED.featured_image,
  active = EXCLUDED.active;
