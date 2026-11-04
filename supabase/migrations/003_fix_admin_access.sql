-- Fix: Allow admin to manage all profiles including role changes
-- This enables admin to promote/demote other users

-- Drop existing policies first
drop policy if exists "allow admin select all" on public.profiles;
drop policy if exists "allow admin update all" on public.profiles;
drop policy if exists "allow admin insert and update all" on public.profiles;

-- Create non-recursive admin policies using auth.jwt() claim
create policy "allow admin select all" on public.profiles
  for select using (
    auth.uid() = id OR (auth.jwt() ->> 'role') = 'admin'
  );

create policy "allow admin update all" on public.profiles
  for update using (
    auth.uid() = id OR (auth.jwt() ->> 'role') = 'admin'
  )
  with check (
    auth.uid() = id OR (auth.jwt() ->> 'role') = 'admin'
  );

-- Note: To make yourself admin for the first time, run this in SQL editor:
-- UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid();
