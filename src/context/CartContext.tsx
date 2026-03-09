
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  categoryId?: string;
  customName?: string;
  customNumber?: string;
  specialNote?: string;
  productId?: string;
  isPromo?: boolean;
}

export interface Coupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  active: boolean;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  discountTotal: number;
  totalBeforeTax: number;
  isSyncing: boolean;
  appliedCoupon: Coupon | null;
  applyCoupon: (coupon: Coupon | null) => void;
  thresholdProgress: number;
  THRESHOLD_VALUE: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const THRESHOLD_VALUE = 1000;
const THRESHOLD_DISCOUNT = 100;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const db = useFirestore();
  const { user } = useUser();
  const [localCart, setLocalCart] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Persistence for Guest Users
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

  // Firestore Persistence
  const cartQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'cart');
  }, [db, user]);

  const { data: dbItems, isLoading: isSyncing } = useCollection(cartQuery);

  const cartData = user 
    ? (dbItems || []).map(item => ({
        ...item,
        id: item.productId || item.id 
      })) as CartItem[]
    : localCart;

  // --- BOGO & PROMO LOGIC ---
  const cart = useMemo(() => {
    // 1. Identify "Jersey" items
    // For this prototype, we'll look for items with category name containing "Jersey" 
    // or specific logic. In production, this would be categoryId based.
    const jerseyCount = cartData.reduce((acc, item) => {
      if (item.name.toLowerCase().includes('jersey') || item.categoryId === 'jerseys-cat-id') {
        return acc + item.quantity;
      }
      return acc;
    }, 0);

    const hasBogoQualify = jerseyCount >= 2;
    const existingPromo = cartData.find(i => i.isPromo);

    // If qualify but no promo in cart, we inject it visually here (context level)
    // or we could force a write. For non-blocking responsiveness, we'll handle it in the calc.
    if (hasBogoQualify && !existingPromo) {
      return [...cartData, {
        id: 'promo-scarf',
        variantId: 'promo-scarf-free',
        name: 'Technical Archive Scarf (BOGO Reward)',
        price: 0,
        quantity: 1,
        image: 'https://picsum.photos/seed/scarf/400/400',
        size: 'OS',
        isPromo: true
      }];
    }

    // If not qualify but promo exists, filter it out
    if (!hasBogoQualify && existingPromo) {
      return cartData.filter(i => !i.isPromo);
    }

    return cartData;
  }, [cartData]);

  const cartSubtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);

  // Threshold Discount Logic
  const thresholdDiscount = cartSubtotal >= THRESHOLD_VALUE ? THRESHOLD_DISCOUNT : 0;

  // Coupon Calculation
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percent') {
      return (cartSubtotal * appliedCoupon.value) / 100;
    }
    return Math.min(appliedCoupon.value, cartSubtotal);
  }, [appliedCoupon, cartSubtotal]);

  const discountTotal = thresholdDiscount + couponDiscount;
  const totalBeforeTax = Math.max(0, cartSubtotal - discountTotal);
  
  const thresholdProgress = Math.min(100, (cartSubtotal / THRESHOLD_VALUE) * 100);

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
          updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
          return updated;
        }
        return [...prev, { ...newItem, quantity: 1 }];
      });
    }
  };

  const removeFromCart = (variantId: string) => {
    if (user && db) {
      const itemRef = doc(db, 'users', user.uid, 'cart', variantId);
      deleteDoc(itemRef);
    } else {
      setLocalCart(prev => prev.filter(item => item.variantId !== variantId));
    }
  };

  const clearCart = async () => {
    if (user && db) {
      const cartRef = collection(db, 'users', user.uid, 'cart');
      const snapshot = await getDocs(cartRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      batch.commit();
    } else {
      setLocalCart([]);
      localStorage.removeItem('fslno_cart');
    }
    setAppliedCoupon(null);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, removeFromCart, clearCart, 
      cartCount, cartSubtotal, discountTotal, totalBeforeTax, 
      isSyncing, appliedCoupon, applyCoupon: setAppliedCoupon,
      thresholdProgress, THRESHOLD_VALUE
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
