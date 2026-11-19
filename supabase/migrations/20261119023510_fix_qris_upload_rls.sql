-- Fix RLS policy for QRIS upload flow
-- Allow users to update their own orders for both:
-- 1. Upload proof: payment_status = 'awaiting_confirmation' + qris_proof_url + qris_proof_uploaded_at
-- 2. Confirm payment: payment_status = 'paid' + status = 'diproses' + qris_verified_at

drop policy if exists "user update own qris" on public.orders;

create policy "user update own qris" on public.orders
for update using (auth.uid() = user_id and payment_method = 'qris')
with check (
  auth.uid() = user_id
  and payment_method = 'qris'
  and (
    -- Upload proof flow: set awaiting_confirmation + proof URL
    (payment_status = 'awaiting_confirmation' and qris_proof_url is not null and qris_proof_uploaded_at is not null)
    or
    -- Confirm payment flow: set paid + diproses + verified
    (payment_status = 'paid' and status = 'diproses' and qris_verified_at is not null)
  )
);