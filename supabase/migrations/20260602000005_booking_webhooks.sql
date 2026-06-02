-- Create a function that uses pg_net to call the Next.js booking webhook
CREATE OR REPLACE FUNCTION public.trigger_booking_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  site_url text;
  webhook_secret text;
  request_body jsonb;
  request_id bigint;
BEGIN
  -- Get settings
  site_url := current_setting('app.settings.nextjs_url', true);
  if site_url is null or site_url = '' then
    site_url := 'https://nothingness.asia';
  end if;

  webhook_secret := current_setting('app.settings.auth_webhook_secret', true);
  if webhook_secret is null or webhook_secret = '' then
    webhook_secret := 'secret-auth-hook-token-123';
  end if;

  -- Construct payload
  request_body := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', row_to_json(NEW),
    'old_record', case when TG_OP = 'UPDATE' or TG_OP = 'DELETE' then row_to_json(OLD) else null end
  );

  -- Call the Next.js webhook asynchronously
  select net.http_post(
      url := site_url || '/api/webhooks/bookings',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || webhook_secret
      ),
      body := request_body
  ) into request_id;

  RETURN NEW;
END;
$$;

-- Create the trigger on the bookings table
DROP TRIGGER IF EXISTS on_booking_confirmed ON public.bookings;
CREATE TRIGGER on_booking_confirmed
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_booking_webhook();
