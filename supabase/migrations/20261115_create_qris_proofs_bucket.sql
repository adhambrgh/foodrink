-- Create qris-proofs storage bucket with proper policies
-- Run this in Supabase SQL Editor

-- 1. Create bucket if not exists
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'qris-proofs',
  'qris-proofs',
  true,
  5242880,  -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

-- 2. Enable RLS on storage.objects (if not already)
alter table storage.objects enable row level security;

-- 3. Drop existing policies
drop policy if exists "Authenticated users can upload qris proofs" on storage.objects;
drop policy if exists "Users can view own qris proofs" on storage.objects;
drop policy if exists "Admin can view all qris proofs" on storage.objects;
drop policy if exists "Users can delete own qris proofs" on storage.objects;

-- 4. Create new policies

-- Authenticated users can upload their own QRIS proofs
create policy "Authenticated users can upload qris proofs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'qris-proofs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own QRIS proofs
create policy "Users can view own qris proofs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'qris-proofs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Admin can view all QRIS proofs
create policy "Admin can view all qris proofs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'qris-proofs'
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Users can delete their own QRIS proofs
create policy "Users can delete own qris proofs"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'qris-proofs'
  and auth.uid()::text = (storage.foldername(name))[1]
);