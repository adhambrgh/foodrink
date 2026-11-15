-- Add 'menunggu_pembayaran' to orders.status check constraint
-- Keep 'pending' for backward compatibility with existing orders

alter table public.orders
drop constraint if exists orders_status_check;

alter table public.orders
add constraint orders_status_check 
  check (status in ('pending', 'menunggu_pembayaran', 'diproses', 'dikirim', 'selesai'));

-- Update existing QRIS orders that are still 'pending' to 'menunggu_pembayaran'
-- (only if they haven't been paid/confirmed yet)
update public.orders
set status = 'menunggu_pembayaran'
where payment_method = 'qris' 
  and status = 'pending' 
  and payment_status = 'pending';