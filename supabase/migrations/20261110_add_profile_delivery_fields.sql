-- Add delivery info fields to profiles table for checkout pre-fill
alter table public.profiles
add column if not exists grade text,
add column if not exists major text,
add column if not exists room text;