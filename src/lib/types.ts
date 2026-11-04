// Database types based on the Supabase schema
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export type Profile = {
  id: string;
  role: 'customer' | 'admin';
  name: string;
  phone: string;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  active: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_active: boolean;
  stock: number;
  created_at: string;
  categories?: { id: string; name: string; icon: string; active: boolean };
};

export type Order = {
  id: string;
  user_id: string;
  status: 'pending' | 'diproses' | 'dikirim' | 'selesai';
  payment_status: 'pending' | 'paid' | 'expired' | 'failed';
  total: number;
  delivery_method: 'antar_ke_kelas' | 'ambil_sendiri';
  class_location: string | null;
  notes: string;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  name_snapshot: string;
  price_snapshot: number;
  qty: number;
  subtotal: number;
};

export type Review = {
  id: string;
  user_id?: string;
  product_id?: string;
  order_id?: string;
  order_item_id: string;
  rating: number;
  comment?: string | null;
  is_visible?: boolean;
  created_at: string;
  updated_at?: string;
  profiles?: { name: string };
};

export type Favorite = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
};