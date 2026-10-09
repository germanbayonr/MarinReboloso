-- Webhook Stripe: idempotencia y flag de correo de confirmación
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_event_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS emails_sent boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cents integer;

CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_event_id_unique
  ON public.orders (stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;

COMMENT ON COLUMN public.orders.stripe_event_id IS 'Stripe Event id (checkout.session.completed) para idempotencia del webhook';
COMMENT ON COLUMN public.orders.emails_sent IS 'true tras enviar correo de confirmación al cliente';
