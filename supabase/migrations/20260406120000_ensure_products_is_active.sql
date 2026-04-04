-- Visibilidad en tienda (independiente de in_stock).
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.products.is_active IS
  'Visible en la web (listados y ficha). Independiente de in_stock (pausa vs. sin stock).';
