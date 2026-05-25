-- Add airbnb_ical_url to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS airbnb_ical_url TEXT;
