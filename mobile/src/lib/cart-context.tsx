import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Product } from './types';

export interface CartItem {
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
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'lucent_cart_items';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load cart from persistent storage on mount
  useEffect(() => {
    async function loadCart() {
      try {
        const stored = await SecureStore.getItemAsync(CART_STORAGE_KEY);
        if (stored) {
          setItems(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to load cart from storage:', err);
      } finally {
        setLoaded(true);
      }
    }
    loadCart();
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    if (!loaded) return;
    SecureStore.setItemAsync(CART_STORAGE_KEY, JSON.stringify(items)).catch((err) =>
      console.error('Failed to save cart:', err)
    );
  }, [items, loaded]);

  const addToCart = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      const primaryImg = product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url;
      const effectivePrice = product.discountPrice != null && product.discountPrice > 0 ? product.discountPrice : product.price;

      if (existing) {
        const newQty = Math.min(product.stock || 99, existing.quantity + quantity);
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
          quantity: Math.min(product.stock || 99, quantity),
          sellerName: product.seller?.storeName || 'Lucent Partner',
          stock: product.stock || 10,
        },
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          return { ...item, quantity: Math.min(item.stock || 99, quantity) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
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
