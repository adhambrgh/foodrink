-- Add updated_at + midtrans columns to orders table
-- This migration ensures tracking columns exist before build
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'orders'
      and column_name = 'updated_at'
  ) then
    alter table public.orders
      add column if not exists midtrans_payment_type text,
      add column if not exists midtrans_status_message text,
      add column if not exists midtrans_transaction_time timestamptz,
      add column if not exists midtrans_fraud_status text,
      add column if not exists midtrans_transaction_id text,
      add column if not exists midtrans_raw_response jsonb,
      add column if not exists updated_at timestamptz default now();
  end if;
end $$;

-- Trigger to auto-update updated_at on row changes
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.orders;
create trigger set_updated_at
  before update on public.orders
  for each row
  execute function public.set_updated_at();
