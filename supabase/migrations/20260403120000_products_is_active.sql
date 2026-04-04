-- Visibilidad en catálogo público (admin puede ocultar sin borrar).
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

UPDATE public.products SET is_active = true WHERE is_active IS NULL;
