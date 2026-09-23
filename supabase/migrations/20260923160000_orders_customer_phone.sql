-- Teléfono del cliente capturado en checkout (antes de Stripe).
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone text;

COMMENT ON COLUMN public.orders.customer_phone IS 'Teléfono de contacto del comprador (checkout / metadata Stripe)';
