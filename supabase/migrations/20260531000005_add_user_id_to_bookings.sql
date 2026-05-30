ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update RLS policies to allow users to view their own bookings
DROP POLICY IF EXISTS "Users can view their own bookings." ON public.bookings;
CREATE POLICY "Users can view their own bookings." ON public.bookings
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Ensure admins can view all bookings
DROP POLICY IF EXISTS "Admins can view all bookings." ON public.bookings;
CREATE POLICY "Admins can view all bookings." ON public.bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin')
    )
  );
