import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from './api';
import { authClient } from './auth-client';
import { Product, ServerCart } from './types';

export interface CartItem {
  itemId?: string;
  productId: string;
  slug: string;
  title: string;
  price: number;
  discountPrice?: number | null;
  image?: string;
  quantity: number;
  sellerName?: string;
  stock: number;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
  totalCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'lucent_cart_items';
const MAX_CART_QTY = 20;

function mapServerCart(cart: ServerCart | null): CartItem[] {
  if (!cart?.items) return [];
  return cart.items.map((ci) => {
    const p = ci.product;
    const primaryImg = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url;
    const effectivePrice = p.discountPrice != null && p.discountPrice > 0 ? p.discountPrice : p.price;
    return {
      itemId: ci.id,
      productId: ci.productId,
      slug: p.slug,
      title: p.title,
      price: effectivePrice,
      discountPrice: p.discountPrice,
      image: primaryImg,
      quantity: ci.quantity,
      sellerName: p.seller?.storeName,
      stock: p.stock,
    };
  });
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user?.id;

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [localLoaded, setLocalLoaded] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await api.getCart();
      if (res.data) {
        setItems(mapServerCart(res.data));
      }
    } catch (err) {
      console.error('Failed to load server cart:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load local cart when signed out; merge & sync with server cart when signed in
  useEffect(() => {
    if (isPending) return;

    let cancelled = false;
    async function initCart() {
      if (userId) {
        setLoading(true);
        try {
          const stored = await SecureStore.getItemAsync(CART_STORAGE_KEY);
          if (stored) {
            const guestItems: CartItem[] = JSON.parse(stored);
            if (Array.isArray(guestItems) && guestItems.length > 0) {
              for (const gi of guestItems) {
                await api.addToCart(gi.productId, gi.quantity);
              }
            }
            await SecureStore.deleteItemAsync(CART_STORAGE_KEY);
          }
          const res = await api.getCart();
          if (!cancelled && res.data) {
            setItems(mapServerCart(res.data));
          }
        } catch (err) {
          console.error('Failed to sync server cart:', err);
        } finally {
          if (!cancelled) {
            setLoading(false);
            setLocalLoaded(true);
          }
        }
      } else {
        try {
          const stored = await SecureStore.getItemAsync(CART_STORAGE_KEY);
          if (!cancelled && stored) {
            setItems(JSON.parse(stored));
          }
        } catch (err) {
          console.error('Failed to load local cart:', err);
        } finally {
          if (!cancelled) setLocalLoaded(true);
        }
      }
    }

    void initCart();
    return () => {
      cancelled = true;
    };
  }, [userId, isPending]);

  // Persist guest cart only when signed out
  useEffect(() => {
    if (!localLoaded || userId) return;
    SecureStore.setItemAsync(CART_STORAGE_KEY, JSON.stringify(items)).catch((err) =>
      console.error('Failed to save local cart:', err)
    );
  }, [items, localLoaded, userId]);

  const addToCart = (product: Product, quantity = 1) => {
    const cap = Math.min(Math.max(1, product.stock), MAX_CART_QTY);
    const primaryImg = product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url;
    const effectivePrice =
      product.discountPrice != null && product.discountPrice > 0 ? product.discountPrice : product.price;

    let previous: CartItem[] = [];
    setItems((prev) => {
      previous = prev;
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        const newQty = Math.min(cap, existing.quantity + quantity);
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: newQty } : i));
      }
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          title: product.title,
          price: effectivePrice,
          discountPrice: product.discountPrice,
          image: primaryImg,
          quantity: Math.min(cap, quantity),
          sellerName: product.seller?.storeName,
          stock: product.stock,
        },
      ];
    });

    if (userId) {
      void api.addToCart(product.id, Math.min(cap, quantity)).then((res) => {
        if (res.error) {
          setItems(previous);
          Alert.alert('Could not add to cart', res.error);
          return;
        }
        // Cart mutations only return { success }; re-fetch the real cart.
        void refreshCart();
      });
    }
  };

  const removeFromCart = (productId: string) => {
    const target = items.find((i) => i.productId === productId);
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    if (userId) {
      const finish = (error?: string) => {
        if (error) {
          setItems((prev) => (target ? [...prev, target] : prev));
          Alert.alert('Could not remove item', error);
          return;
        }
        void refreshCart();
      };
      if (target?.itemId) {
        void api.removeCartItem(target.itemId).then((res) => finish(res.error ?? undefined));
      } else {
        // Legacy guest item that was never synced to the server.
        void refreshCart().then(() => finish());
      }
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const target = items.find((i) => i.productId === productId);
    if (!target) return;
    const cap = Math.min(Math.max(1, target.stock), MAX_CART_QTY);
    const clampedQty = Math.min(cap, quantity);

    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: clampedQty } : item,
      ),
    );
    if (userId) {
      if (target.itemId) {
        void api.updateCartItem(target.itemId, clampedQty).then((res) => {
          if (res.error) {
            setItems((prev) =>
              prev.map((item) =>
                item.productId === productId ? { ...item, quantity: target.quantity } : item,
              ),
            );
            Alert.alert('Could not update quantity', res.error);
            return;
          }
          void refreshCart();
        });
      } else {
        void refreshCart();
      }
    }
  };

  const clearCart = () => {
    const previous = items;
    setItems([]);
    if (userId) {
      void api.clearCart().then((res) => {
        if (res.error) {
          setItems(previous);
          Alert.alert('Could not clear cart', res.error);
        }
      });
    }
  };

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
        totalCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
