-- Seguimiento de envíos (admin: Correos vs Packlink)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS packlink_url text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_carrier text;

COMMENT ON COLUMN public.orders.shipping_carrier IS 'correos | packlink — solo relevante cuando status = enviado';
