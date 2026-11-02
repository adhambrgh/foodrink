-- Initial FoodDrink schema
-- Run in Supabase SQL editor or via CLI

-- Enable extensions
create extension if not exists "uuid-ossp";

-- profiles (linked to auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id),
  role text check (role in ('customer','admin')) default 'customer',
  name text,
  phone text,
  created_at timestamp with time zone default now()
);

-- categories
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  icon text,
  sort_order integer default 0,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- products
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.categories(id),
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  is_active boolean default true,
  stock integer default 0,
  created_at timestamp with time zone default now()
);

-- orders
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  status text check (status in ('pending','diproses','dikirim','selesai')) default 'pending',
  payment_status text check (payment_status in ('pending','paid','expired','failed')) default 'pending',
  total numeric(10,2),
  address text,
  notes text,
  created_at timestamp with time zone default now()
);

-- order_items
create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id),
  product_id uuid references public.products(id),
  name_snapshot text not null,
  price_snapshot numeric(10,2) not null,
  qty integer not null,
  subtotal numeric(10,2) not null
);

-- favorites
create table public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  product_id uuid references public.products(id),
  created_at timestamp with time zone default now()
);

-- trigger: create profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "allow select own profile" on public.profiles for select using (auth.uid() = id);
create policy "allow update own profile" on public.profiles for update using (auth.uid() = id);
create policy "allow admin select all" on public.profiles for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "allow admin update all" on public.profiles for update using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Similar policies for other tables (admin can read/write, customers read only their own data)

-- profiles RLS
alter table public.profiles force row level security;

-- categories RLS (admin full, public read active)
alter table public.categories enable row level security;
create policy "admin full" on public.categories for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "public read active" on public.categories for select using (active = true);
alter table public.categories force row level security;

-- products RLS (admin full, public read active)
alter table public.products enable row level security;
create policy "admin full" on public.products for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "public read active" on public.products for select using (is_active = true);
alter table public.products force row level security;

-- orders RLS (admin all, user own)
alter table public.orders enable row level security;
create policy "admin all" on public.orders for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "user own" on public.orders for all using (user_id = auth.uid());
alter table public.orders force row level security;

-- order_items RLS (admin all, user own via order)
alter table public.order_items enable row level security;
create policy "admin all" on public.order_items for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "user own via order" on public.order_items for select using (
  exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
);
alter table public.order_items force row level security;

-- favorites RLS (admin all, user own)
alter table public.favorites enable row level security;
create policy "admin all" on public.favorites for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "user own" on public.favorites for all using (user_id = auth.uid());
alter table public.favorites force row level security;
