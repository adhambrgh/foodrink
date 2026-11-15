-- ============================================================
-- FULL RECOVERY MIGRATION - FoodDrink Database
-- Run in Supabase SQL Editor (one-time paste)
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. TABLES
-- ============================================================

-- profiles (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id),
  role text check (role in ('customer','admin')) default 'customer',
  name text,
  phone text,
  created_at timestamp with time zone default now()
);

-- categories
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  icon text,
  sort_order integer default 0,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- products
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.categories(id),
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  is_active boolean default true,
  stock integer default 0,
  created_at timestamp with time zone default now()
);

-- orders
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  status text check (status in ('pending','menunggu_pembayaran','diproses','dikirim','selesai')) default 'pending',
  payment_status text check (payment_status in ('pending','paid','expired','failed')) default 'pending',
  payment_method text check (payment_method in ('qris','cod')) default 'qris',
  total numeric(10,2),
  address text,
  notes text,
  qris_image_url text,
  qris_proof_url text,
  qris_proof_uploaded_at timestamptz,
  qris_verified_at timestamptz,
  created_at timestamp with time zone default now()
);

-- order_items
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id),
  product_id uuid references public.products(id),
  name_snapshot text not null,
  price_snapshot numeric(10,2) not null,
  qty integer not null,
  subtotal numeric(10,2) not null
);

-- favorites
create table if not exists public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  product_id uuid references public.products(id),
  created_at timestamp with time zone default now()
);

-- banners
create table if not exists public.banners (
  id uuid primary key default uuid_generate_v4(),
  title text,
  subtitle text,
  image_url text not null,
  link_url text,
  position text check (position in ('hero','promo','footer')) default 'hero',
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamp with time zone default now()
);

-- notifications
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  title text not null,
  body text,
  data jsonb,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- notification_preferences
create table if not exists public.notification_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) unique,
  order_updates boolean default true,
  promotions boolean default true,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- 2. TRIGGERS
-- ============================================================

-- trigger: create profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 3. ROW LEVEL SECURITY & POLICIES
-- ============================================================

-- profiles RLS
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

drop policy if exists "allow select own profile" on public.profiles;
create policy "allow select own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "allow update own profile" on public.profiles;
create policy "allow update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "allow admin select all" on public.profiles;
create policy "allow admin select all" on public.profiles for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "allow admin update all" on public.profiles;
create policy "allow admin update all" on public.profiles for update using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- categories RLS
alter table public.categories enable row level security;

drop policy if exists "admin full" on public.categories;
create policy "admin full" on public.categories for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "public read active" on public.categories;
create policy "public read active" on public.categories for select using (active = true);

-- products RLS
alter table public.products enable row level security;

drop policy if exists "admin full" on public.products;
create policy "admin full" on public.products for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "public read active" on public.products;
create policy "public read active" on public.products for select using (is_active = true);

-- orders RLS
alter table public.orders enable row level security;

drop policy if exists "user select own" on public.orders;
create policy "user select own" on public.orders for select using (auth.uid() = user_id);

drop policy if exists "user insert own" on public.orders;
create policy "user insert own" on public.orders for insert with check (auth.uid() = user_id);

-- Allow users to confirm their own QRIS payments (update payment_status to 'paid' and status to 'diproses')
drop policy if exists "user update own qris" on public.orders;
create policy "user update own qris" on public.orders
for update using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and payment_method = 'qris'
  and payment_status = 'paid'
  and status = 'diproses'
  and qris_verified_at is not null
);

drop policy if exists "admin full" on public.orders;
create policy "admin full" on public.orders for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- order_items RLS
alter table public.order_items enable row level security;

drop policy if exists "user select own" on public.order_items;
create policy "user select own" on public.order_items for select using (exists (select 1 from public.orders where id = order_id and user_id = auth.uid()));

-- Allow users to insert order_items for their own orders
drop policy if exists "user insert own" on public.order_items;
create policy "user insert own" on public.order_items
for insert with check (
  exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
);

drop policy if exists "admin full" on public.order_items;
create policy "admin full" on public.order_items for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- favorites RLS
alter table public.favorites enable row level security;

drop policy if exists "user full" on public.favorites;
create policy "user full" on public.favorites for all using (auth.uid() = user_id);

-- banners RLS
alter table public.banners enable row level security;

drop policy if exists "admin full" on public.banners;
create policy "admin full" on public.banners for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "public read active" on public.banners;
create policy "public read active" on public.banners for select using (is_active = true);

-- notifications RLS
alter table public.notifications enable row level security;

drop policy if exists "user select own" on public.notifications;
create policy "user select own" on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "user update own" on public.notifications;
create policy "user update own" on public.notifications for update using (auth.uid() = user_id);

drop policy if exists "admin full" on public.notifications;
create policy "admin full" on public.notifications for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- notification_preferences RLS
alter table public.notification_preferences enable row level security;

drop policy if exists "user full" on public.notification_preferences;
create policy "user full" on public.notification_preferences for all using (auth.uid() = user_id);

