-- =============================================================================
-- Marebo · Supabase proyecto: nwpjxibuaxclzogatfcl
-- URL base Storage: https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/
-- Bunny catálogo legado: https://marebo.b-cdn.net/Colecciones/... y .../PRODUCTOS/...
-- Tabla: public.products · columna: image_url (text[] — array de URLs)
-- Total productos (mar 2026): ~340
-- =============================================================================
-- CÓMO USAR (sin saber programación):
-- 1. Entra en https://supabase.com → tu proyecto Marebo
-- 2. Menú izquierdo: SQL → New query
-- 3. Copia SOLO un bloque SELECT, pulsa Run
-- 4. Los UPDATE/DELETE van comentados: descomenta solo cuando el SELECT te convenza
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Cuántas URLs hay de cada tipo (resumen)
-- -----------------------------------------------------------------------------
WITH urls AS (
  SELECT p.id, p.name, trim(u.url) AS url
  FROM public.products p
  CROSS JOIN LATERAL unnest(p.image_url::text[]) AS u(url)
  WHERE p.image_url IS NOT NULL
)
SELECT
  CASE
    WHEN url ILIKE '%marebo.b-cdn.net%' THEN 'bunny'
    WHEN url ILIKE '%supabase.co/storage/%product-images%' THEN 'supabase_storage'
    WHEN url !~* '^https?://' THEN 'ruta_relativa_rota'
    ELSE 'otra_http'
  END AS tipo,
  count(*) AS num_urls
FROM urls
GROUP BY 1
ORDER BY num_urls DESC;

-- Resultado esperado (aprox.): bunny ~146, supabase_storage ~512, rutas rotas 0


-- -----------------------------------------------------------------------------
-- 2) Productos con galería MIXTA (Bunny + Supabase) — revisar en admin
-- Ejemplos REALES de tu BD:
-- -----------------------------------------------------------------------------
WITH urls AS (
  SELECT
    p.id,
    p.name,
    p.collection,
    trim(u.url) AS url
  FROM public.products p
  CROSS JOIN LATERAL unnest(p.image_url::text[]) AS u(url)
),
flags AS (
  SELECT
    id,
    name,
    collection,
    bool_or(url ILIKE '%marebo.b-cdn.net%') AS has_bunny,
    bool_or(url ILIKE '%supabase.co/storage/%product-images%') AS has_supabase,
    array_agg(url ORDER BY url) AS all_urls
  FROM urls
  GROUP BY id, name, collection
)
SELECT id, name, collection, all_urls
FROM flags
WHERE has_bunny AND has_supabase
ORDER BY name
LIMIT 30;

-- Nombres que verás (entre otros):
-- · Aura Turquesa (id 915a3068-9e5d-4b23-9fe4-56f0f6dc8d07)
-- · Bolso Carmesí Borde
-- · Collar Esfera Salmón
-- · Pendiente Aura Carmín
-- · Pendiente Imperial


-- -----------------------------------------------------------------------------
-- 3) Ejemplos concretos para abrir en el navegador (copiar/pegar URL)
-- -----------------------------------------------------------------------------
SELECT name, image_url
FROM public.products
WHERE name IN (
  'Aura Turquesa',
  'Aros mini rojos',
  'Bolso Agua Borde',
  'Pendiente Imperial'
);

-- URLs reales de muestra:
-- Bunny:  https://marebo.b-cdn.net/Colecciones/MAREBO/Aura%20Turquesa%20copia.PNG
-- Supabase: https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/products/d44ae8a4-c5d0-4dcb-aca8-05f4a0838ffe.webp
-- Supabase: https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/products/eeea7650-c399-4f4d-a031-eedeed36c3e0.webp


-- -----------------------------------------------------------------------------
-- 4) Productos duplicados por nombre + colección (mar 2026: 0 grupos)
-- -----------------------------------------------------------------------------
SELECT
  lower(trim(name)) AS name_key,
  lower(coalesce(collection, '')) AS collection_key,
  count(*) AS cnt,
  array_agg(id ORDER BY created_at DESC NULLS LAST) AS product_ids
FROM public.products
GROUP BY 1, 2
HAVING count(*) > 1;


-- -----------------------------------------------------------------------------
-- 5) Pedidos duplicados por stripe_session_id (mar 2026: 0)
-- -----------------------------------------------------------------------------
SELECT stripe_session_id, count(*) AS cnt, array_agg(id) AS order_ids
FROM public.orders
WHERE stripe_session_id IS NOT NULL AND trim(stripe_session_id) <> ''
GROUP BY stripe_session_id
HAVING count(*) > 1;


-- -----------------------------------------------------------------------------
-- 6) OPCIONAL: poner la imagen Supabase WebP primero en la galería (solo mixtos)
--    No borra Bunny; solo reordena para que la miniatura principal sea la del admin.
-- -----------------------------------------------------------------------------
-- WITH mixed AS (
--   SELECT p.id, p.image_url::text[] AS urls
--   FROM public.products p
--   WHERE EXISTS (
--     SELECT 1 FROM unnest(p.image_url::text[]) u(u)
--     WHERE u.u ILIKE '%marebo.b-cdn.net%'
--   )
--   AND EXISTS (
--     SELECT 1 FROM unnest(p.image_url::text[]) u(u)
--     WHERE u.u ILIKE '%supabase.co/storage/%product-images%'
--   )
-- ),
-- reordered AS (
--   SELECT
--     id,
--     (
--       SELECT array_agg(u ORDER BY
--         CASE WHEN u ILIKE '%supabase.co/storage/%product-images%/products/%.webp' THEN 0 ELSE 1 END,
--         u
--       )
--       FROM unnest(urls) AS u
--     ) AS new_urls
--   FROM mixed
-- )
-- UPDATE public.products p
-- SET image_url = r.new_urls
-- FROM reordered r
-- WHERE p.id = r.id;


-- -----------------------------------------------------------------------------
-- 7) NO recomendado ahora: unificar todo a Bunny
--    Solo si configuras en Bunny un origen que sirva el bucket product-images de Supabase.
-- -----------------------------------------------------------------------------
