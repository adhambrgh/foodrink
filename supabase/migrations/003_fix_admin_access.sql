-- Fix: Allow admin to manage all profiles including role changes
-- This enables admin to promote/demote other users

-- Add insert/update policy for admin on profiles
create policy "allow admin insert and update all" on public.profiles
  for all using (
    auth.uid() = id OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
with check (
    auth.uid() = id OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Note: To make yourself admin for the first time, run this in SQL editor:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
