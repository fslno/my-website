'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { initializeFirebase } from '@/firebase';
import { 
  doc, 
  setDoc, 
  serverTimestamp, 
  increment, 
  updateDoc 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * RealTimeTracker
 * 
 * An invisible component that tracks visitor presence and catalog impressions.
 * Used to power the Admin Analytics dashboard with live data.
 */
export function RealTimeTracker() {
  const pathname = usePathname();
  const sessionIdRef = useRef<string | null>(null);
  const { firestore, auth } = initializeFirebase();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initialize Session
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Use existing session ID or create new one
    let sessionId = sessionStorage.getItem('fslno_session_id');
    if (!sessionId) {
      sessionId = `sess_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      sessionStorage.setItem('fslno_session_id', sessionId);
    }
    sessionIdRef.current = sessionId;

    // Register initial session
    const registerSession = async () => {
      const today = new Date().toISOString().split('T')[0];
      const dailyRef = doc(firestore, 'analytics', 'counters', 'daily', today);
      
      try {
        // Mark session start
        await setDoc(dailyRef, { sessions: increment(1) }, { merge: true });
      } catch (err) {
        console.error('[TRACKER_SESSION_ERR]', err);
      }
    };

    registerSession();

    // Heartbeat every 45 seconds
    heartbeatIntervalRef.current = setInterval(async () => {
      if (!sessionIdRef.current) return;
      
      const presenceRef = doc(firestore, 'analytics_presence', sessionIdRef.current);
      try {
        await setDoc(presenceRef, {
          lastActive: serverTimestamp(),
          path: window.location.pathname,
          uid: auth.currentUser?.uid || null,
          userAgent: navigator.userAgent
        }, { merge: true });
      } catch (err) {
        // Fail silently in production
      }
    }, 45000);

    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, [firestore, auth]);

  // 2. Track Impressions (Catalog Views)
  useEffect(() => {
    if (!pathname) return;

    const isCatalogPath = pathname.startsWith('/products') || pathname.startsWith('/collections');
    if (isCatalogPath) {
      const trackImpression = async () => {
        const today = new Date().toISOString().split('T')[0];
        const dailyRef = doc(firestore, 'analytics', 'counters', 'daily', today);
        try {
          await setDoc(dailyRef, { impressions: increment(1) }, { merge: true });
        } catch (err) {
          console.error('[TRACKER_IMPRESSION_ERR]', err);
        }
      };
      trackImpression();
    }

    // Update heartbeat path immediately on navigation
    if (sessionIdRef.current) {
      const presenceRef = doc(firestore, 'analytics_presence', sessionIdRef.current);
      updateDoc(presenceRef, { 
        path: pathname,
        lastActive: serverTimestamp() 
      }).catch(() => {});
    }
  }, [pathname, firestore]);

  return null; // Invisible component
}
