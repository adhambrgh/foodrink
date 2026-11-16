'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { addToCart, addToCartWithOption, getCart, removeFromCart, clearCart, updateCartQty } from '@/lib/supabase/cart-actions';

interface CartItem {
  cart_id: string;
  product_id: string;
  qty: number;
  option_id?: string;
  option_name?: string;
  option_signature: string;
  product: any;
}

interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  error?: string;
  selectedCartIds: string[];
  setSelectedCartIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  add: (productId: string, qty?: number) => Promise<void>;
  addWithOption: (productId: string, qty: number, optionId?: string) => Promise<void>;
  update: (cartId: string, qty: number) => Promise<void>;
  remove: (cartId: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedCartIds, setSelectedCartIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const load = async () => {
    setLoading(true);
    const res = await getCart();
    if (res.error) {
      setError(res.error);
      setItems([]);
    } else {
      setItems(res.items);
      setError(undefined);
    }
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

  const addWithOption = async (productId: string, qty: number, optionId?: string) => {
    const res = await addToCartWithOption(productId, qty, optionId);
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

  const refresh = async () => {
    await load();
  };

  return (
    <CartContext.Provider value={{ items, loading, error, selectedCartIds, setSelectedCartIds, add, addWithOption, update, remove, clear, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}