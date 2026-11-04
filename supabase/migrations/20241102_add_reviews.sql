-- Add reviews table and policies
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  order_item_id uuid NOT NULL REFERENCES public.order_items(id),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_visible boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, order_item_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public read visible reviews
CREATE POLICY "public read visible reviews" ON public.reviews
  FOR SELECT USING (is_visible = true);

-- Users read own reviews (even hidden)
CREATE POLICY "user read own reviews" ON public.reviews
  FOR SELECT USING (user_id = auth.uid());

-- Users can create review only for completed order items they own
CREATE POLICY "user create review for completed order" ON public.reviews
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.id = order_item_id
        AND oi.product_id = product_id
        AND o.user_id = auth.uid()
        AND o.status = 'selesai'
    )
  );

-- Users can update own reviews
CREATE POLICY "user update own review" ON public.reviews
  FOR UPDATE USING (user_id = auth.uid());

-- Admin full access
CREATE POLICY "admin full" ON public.reviews
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Indexes for performance
CREATE INDEX idx_reviews_product_visible ON public.reviews(product_id, is_visible);
CREATE INDEX idx_reviews_user_product ON public.reviews(user_id, product_id);
