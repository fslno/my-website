'use client';

import { useEffect, useState } from 'react';
import { useFirebaseApp, useUser } from '@/firebase';
import { getMessagingInstance } from '@/firebase';
import { getToken } from 'firebase/messaging';
import { Bell, BellOff, X, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { cn } from '@/lib/utils';

/**
 * Authoritative UI Neutralization Protocol.
 * The visual prompt manifest has been forensicly removed to ensure zero-intrusion for participants.
 */
export function PushNotificationManager() {
  const app = useFirebaseApp();
  const { user } = useUser();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/firebase-messaging-sw.js')
          .then((registration) => {
            console.log('[SW] Protocol Registered:', registration.scope);
          });
      }
    }
  }, []);

  const subscribeToAdminTopic = async (token: string) => {
    if (!user || (user.email !== 'fslno.dev@gmail.com' && user.uid !== 'ulyu5w9XtYeVTmceUfOZLZwDQxF2')) return;
    
    setIsSyncing(true);
    const functions = getFunctions(app);
    const subscribeFunc = httpsCallable(functions, 'subscribeAdminToOrders');
    
    try {
      await subscribeFunc({ token });
      toast({
        title: "Alarm Protocol Active",
        description: "This device is now bound to the Order Alarm topic."
      });
    } catch (error) {
      console.error("[ALARM] Subscription Error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const requestPermission = async () => {
    try {
      const status = await Notification.requestPermission();
      setPermission(status);
      setShowPrompt(false);

      if (status === 'granted') {
        const messaging = await getMessagingInstance(app);
        if (messaging) {
          const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';
          
          const token = await getToken(messaging, { vapidKey }).catch(err => {
            console.warn("[ALARM] Handshake suspended.");
            return null;
          });
          
          if (token) {
            const isAdmin = user?.email === 'fslno.dev@gmail.com' || user?.uid === 'ulyu5w9XtYeVTmceUfOZLZwDQxF2';
            if (isAdmin) {
              await subscribeToAdminTopic(token);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  // Authoritative Removal: Strictly return null to purge UI from participant view
  return null;
}
