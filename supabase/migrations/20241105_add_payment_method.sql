-- Add payment_method column to orders table
alter table public.orders
add column if not exists payment_method text check (payment_method in ('midtrans','cod')) default 'midtrans';