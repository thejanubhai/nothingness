UPDATE spaces
SET active = true,
    description = 'Discover The Chamber by Nothingness - a private, kink-friendly suite in Delhi. Enjoy intimate comfort, premium amenities, and discreet, fully sanitized hospitality. Perfect for couples and open-minded travelers seeking modern, alternative experiences.',
    max_guests = 2,
    amenities = '["Air conditioning", "Dolby 5.1 Surround Sound Bluetooth sound system", "Waterfront", "Smoking allowed", "Paid street parking off premises", "Discreet self check-in", "Premium sanitization"]'::jsonb,
    rules = 'Check-in after 1:00 pm
Checkout before 11:00 am
2 guests maximum
No unauthorized guests or parties
Please maintain discretion and respect the property',
    city = 'New Delhi',
    area = 'Hauz Khas Village',
    nightly_price = 6999,
    cleaning_fee = 500
WHERE slug = 'the-chamber';
