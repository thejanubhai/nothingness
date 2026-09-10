INSERT INTO public.chatflows (name, trigger_event, trigger_keyword, response_template, channel, is_active)
VALUES 
  ('Date Check', 'keyword', 'available', 'Hi {{guest_name}}! Please provide your preferred check-in and check-out dates, and I will check the availability for you.', 'all', true),
  ('Booking Process', 'keyword', 'book', 'Great! To proceed with your booking, please confirm the number of guests and any special requirements you might have.', 'all', true),
  ('ID Verification Required', 'booking_confirmed', null, 'Your booking is confirmed! As per our policy, please upload a valid government ID (Aadhaar or Passport) to verify your identity before check-in.', 'all', true),
  ('Booking Confirmation Details', 'booking_confirmed', null, 'Thank you for booking with us, {{guest_name}}! Your stay at {{space_title}} from {{check_in_date}} to {{check_out_date}} is confirmed.', 'all', true),
  ('Check-in Information', 'check_in', null, 'Welcome! Today is your check-in day at {{space_title}}. Check-in time starts at 2:00 PM. The property access code is 1234. Let us know if you need any assistance!', 'all', true),
  ('Check-out Information', 'check_out', null, 'Good morning! Today is your check-out day. Please remember that check-out time is 11:00 AM. We hope you had a wonderful stay!', 'all', true)
ON CONFLICT DO NOTHING;
