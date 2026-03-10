'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  serverTimestamp 
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface WishlistItem {
  id: string; // Product ID
  name: string;
  price: number;
  image: string;
  brand?: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  toggleWishlist: (item: WishlistItem) => void;
  isInWishlist: (productId: string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const db = useFirestore();
  const { user } = useUser();
  const [localWishlist, setLocalWishlist] = useState<WishlistItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync Guest Wishlist with Local Storage
  useEffect(() => {
    const saved = localStorage.getItem('fslno_wishlist');
    if (saved) {
      try {
        setLocalWishlist(JSON.parse(saved));
      } catch (e) {
        console.error("Guest wishlist hydration failed", e);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized && !user) {
      localStorage.setItem('fslno_wishlist', JSON.stringify(localWishlist));
    }
  }, [localWishlist, isInitialized, user]);

  // Firestore Persistence for Auth Users
  const wishlistQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'wishlist');
  }, [db, user]);

  const { data: dbItems } = useCollection(wishlistQuery);

  const wishlist = user 
    ? (dbItems || []) as WishlistItem[]
    : localWishlist;

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item.id === productId);
  };

  const toggleWishlist = (item: WishlistItem) => {
    const alreadyIn = isInWishlist(item.id);

    if (user && db) {
      const itemRef = doc(db, 'users', user.uid, 'wishlist', item.id);
      if (alreadyIn) {
        deleteDoc(itemRef).catch(() => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: itemRef.path,
            operation: 'delete'
          }));
        });
      } else {
        const payload: any = {
          ...item,
          createdAt: serverTimestamp()
        };

        // Authoritatively remove undefined fields to prevent Firestore errors
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

        setDoc(itemRef, payload).catch(() => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: itemRef.path,
            operation: 'create',
            requestResourceData: payload
          }));
        });
      }
    } else {
      // Guest Logic
      setLocalWishlist(prev => {
        if (alreadyIn) {
          return prev.filter(i => i.id !== item.id);
        }
        return [...prev, item];
      });
    }
  };

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, wishlistCount }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};
