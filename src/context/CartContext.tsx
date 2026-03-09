'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  id: string;
  variantId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (newItem: CartItem) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(
        i => i.id === newItem.id && i.variantId === newItem.variantId
      );
      
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
        };
        return updated;
      }
      
      return [...prev, { ...newItem, quantity: 1 }];
    });
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
