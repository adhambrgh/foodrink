-- Add INSERT policy for order_items so users can create order items for their own orders
create policy "user insert own via order" on public.order_items for insert with check (
  exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
);