-- ============================================================
-- 4. STORAGE BUCKETS
-- ============================================================

-- product-images bucket
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images" on storage.objects for select using (bucket_id = 'product-images');

drop policy if exists "Admin write product images" on storage.objects;
create policy "Admin write product images" on storage.objects for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- qris-images bucket
insert into storage.buckets (id, name, public) values ('qris-images', 'qris-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read qris images" on storage.objects;
create policy "Public read qris images" on storage.objects for select using (bucket_id = 'qris-images');

drop policy if exists "Admin write qris images" on storage.objects;
create policy "Admin write qris images" on storage.objects for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- qris-proofs bucket
insert into storage.buckets (id, name, public) values ('qris-proofs', 'qris-proofs', false)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload qris proofs" on storage.objects;
create policy "Authenticated users can upload qris proofs" on storage.objects for insert with check (bucket_id = 'qris-proofs' and auth.role() = 'authenticated');

drop policy if exists "Users can view own qris proofs" on storage.objects;
create policy "Users can view own qris proofs" on storage.objects for select using (bucket_id = 'qris-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Admin can view all qris proofs" on storage.objects;
create policy "Admin can view all qris proofs" on storage.objects for select using (bucket_id = 'qris-proofs' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Users can delete own qris proofs" on storage.objects;
create policy "Users can delete own qris proofs" on storage.objects for delete using (bucket_id = 'qris-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

-- banner-images bucket
insert into storage.buckets (id, name, public) values ('banner-images', 'banner-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read banner images" on storage.objects;
create policy "Public read banner images" on storage.objects for select using (bucket_id = 'banner-images');

drop policy if exists "Admin write banner images" on storage.objects;
create policy "Admin write banner images" on storage.objects for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ============================================================
-- 5. SEED DATA
-- ============================================================

-- Seed categories
INSERT INTO public.categories (id, name, icon, active) VALUES
  (gen_random_uuid(), 'Makanan Berat', 'rice_bowl', true),
  (gen_random_uuid(), 'Cemilan', 'bakery_dining', true),
  (gen_random_uuid(), 'Kopi', 'coffee', true),
  (gen_random_uuid(), 'Teh', 'local_cafe', true),
  (gen_random_uuid(), 'Jus', 'local_bar', true),
  (gen_random_uuid(), 'Dessert', 'icecream', true),
  (gen_random_uuid(), 'Paket Hemat', 'percent', true),
  (gen_random_uuid(), 'Lainnya', 'apps', true)
ON CONFLICT DO NOTHING;

-- Seed initial products
INSERT INTO public.products (category_id, name, description, price, image_url, is_active, stock)
SELECT
  c.id,
  p.name,
  p.description,
  p.price,
  p.image_url,
  p.is_active,
  p.stock
FROM (VALUES
  ('Makanan Berat', 'Es Mamu', 'Es mamu segar dan manis', 2500, '', true, 100),
  ('Makanan Berat', 'Pisang Nugget', 'Pisang nugget crispy gurih', 3000, '', true, 100)
) AS p(category_name, name, description, price, image_url, is_active, stock)
JOIN public.categories c ON c.name = p.category_name
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. ADMIN USER SETUP
-- ============================================================

-- Set admin user (run after user registers via auth)
insert into public.profiles (id, role, name)
values ('d8bef9dd-d609-4007-9566-2a584f78cfba', 'admin', 'Admin Foodrink')
on conflict (id) do update set role = 'admin';

-- ============================================================
-- 7. QRIS STATUS CONSTRAINT UPDATE
-- ============================================================

-- Update orders status constraint to include menunggu_pembayaran
alter table public.orders
drop constraint if exists orders_status_check;

alter table public.orders
add constraint orders_status_check
  check (status in ('pending', 'menunggu_pembayaran', 'diproses', 'dikirim', 'selesai'));

-- Update existing QRIS orders that are still 'pending' to 'menunggu_pembayaran'
update public.orders
set status = 'menunggu_pembayaran'
where payment_method = 'qris'
  and status = 'pending'
  and payment_status = 'pending';

-- ============================================================
-- 8. DELIVERY METHOD CONSTRAINT
-- ============================================================

alter table public.orders
add column if not exists delivery_method text not null default 'ambil_sendiri',
add column if not exists class_location text;

alter table public.orders
drop constraint if exists orders_delivery_method_check;

alter table public.orders
add constraint orders_delivery_method_check
  check (delivery_method in ('antar_ke_kelas', 'ambil_sendiri'));

-- ============================================================
-- 9. VERIFICATION QUERIES
-- ============================================================

-- Verify tables
select 'profiles' as table_name, count(*) from public.profiles
union all select 'categories', count(*) from public.categories
union all select 'products', count(*) from public.products
union all select 'orders', count(*) from public.orders
union all select 'banners', count(*) from public.banners;

-- Verify admin user
select id, role, name from public.profiles where id = 'd8bef9dd-d609-4007-9566-2a584f78cfba';

-- Verify categories
select name from public.categories order by sort_order;