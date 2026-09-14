-- Migration: Omnichannel Guest Journey & Space Logistics
-- Description: Adds caretaker, drop-off, parking, and Google Maps info to spaces; adds stage dispatch tracking to bookings; seeds 3-stage guest journey chatflows

-- 1. Space Specific Logistics
ALTER TABLE public.spaces 
ADD COLUMN IF NOT EXISTS caretaker_name TEXT DEFAULT 'Vikram (Sanctuary Caretaker)',
ADD COLUMN IF NOT EXISTS caretaker_phone TEXT DEFAULT '+91 98111 23456',
ADD COLUMN IF NOT EXISTS cab_drop_instructions TEXT DEFAULT 'Drop-off at Hauz Khas Village Main Gate, lane opposite Deer Park entrance.',
ADD COLUMN IF NOT EXISTS parking_instructions TEXT DEFAULT 'Dedicated valet parking available at Deer Park entrance; inform security of Nothingness reservation.',
ADD COLUMN IF NOT EXISTS google_maps_url TEXT DEFAULT 'https://maps.google.com/?q=28.5494,77.1945';

-- Seed specific space logistics
UPDATE public.spaces 
SET 
  caretaker_name = 'Vikram (Chamber Caretaker)',
  caretaker_phone = '+91 98111 23456',
  cab_drop_instructions = 'Ask cab to drop at Hauz Khas Village entrance arch, proceed 50m straight to the cobblestone alley.',
  parking_instructions = 'Designated covered parking at Hauz Khas multi-level facility (Ticket validated by Nothingness).',
  google_maps_url = 'https://maps.google.com/?q=28.5535,77.1944'
WHERE slug = 'the-chamber' OR title ILIKE '%chamber%';

UPDATE public.spaces 
SET 
  caretaker_name = 'Kabir (Sanctuary Caretaker)',
  caretaker_phone = '+91 98222 34567',
  cab_drop_instructions = 'Drop at Mehrauli Archeological Park South Gate, lane near Qutub pillar.',
  parking_instructions = 'Private shaded sanctuary parking inside the boundary wall gate.',
  google_maps_url = 'https://maps.google.com/?q=28.5245,77.1855'
WHERE slug = 'the-void' OR title ILIKE '%void%';

UPDATE public.spaces 
SET 
  caretaker_name = 'Arjun (Sanctuary Caretaker)',
  caretaker_phone = '+91 98333 45678',
  cab_drop_instructions = 'Drop at Asola Bhatti Wildlife Sanctuary road, near gate 2.',
  parking_instructions = 'Private driveway parking within the estate perimeter.',
  google_maps_url = 'https://maps.google.com/?q=28.4875,77.2185'
WHERE slug = 'the-mirage' OR title ILIKE '%mirage%';

UPDATE public.spaces 
SET 
  caretaker_name = 'Dev (Estate Manager)',
  caretaker_phone = '+91 98444 56789',
  cab_drop_instructions = 'Drop at Saidulajab Western Lane, behind Garden of Five Senses.',
  parking_instructions = 'Gated parking courtyard with 24/7 security attendant.',
  google_maps_url = 'https://maps.google.com/?q=28.5140,77.2020'
WHERE slug = 'bangri' OR title ILIKE '%bangri%';

-- 2. Dispatch Tracking Columns for Bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS stage_1_dispatched_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stage_2_dispatched_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stage_3_dispatched_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS id_verification_completed_at TIMESTAMPTZ;

-- 3. Seed Configurable 3-Stage Guest Journey into chatflows
DELETE FROM public.chatflows 
WHERE trigger_event IN ('stage_1_booking_confirmed', 'stage_2_id_verified', 'stage_3_checkout_reminder');

INSERT INTO public.chatflows (name, trigger_event, trigger_keyword, response_template, channel, is_active)
VALUES 
  (
    'Stage 1: Immediate Booking Confirmation & ID Request',
    'stage_1_booking_confirmed',
    null,
    'Hey {{guest_name}}
Thanks for booking {{space_title}} for {{check_in_date}}.
Your check-in time is anytime after {{check_in_time}} and check-out is anytime after {{check_out_time}} on {{check_out_date}}.
Please send us front & back of *both*/*all* the guest’s Aadhaar/Passport so that we can send you the location of the property.',
    'all',
    true
  ),
  (
    'Stage 2: Post-ID Verification - Location & Caretaker',
    'stage_2_id_verified',
    null,
    'Hey {{guest_name}}
Your identity cards have been verified, and your check-in to the property {{space_title}} for {{check_in_date}} at {{check_in_time}} is confirmed.
Please use the below information to get to the property : 
{{cab_drop_instructions}}
Google Maps location : {{google_maps_url}}
{{parking_instructions}}
Make sure you call the Caretaker an hour before you check in so that your property can be ready before you come in.
{{caretaker_name}} - {{caretaker_phone}}',
    'all',
    true
  ),
  (
    'Stage 3: Checkout Reminder & Feedback',
    'stage_3_checkout_reminder',
    null,
    'Thanks for staying with us at {{space_title}}, the Checkout time is {{check_out_time}}.
We listen to all the feedbacks directly and really want to make you have a great experience, do let us know if we could improve with something.
Hoping to host you again 🎀🩷',
    'all',
    true
  );
