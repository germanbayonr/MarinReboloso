-- is_active = visible en catálogo/ficha; in_stock = disponible para compra (UI «Sin stock»).
COMMENT ON COLUMN public.products.is_active IS 'Visible en la web (listados y ficha). Independiente de in_stock (pausa vs. sin stock).';
