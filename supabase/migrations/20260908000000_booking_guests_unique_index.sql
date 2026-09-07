-- Migration: 20260908000000_booking_guests_unique_index.sql
-- Description: Dedupes and adds unique index on (booking_id, guest_index) for public.booking_guests

DO $$
BEGIN
  -- 1. Remove duplicate booking_guests rows preserving the latest record
  DELETE FROM public.booking_guests a
  USING public.booking_guests b
  WHERE a.booking_id = b.booking_id
    AND a.guest_index = b.guest_index
    AND a.created_at < b.created_at;

  -- 2. Create unique index if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'booking_guests'
      AND indexname = 'idx_booking_guests_booking_guest_index'
  ) THEN
    CREATE UNIQUE INDEX idx_booking_guests_booking_guest_index 
    ON public.booking_guests (booking_id, guest_index);
  END IF;
END $$;
