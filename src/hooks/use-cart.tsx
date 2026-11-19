'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { addToCart, addToCartWithOption, getCart, removeFromCart, clearCart, updateCartQty } from '@/lib/supabase/cart-actions';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/components/providers/supabase-provider';

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
  const { showToast } = useToast();
  const { session } = useSession();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMutationsRef = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const debouncedLoad = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      load();
    }, 150);
  }, [load]);

  useEffect(() => {
    if (!session?.user) return;

    const channel = supabase
      .channel('cart-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'carts', filter: `user_id=eq.${session.user.id}` },
        debouncedLoad
      )
      .subscribe();

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [session, debouncedLoad]);

  const optimisticAdd = (productId: string, qty: number, optionId?: string): string => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    pendingMutationsRef.current.add(tempId);

    setItems(prev => [
      ...prev,
      {
        cart_id: tempId,
        product_id: productId,
        qty,
        option_id: optionId,
        option_name: '',
        option_signature: optionId || '',
        product: { id: productId, name: 'Loading...', price: 0, stock: 999, image_url: '', is_active: true },
      },
    ]);

    return tempId;
  };

  const optimisticUpdate = (cartId: string, qty: number) => {
    if (qty < 1) return;
    setItems(prev => prev.map(item => (item.cart_id === cartId ? { ...item, qty } : item)));
  };

  const optimisticRemove = (cartId: string) => {
    setItems(prev => prev.filter(item => item.cart_id !== cartId));
  };

  const rollbackAdd = (tempId: string) => {
    pendingMutationsRef.current.delete(tempId);
    optimisticRemove(tempId);
  };

  const add = async (productId: string, qty: number = 1) => {
    const tempId = optimisticAdd(productId, qty);
    const res = await addToCart(productId, qty);
    pendingMutationsRef.current.delete(tempId);
    if (res.error) {
      setError(res.error);
      rollbackAdd(tempId);
      showToast(res.error, 'error');
    } else {
      await load();
      showToast('Ditambahkan ke keranjang', 'success');
    }
  };

  const addWithOption = async (productId: string, qty: number, optionId?: string) => {
    const tempId = optimisticAdd(productId, qty, optionId);
    const res = await addToCartWithOption(productId, qty, optionId);
    pendingMutationsRef.current.delete(tempId);
    if (res.error) {
      setError(res.error);
      rollbackAdd(tempId);
      showToast(res.error, 'error');
    } else {
      await load();
      showToast('Ditambahkan ke keranjang', 'success');
    }
  };

  const update = async (cartId: string, qty: number) => {
    const isTemp = cartId.startsWith('temp-');
    if (!isTemp) optimisticUpdate(cartId, qty);

    const res = await updateCartQty(cartId, qty);
    if (res.error) {
      setError(res.error);
      if (!isTemp) await load();
      showToast(res.error, 'error');
    }
  };

  const remove = async (cartId: string) => {
    const isTemp = cartId.startsWith('temp-');
    if (!isTemp) optimisticRemove(cartId);

    const res = await removeFromCart(cartId);
    if (res.error) {
      setError(res.error);
      if (!isTemp) await load();
      showToast(res.error, 'error');
    } else {
      showToast('Dihapus dari keranjang', 'success');
    }
  };

  const clear = async () => {
    const res = await clearCart();
    if (res.error) {
      setError(res.error);
      showToast(res.error, 'error');
    } else {
      await load();
      showToast('Keranjang dikosongkan', 'success');
    }
  };

  const refresh = async () => {
    await load();
  };

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        error,
        selectedCartIds,
        setSelectedCartIds,
        add,
        addWithOption,
        update,
        remove,
        clear,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}