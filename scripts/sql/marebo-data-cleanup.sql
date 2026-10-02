-- Marebo · Limpieza de datos (ejecutar en Supabase SQL Editor, proyecto Marebo)
-- 1) Revisa siempre con los SELECT de auditoría.
-- 2) Haz backup o export CSV antes de DELETE/UPDATE masivos.
-- 3) Sustituye :supabase_project_url por tu URL, p. ej. https://nwpjxibuaxclzogatfcl.supabase.co

-- ---------------------------------------------------------------------------
-- A) AUDITORÍA: productos duplicados por nombre (misma colección)
-- ---------------------------------------------------------------------------
SELECT
  lower(trim(name)) AS name_key,
  lower(coalesce(collection, '')) AS collection_key,
  count(*) AS cnt,
  array_agg(id ORDER BY created_at DESC NULLS LAST) AS product_ids
FROM public.products
GROUP BY 1, 2
HAVING count(*) > 1
ORDER BY cnt DESC, name_key;

-- ---------------------------------------------------------------------------
-- B) AUDITORÍA: pedidos duplicados por stripe_session_id
-- ---------------------------------------------------------------------------
SELECT stripe_session_id, count(*) AS cnt, array_agg(id) AS order_ids
FROM public.orders
WHERE stripe_session_id IS NOT NULL AND trim(stripe_session_id) <> ''
GROUP BY stripe_session_id
HAVING count(*) > 1;

-- ---------------------------------------------------------------------------
-- C) AUDITORÍA: URLs de imagen rotas o solo nombre de fichero en image_url (text[])
-- ---------------------------------------------------------------------------
SELECT id, name, image_url
FROM public.products
WHERE image_url IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM unnest(
      CASE
        WHEN pg_typeof(image_url) = 'text[]'::regtype THEN image_url::text[]
        ELSE ARRAY[image_url::text]
      END
    ) AS u(url)
    WHERE url IS NOT NULL
      AND trim(url) <> ''
      AND url !~* '^https?://'
  )
LIMIT 200;

-- ---------------------------------------------------------------------------
-- D) NORMALIZAR image_url: rutas relativas / UUID.webp → URL pública Supabase Storage
-- (Ajusta el dominio si cambia de proyecto)
-- ---------------------------------------------------------------------------
-- WITH params AS (
--   SELECT 'https://nwpjxibuaxclzogatfcl.supabase.co'::text AS base
-- ),
-- expanded AS (
--   SELECT
--     p.id,
--     u.ord,
--     trim(u.url) AS raw_url
--   FROM public.products p
--   CROSS JOIN LATERAL unnest(p.image_url::text[]) WITH ORDINALITY AS u(url, ord)
--   WHERE p.image_url IS NOT NULL
-- ),
-- fixed AS (
--   SELECT
--     id,
--     ord,
--     CASE
--       WHEN raw_url ~* '^https?://' THEN raw_url
--       WHEN raw_url ~ '^products/' THEN (SELECT base FROM params) || '/storage/v1/object/public/product-images/' || raw_url
--       WHEN raw_url ~ '^product-images/' THEN (SELECT base FROM params) || '/storage/v1/object/public/' || raw_url
--       WHEN raw_url ~* '\.(webp|jpg|jpeg|png)$' THEN (SELECT base FROM params) || '/storage/v1/object/public/product-images/products/' || raw_url
--       ELSE raw_url
--     END AS new_url
--   FROM expanded
-- ),
-- aggregated AS (
--   SELECT id, array_agg(new_url ORDER BY ord) AS new_image_url
--   FROM fixed
--   GROUP BY id
-- )
-- UPDATE public.products p
-- SET image_url = a.new_image_url
-- FROM aggregated a
-- WHERE p.id = a.id
--   AND p.image_url IS DISTINCT FROM a.new_image_url;

-- ---------------------------------------------------------------------------
-- E) DEDUPLICAR URLs dentro del array image_url (mismo producto)
-- ---------------------------------------------------------------------------
-- UPDATE public.products p
-- SET image_url = sub.deduped
-- FROM (
--   SELECT
--     id,
--     (
--       SELECT array_agg(DISTINCT trim(x) ORDER BY trim(x))
--       FROM unnest(image_url::text[]) AS x
--       WHERE trim(x) <> ''
--     ) AS deduped
--   FROM public.products
--   WHERE image_url IS NOT NULL
-- ) sub
-- WHERE p.id = sub.id
--   AND sub.deduped IS NOT NULL
--   AND p.image_url IS DISTINCT FROM sub.deduped;

-- ---------------------------------------------------------------------------
-- F) BORRAR pedidos duplicados (conserva el más reciente por stripe_session_id)
-- ---------------------------------------------------------------------------
-- DELETE FROM public.orders o
-- USING (
--   SELECT id,
--          row_number() OVER (
--            PARTITION BY stripe_session_id
--            ORDER BY created_at DESC NULLS LAST, id DESC
--          ) AS rn
--   FROM public.orders
--   WHERE stripe_session_id IS NOT NULL AND trim(stripe_session_id) <> ''
-- ) d
-- WHERE o.id = d.id
--   AND d.rn > 1;

-- ---------------------------------------------------------------------------
-- G) BORRAR productos duplicados por nombre+colección (conserva el más reciente)
-- CUIDADO: revisa manualmente la lista del SELECT (A) antes de ejecutar.
-- ---------------------------------------------------------------------------
-- DELETE FROM public.products p
-- USING (
--   SELECT id,
--          row_number() OVER (
--            PARTITION BY lower(trim(name)), lower(coalesce(collection, ''))
--            ORDER BY created_at DESC NULLS LAST, id DESC
--          ) AS rn
--   FROM public.products
-- ) d
-- WHERE p.id = d.id
--   AND d.rn > 1;
