-- Pedidos: total en unidad principal (EUR) como decimal; elimina total_cents.
-- Idempotente para proyectos que ya aplicaron el cambio a mano.

ALTER TABLE public.orders DROP COLUMN IF EXISTS total_cents;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount numeric(12, 2);

ALTER TABLE public.orders DROP COLUMN IF EXISTS shipping_province;
ALTER TABLE public.orders DROP COLUMN IF EXISTS shipping_apartment;
ALTER TABLE public.orders DROP COLUMN IF EXISTS notes;
