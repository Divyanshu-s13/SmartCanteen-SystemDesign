'use client';

/**
 * Cart Context
 * Manages shopping cart state
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { storage } from '@/lib/utils';
import type { MenuItem, CartItem } from '@/types';

const CART_KEY = 'smartcanteen_cart';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  addItem: (menuItem: MenuItem, quantity?: number) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (menuItemId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from storage on mount
  useEffect(() => {
    const savedCart = storage.get<CartItem[]>(CART_KEY);
    if (savedCart) {
      setItems(savedCart);
    }
  }, []);

  // Save cart to storage when it changes
  useEffect(() => {
    storage.set(CART_KEY, items);
  }, [items]);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  const totalPrice = items.reduce(
    (total, item) => total + item.menuItem.price * item.quantity,
    0
  );

  const addItem = useCallback((menuItem: MenuItem, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.menuItem.id === menuItem.id
      );

      if (existingIndex >= 0) {
        // Update existing item quantity
        const newItems = [...prevItems];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + quantity,
        };
        return newItems;
      }

      // Add new item
      return [...prevItems, { menuItem, quantity }];
    });
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => item.menuItem.id !== menuItemId)
    );
  }, []);

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.menuItem.id === menuItemId ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    storage.remove(CART_KEY);
  }, []);

  const getItemQuantity = useCallback(
    (menuItemId: string) => {
      const item = items.find((item) => item.menuItem.id === menuItemId);
      return item?.quantity || 0;
    },
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        totalPrice,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
