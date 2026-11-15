-- FIX QRIS FLOW + REVIEWS (idempotent)
-- Aligns DB with app: allows payment_status 'awaiting_confirmation',
-- ensures QRIS columns, makes qris-proofs bucket public with correct policies,
-- and recreates the reviews table if missing.

create extension if not exists "uuid-ossp";

-- 1) Allow payment_status 'awaiting_confirmation'
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status in ('pending','paid','expired','failed','awaiting_confirmation'));

-- 2) Ensure QRIS columns exist
alter table public.orders
  add column if not exists qris_proof_url text,
  add column if not exists qris_proof_uploaded_at timestamptz,
  add column if not exists qris_verified_at timestamptz;

-- 3) qris-proofs bucket public + policies
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('qris-proofs','qris-proofs', true, 5242880,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','image/heif'];

drop policy if exists "Authenticated users can upload qris proofs" on storage.objects;
create policy "Authenticated users can upload qris proofs"
on storage.objects for insert to authenticated
with check (bucket_id = 'qris-proofs' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can view own qris proofs" on storage.objects;
create policy "Users can view own qris proofs"
on storage.objects for select to authenticated
using (bucket_id = 'qris-proofs' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Admin can view all qris proofs" on storage.objects;
create policy "Admin can view all qris proofs"
on storage.objects for select to authenticated
using (bucket_id = 'qris-proofs' and exists (
  select 1 from public.profiles where id = auth.uid() and role = 'admin'
));

drop policy if exists "Users can delete own qris proofs" on storage.objects;
create policy "Users can delete own qris proofs"
on storage.objects for delete to authenticated
using (bucket_id = 'qris-proofs' and auth.uid()::text = (storage.foldername(name))[1]);

-- 4) Ensure reviews table + policies + indexes
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id),
  product_id uuid not null references public.products(id),
  order_id uuid not null references public.orders(id),
  order_item_id uuid not null references public.order_items(id),
  rating integer not null check (rating between 1 and 5),
  comment text,
  is_visible boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, order_item_id)
);

alter table public.reviews enable row level security;

drop policy if exists "public read visible reviews" on public.reviews;
create policy "public read visible reviews" on public.reviews
  for select using (is_visible = true);

drop policy if exists "user read own reviews" on public.reviews;
create policy "user read own reviews" on public.reviews
  for select using (user_id = auth.uid());

drop policy if exists "user create review for completed order" on public.reviews;
create policy "user create review for completed order" on public.reviews
  for insert with check (
    user_id = auth.uid() and exists (
      select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = order_item_id
        and oi.product_id = product_id
        and o.user_id = auth.uid()
        and o.status = 'selesai'
    )
  );

drop policy if exists "user update own review" on public.reviews;
create policy "user update own review" on public.reviews
  for update using (user_id = auth.uid());

drop policy if exists "admin full" on public.reviews;
create policy "admin full" on public.reviews
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create index if not exists idx_reviews_product_visible on public.reviews(product_id, is_visible);
create index if not exists idx_reviews_user_product on public.reviews(user_id, product_id);

-- Reload PostgREST schema cache so 404 on reviews disappears
notify pgrst, 'reload schema';
