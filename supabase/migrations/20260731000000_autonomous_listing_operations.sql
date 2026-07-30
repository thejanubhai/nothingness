-- Add per-listing autonomous configuration columns to spaces table
ALTER TABLE public.spaces 
ADD COLUMN IF NOT EXISTS check_in_time TEXT DEFAULT '3:00 PM',
ADD COLUMN IF NOT EXISTS check_out_time TEXT DEFAULT '11:00 AM',
ADD COLUMN IF NOT EXISTS key_instructions TEXT DEFAULT 'Keys are safely placed in the key lockbox at the main entry door. Please use code 1234.',
ADD COLUMN IF NOT EXISTS pre_arrival_template TEXT DEFAULT 'Hello {{guest_name}}! We are excited to host you at {{space_title}}. Your check-in time is {{check_in_time}}. Key location: {{key_instructions}}',
ADD COLUMN IF NOT EXISTS post_checkout_feedback_template TEXT DEFAULT 'Dear {{guest_name}}, thank you for staying at {{space_title}}! We hope you enjoyed your stay. Please share your private feedback with our team here to help us maintain perfection.',
ADD COLUMN IF NOT EXISTS cleaner_name TEXT DEFAULT 'Housekeeping Team',
ADD COLUMN IF NOT EXISTS cleaner_phone TEXT DEFAULT '';

-- Add AI Vision Inspection fields to housekeeping_tasks table
ALTER TABLE public.housekeeping_tasks
ADD COLUMN IF NOT EXISTS inspection_image_url TEXT,
ADD COLUMN IF NOT EXISTS ai_inspection_result JSONB,
ADD COLUMN IF NOT EXISTS ai_cleanliness_score INTEGER DEFAULT 0;
