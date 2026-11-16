-- Product flavor options + cart/order integration (idempotent)
-- Run in Supabase SQL Editor.

-- 1) Flavor options per product
create table if not exists public.product_options (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  is_available boolean not null default true,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_product_options_product on public.product_options(product_id);

alter table public.product_options enable row level security;

drop policy if exists "public read product options" on public.product_options;
create policy "public read product options" on public.product_options
  for select using (is_available = true);

drop policy if exists "admin full product options" on public.product_options;
create policy "admin full product options" on public.product_options
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- 2) Carts: selected flavor + signature for uniqueness
alter table public.carts add column if not exists option_id uuid references public.product_options(id) on delete set null;
alter table public.carts add column if not exists option_name text;
alter table public.carts add column if not exists option_signature text not null default '';

alter table public.carts drop constraint if exists carts_user_id_product_id_key;
alter table public.carts drop constraint if exists carts_user_product_option_key;
alter table public.carts
  add constraint carts_user_product_option_key unique (user_id, product_id, option_signature);

-- 3) Order items: flavor snapshot
alter table public.order_items add column if not exists option_name text;

notify pgrst, 'reload schema';
