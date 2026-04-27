do $$
begin
  if not exists (select 1 from pg_type where typname = 'promotion_type') then
    create type public.promotion_type as enum ('code_only', 'banner_popup', 'header_bar');
  end if;
end $$;

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  type public.promotion_type not null,
  code text not null unique,
  discount_percentage integer not null check (discount_percentage > 0 and discount_percentage <= 100),
  announcement_text text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.promotions enable row level security;

drop policy if exists "promotions_public_select_active" on public.promotions;
create policy "promotions_public_select_active"
  on public.promotions
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "promotions_service_role_all" on public.promotions;
create policy "promotions_service_role_all"
  on public.promotions
  for all
  to service_role
  using (true)
  with check (true);
