-- Variantes de producto (colores, tallas, imagen por variante)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_variants boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants jsonb NOT NULL DEFAULT '{"colors":[],"sizes":[],"items":[]}'::jsonb;

COMMENT ON COLUMN public.products.has_variants IS 'Si true, el producto usa variantes definidas en variants (color/talla/imagen).';
COMMENT ON COLUMN public.products.variants IS 'JSON: { colors: string[], sizes: string[], items: [{ id, color, size, image_url, in_stock }] }';
