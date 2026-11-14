-- Add QRIS columns to orders table
alter table public.orders
add column if not exists qris_image_url text,
add column if not exists qris_proof_url text,
add column if not exists qris_proof_uploaded_at timestamptz;

-- Drop existing constraint FIRST
alter table public.orders
drop constraint if exists orders_payment_method_check;

-- Update existing 'midtrans' payment_method to 'qris'
update public.orders
set payment_method = 'qris'
where payment_method = 'midtrans';

-- Also fix any invalid payment_method values (like 'ambil_sendiri')
update public.orders
set payment_method = 'cod'
where payment_method not in ('qris', 'cod');

-- Add new constraint
alter table public.orders
add constraint orders_payment_method_check 
  check (payment_method in ('qris','cod'));