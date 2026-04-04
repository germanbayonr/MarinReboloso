-- Dirección de envío en pedidos (requerida por inserts de prueba / checkout).
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_city text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_postal_code text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_country text;
