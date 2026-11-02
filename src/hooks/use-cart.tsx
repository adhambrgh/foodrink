'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { addToCart, getCart, removeFromCart, updateCartQty, clearCart } from '@/lib/supabase/cart';

interface CartItem {
  cart_id: string;
  product_id: string;
  qty: number;
  product: any; // simplified, use proper type if needed
}

interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  error?: string;
  add: (productId: string, qty?: number) => Promise<void>;
  update: (cartId: string, qty: number) => Promise<void>;
  remove: (cartId: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const load = async () => {
    setLoading(true);
    const res = await getCart();
    if (res.error) setError(res.error);
    else setItems(res.items);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (productId: string, qty: number = 1) => {
    const res = await addToCart(productId, qty);
    if (res.error) setError(res.error);
    else await load();
  };

  const update = async (cartId: string, qty: number) => {
    const res = await updateCartQty(cartId, qty);
    if (res.error) setError(res.error);
    else await load();
  };

  const remove = async (cartId: string) => {
    const res = await removeFromCart(cartId);
    if (res.error) setError(res.error);
    else await load();
  };

  const clear = async () => {
    const res = await clearCart();
    if (res.error) setError(res.error);
    else await load();
  };

  return (
    <CartContext.Provider value={{ items, loading, error, add, update, remove, clear, refresh: load }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
