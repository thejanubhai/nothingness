-- Update The Chamber with final, authentic copy
UPDATE public.properties
SET 
  description = 'Hidden in the heart of South Delhi, The Chamber is a meticulously designed sanctuary for those who seek to explore the darker, more intense facets of intimacy. This is not just a room; it is an immersive, sensory-deprivation environment. Featuring fully soundproofed walls, cinematic low-light ambience, and industrial-grade specialized equipment, every square inch of this space is engineered for discretion and exploration. Unwind in the oversized freestanding tub, sink into the velvet-draped primary bed, and let the outside world fade into nothingness.',
  amenities = '["St Andrews Cross (Industrial Grade)", "Suspension Hardpoints (500kg load)", "Overhead Mirrors", "Soundproofed Walls", "Freestanding Soaking Tub", "Dimmable Cinematic Lighting", "Premium Velvet & Leather Textures", "Discreet Private Entrance", "Marshall Bluetooth Speaker", "En-suite Rainfall Shower", "Luxury Toiletries"]'::jsonb,
  rules = 'No Visitors Allowed
No Photography of Property Exterior
Do Not Share Exact Location Publicly
Use Equipment Safely & At Your Own Risk
Excessive Mess/Stains Will Incur Heavy Fines
No Smoking Indoors
Respect the Neighbors (Keep Noise Minimal)'
WHERE slug = 'the-chamber';
