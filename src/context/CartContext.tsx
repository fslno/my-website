'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  increment,
  serverTimestamp,
  getDocs,
  writeBatch,
  query,
  orderBy
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
  createdAt?: any;
  customizationEnabled?: boolean;
  logistics?: {
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
  };
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
  updateCartItem: (variantId: string, updates: Partial<CartItem>) => void;
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

  // Firestore Persistence & Config - Ordered New to Old
  const cartQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'cart'), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const promoConfigRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'config', 'promotions');
  }, [db]);

  const { data: dbItems, isLoading: isSyncing } = useCollection(cartQuery);
  const { data: promoConfig } = useDoc(promoConfigRef);

  const cartData = user 
    ? (dbItems || []).map(item => ({
        ...item,
        id: item.productId || item.id 
      })) as CartItem[]
    : localCart;

  // --- BOGO & PROMO LOGIC ---
  const cart = useMemo(() => {
    if (!promoConfig || !promoConfig.bogoEnabled) {
      return cartData.filter(i => !i.isPromo);
    }

    const { bogoMinQty, bogoCategoryIds, bogoItemName } = promoConfig;

    // Identify qualifying items
    const qualifyingCount = cartData.reduce((acc, item) => {
      // Authoritative Category Evaluation
      const isQualifyingCategory = Array.isArray(bogoCategoryIds) 
        ? bogoCategoryIds.includes(item.categoryId)
        : item.categoryId === promoConfig.bogoCategoryId; // Legacy fallback

      if (isQualifyingCategory) {
        return acc + item.quantity;
      }
      return acc;
    }, 0);

    const hasBogoQualify = qualifyingCount >= (bogoMinQty || 2);
    const existingPromo = cartData.find(i => i.isPromo);

    if (hasBogoQualify && !existingPromo) {
      // Prepend reward to keep "New" items at the top
      return [{
        id: 'promo-reward',
        variantId: 'promo-reward-free',
        name: bogoItemName || 'Archive Reward',
        price: 0,
        quantity: 1,
        image: 'https://placehold.co/400x400?text=ARCHIVE+REWARD',
        size: 'OS',
        isPromo: true,
        createdAt: Date.now()
      }, ...cartData];
    }

    if (!hasBogoQualify && existingPromo) {
      return cartData.filter(i => !i.isPromo);
    }

    return cartData;
  }, [cartData, promoConfig]);

  const cartSubtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);

  // Threshold Discount Logic
  const thresholdValue = promoConfig?.thresholdEnabled ? (promoConfig.thresholdValue || 1000) : Infinity;
  const thresholdDiscountValue = promoConfig?.thresholdEnabled ? (promoConfig.thresholdDiscount || 100) : 0;
  
  const thresholdDiscount = cartSubtotal >= thresholdValue ? thresholdDiscountValue : 0;

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
  
  // Progress tracking for UI
  const effectiveThreshold = promoConfig?.thresholdEnabled ? (promoConfig.thresholdValue || 1000) : 1000;
  const thresholdProgress = Math.min(100, (cartSubtotal / effectiveThreshold) * 100);

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
        const payload: any = {
          ...newItem,
          productId: newItem.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        // Authoritatively remove undefined fields to prevent Firestore errors
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

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
        // Prepend new item for "New to Old" guest experience
        return [{ ...newItem, quantity: 1, createdAt: Date.now() }, ...prev];
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

  const updateCartItem = (variantId: string, updates: Partial<CartItem>) => {
    if (user && db) {
      const itemRef = doc(db, 'users', user.uid, 'cart', variantId);
      updateDoc(itemRef, { ...updates, updatedAt: serverTimestamp() }).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: itemRef.path,
          operation: 'update',
          requestResourceData: updates
        }));
      });
    } else {
      setLocalCart(prev => prev.map(item => item.variantId === variantId ? { ...item, ...updates } : item));
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
      cart, addToCart, removeFromCart, updateCartItem, clearCart, 
      cartCount, cartSubtotal, discountTotal, totalBeforeTax, 
      isSyncing, appliedCoupon, applyCoupon: setAppliedCoupon,
      thresholdProgress, THRESHOLD_VALUE: effectiveThreshold
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
