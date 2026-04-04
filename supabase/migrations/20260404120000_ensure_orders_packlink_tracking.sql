-- Columnas de seguimiento de envíos (admin: Correos / Packlink).
-- Idempotente: seguro si ya existían por migración 20260403140000.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS packlink_url text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_carrier text;

COMMENT ON COLUMN public.orders.tracking_number IS 'Número de seguimiento (Correos)';
COMMENT ON COLUMN public.orders.packlink_url IS 'URL de seguimiento Packlink';
COMMENT ON COLUMN public.orders.shipping_carrier IS 'correos | packlink cuando status = enviado';
