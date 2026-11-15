-- Seed default categories & products
-- Run after initial schema migration

-- Seed categories
INSERT INTO public.categories (id, name, icon, active) VALUES
  (gen_random_uuid(), 'Makanan Berat', 'rice_bowl', true),
  (gen_random_uuid(), 'Cemilan', 'bakery_dining', true),
  (gen_random_uuid(), 'Kopi', 'coffee', true),
  (gen_random_uuid(), 'Teh', 'local_cafe', true),
  (gen_random_uuid(), 'Jus', 'local_bar', true),
  (gen_random_uuid(), 'Dessert', 'icecream', true),
  (gen_random_uuid(), 'Paket Hemat', 'percent', true),
  (gen_random_uuid(), 'Lainnya', 'apps', true)
ON CONFLICT DO NOTHING;

-- Seed initial products
INSERT INTO public.products (category_id, name, description, price, image_url, is_active, stock)
SELECT
  c.id,
  p.name,
  p.description,
  p.price,
  p.image_url,
  p.is_active,
  p.stock
FROM (VALUES
  ('Makanan Berat', 'Es Mamu', 'Es mamu segar dan manis', 2500, '', true, 100),
  ('Makanan Berat', 'Pisang Nugget', 'Pisang nugget crispy gurih', 3000, '', true, 100)
) AS p(category_name, name, description, price, image_url, is_active, stock)
JOIN public.categories c ON c.name = p.category_name
ON CONFLICT DO NOTHING;

-- Verify
select 'categories' as table_name, count(*) as count from public.categories
union all
select 'products', count(*) from public.products;