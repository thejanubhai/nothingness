-- Migration: 20260908000000_booking_guests_unique_index.sql
-- Description: Dedupes and adds unique index on (booking_id, guest_index) for public.booking_guests

-- 1. Remove duplicate booking_guests rows preserving the latest record
DELETE FROM public.booking_guests a
USING public.booking_guests b
WHERE a.booking_id = b.booking_id
  AND a.guest_index = b.guest_index
  AND (
    a.created_at < b.created_at
    OR (a.created_at = b.created_at AND a.id < b.id)
  );

-- 2. Create unique index if not exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_guests_booking_guest_index 
ON public.booking_guests (booking_id, guest_index);

