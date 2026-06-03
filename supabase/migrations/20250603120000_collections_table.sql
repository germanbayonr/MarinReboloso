-- Colecciones como entidad (portadas, hero dual, orden en web)
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  label text not null,
  description text,
  hero_image_left text,
  hero_image_right text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collections_slug_unique unique (slug),
  constraint collections_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create index if not exists collections_active_sort_idx
  on public.collections (is_active, sort_order);

create index if not exists products_collection_lower_idx
  on public.products (lower(collection))
  where collection is not null;

alter table public.collections enable row level security;

drop policy if exists collections_public_read on public.collections;
create policy collections_public_read on public.collections
  for select
  using (is_active = true);

comment on table public.collections is 'Colecciones web; products.collection guarda el slug.';

-- Semilla de colecciones existentes (idempotente)
insert into public.collections (slug, label, hero_image_left, hero_image_right, sort_order) values
  (
    'descara',
    'Descará',
    'https://marebo.b-cdn.net/Colecciones/Drop%20_Descara%CC%81_/Pendientes%20Descara%20Pasion%202.jpg',
    null,
    10
  ),
  (
    'marebo',
    'Marebo',
    'https://marebo.b-cdn.net/Colecciones/MAREBO/Pendiente%20Flor%20MAREBO%20Dore.png',
    null,
    20
  ),
  (
    'corales',
    'Corales',
    'https://marebo.b-cdn.net/Colecciones/Corales/Pendientes%20Coralia%20Ivory.PNG',
    null,
    30
  ),
  (
    'filipa',
    'Filipa',
    'https://marebo.b-cdn.net/Colecciones/Filipa/Collar%20Filipa.PNG',
    null,
    40
  ),
  (
    'jaipur',
    'Jaipur',
    'https://marebo.b-cdn.net/Colecciones/II%20DROP%20Jaipur/Pendientes%20Coral%20Jaipur(1).jpg',
    null,
    50
  )
on conflict (slug) do update set
  label = excluded.label,
  hero_image_left = coalesce(public.collections.hero_image_left, excluded.hero_image_left),
  sort_order = excluded.sort_order,
  updated_at = now();
