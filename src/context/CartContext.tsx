
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  increment,
  serverTimestamp,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface CartItem {
  id: string; // Product ID
  variantId: string; // Unique ID (Product + Size + Customization)
  name: string;
  price: number;
  quantity: number;
  image: string;
  size: string;
  customName?: string;
  customNumber?: string;
  specialNote?: string;
  productId?: string; // Internal mapping for Firestore persistence
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  isSyncing: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const db = useFirestore();
  const { user } = useUser();
  const [localCart, setLocalCart] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Persistence for Guest Users (Local Storage)
  useEffect(() => {
    const saved = localStorage.getItem('fslno_cart');
    if (saved) {
      try {
        setLocalCart(JSON.parse(saved));
      } catch (e) {
        console.error("Guest cart hydration failed", e);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized && !user) {
      localStorage.setItem('fslno_cart', JSON.stringify(localCart));
    }
  }, [localCart, isInitialized, user]);

  // Firestore Persistence for Authenticated Users
  const cartQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'cart');
  }, [db, user]);

  const { data: dbItems, isLoading: isSyncing } = useCollection(cartQuery);

  // Effective Cart: Prefer Firestore data if logged in, otherwise use local state.
  const cart = user 
    ? (dbItems || []).map(item => ({
        ...item,
        id: item.productId || item.id 
      })) as CartItem[]
    : localCart;

  const addToCart = (newItem: CartItem) => {
    if (user && db) {
      const itemRef = doc(db, 'users', user.uid, 'cart', newItem.variantId);
      const existing = (dbItems || []).find(i => i.id === newItem.variantId);
      
      if (existing) {
        updateDoc(itemRef, { 
          quantity: increment(1), 
          updatedAt: serverTimestamp() 
        }).catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: itemRef.path,
            operation: 'update',
            requestResourceData: { quantity: existing.quantity + 1 }
          }));
        });
      } else {
        const payload = {
          ...newItem,
          productId: newItem.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        setDoc(itemRef, payload).catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: itemRef.path,
            operation: 'create',
            requestResourceData: payload
          }));
        });
      }
    } else {
      setLocalCart(prev => {
        const existingIndex = prev.findIndex(i => i.variantId === newItem.variantId);
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
    }
  };

  const removeFromCart = (variantId: string) => {
    if (user && db) {
      const itemRef = doc(db, 'users', user.uid, 'cart', variantId);
      deleteDoc(itemRef).catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: itemRef.path,
          operation: 'delete'
        }));
      });
    } else {
      setLocalCart(prev => prev.filter(item => item.variantId !== variantId));
    }
  };

  const clearCart = async () => {
    if (user && db) {
      const cartRef = collection(db, 'users', user.uid, 'cart');
      const snapshot = await getDocs(cartRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      batch.commit().catch(() => {
        // Silently fail or log
      });
    } else {
      setLocalCart([]);
      localStorage.removeItem('fslno_cart');
    }
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartCount, cartSubtotal, isSyncing }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
