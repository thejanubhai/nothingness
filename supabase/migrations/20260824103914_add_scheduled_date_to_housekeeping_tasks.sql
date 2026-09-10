ALTER TABLE public.housekeeping_tasks
ADD COLUMN IF NOT EXISTS scheduled_date DATE;

UPDATE public.housekeeping_tasks
SET scheduled_date = due_date
WHERE scheduled_date IS NULL AND due_date IS NOT NULL;
