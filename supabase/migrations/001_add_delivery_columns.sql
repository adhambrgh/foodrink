-- Add delivery columns to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_method TEXT NOT NULL DEFAULT 'ambil_sendiri',
  ADD COLUMN IF NOT EXISTS class_location TEXT;

-- Add check constraint for delivery_method
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_delivery_method_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_delivery_method_check
    CHECK (delivery_method IN ('antar_ke_kelas', 'ambil_sendiri'));

-- Seed default categories
INSERT INTO categories (id, name, icon, active)
VALUES
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
INSERT INTO products (category_id, name, description, price, image_url, is_active, stock)
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
JOIN categories c ON c.name = p.category_name
ON CONFLICT DO NOTHING;
