-- Orden en portada (1 = hero principal) y visibilidad portada / web
alter table public.collections
  add column if not exists homepage_order integer not null default 100,
  add column if not exists visible_on_homepage boolean not null default true,
  add column if not exists visible_on_site boolean not null default true;

comment on column public.collections.homepage_order is '1 = hero principal de la home; 2, 3… = banners siguientes en portada.';
comment on column public.collections.visible_on_homepage is 'Si false, no aparece en la portada (hero ni banners).';
comment on column public.collections.visible_on_site is 'Si false, oculta la colección y sus productos en toda la web pública.';

-- Migrar is_active → visible_on_site donde aún no esté alineado
update public.collections
set visible_on_site = coalesce(is_active, true)
where visible_on_site is distinct from coalesce(is_active, true);

-- Orden inicial alineado con el diseño actual
update public.collections set homepage_order = 1, visible_on_homepage = true, visible_on_site = true where slug = 'jaipur';
update public.collections set homepage_order = 2, visible_on_homepage = true, visible_on_site = true where slug = 'descara';
update public.collections set homepage_order = 3, visible_on_homepage = true, visible_on_site = true where slug = 'corales';
update public.collections set homepage_order = 4, visible_on_homepage = true, visible_on_site = true where slug = 'marebo';
update public.collections set homepage_order = 5, visible_on_homepage = true, visible_on_site = true where slug = 'filipa';

drop policy if exists collections_public_read on public.collections;
create policy collections_public_read on public.collections
  for select
  using (visible_on_site = true);

create index if not exists collections_homepage_portada_idx
  on public.collections (visible_on_homepage, homepage_order)
  where visible_on_homepage = true and visible_on_site = true;
