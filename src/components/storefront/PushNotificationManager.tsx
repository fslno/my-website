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

      if (Notification.permission === 'default') {
        const timer = setTimeout(() => setShowPrompt(true), 5000);
        return () => clearTimeout(timer);
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
      toast({
        variant: "destructive",
        title: "Protocol Failure",
        description: "Handshake with alarm topic failed."
      });
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
          // Authoritative Handshake: Attempt token retrieval with environment variable protection
          const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';
          
          const token = await getToken(messaging, { vapidKey }).catch(err => {
            // Handle invalid VAPID key specifically to avoid app crash
            if (err.message.includes('applicationServerKey') || err.code === 'messaging/invalid-vapid-key') {
              console.warn("[ALARM] Invalid VAPID Key detected. Handshake suspended.");
              return null;
            }
            throw err;
          });
          
          if (token) {
            const isAdmin = user?.email === 'fslno.dev@gmail.com' || user?.uid === 'ulyu5w9XtYeVTmceUfOZLZwDQxF2';
            if (isAdmin) {
              await subscribeToAdminTopic(token);
            } else {
              toast({
                title: "Notifications Active",
                description: "You will now receive Studio updates."
              });
            }
          } else {
            toast({
              variant: "destructive",
              title: "Configuration Needed",
              description: "Web Push protocol requires a valid VAPID Key from your Firebase Console."
            });
          }
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  if (!showPrompt || permission !== 'default') return null;

  const isAdmin = user?.email === 'fslno.dev@gmail.com' || user?.uid === 'ulyu5w9XtYeVTmceUfOZLZwDQxF2';

  return (
    <div className="fixed bottom-6 right-6 z-[100] max-w-xs w-full bg-black text-white p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-500 rounded-none border border-white/10">
      <button 
        onClick={() => setShowPrompt(false)}
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-4">
        <div className={cn("p-2 rounded bg-white/10", isAdmin && "bg-red-500/20")}>
          {isAdmin ? <ShieldAlert className="h-5 w-5 text-red-500" /> : <Bell className="h-5 w-5 text-white" />}
        </div>
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest leading-none">
            {isAdmin ? "Admin Alarm Protocol" : "Studio Notifications"}
          </h3>
          <p className="text-[10px] text-gray-400 leading-relaxed uppercase">
            {isAdmin 
              ? "Enable high-priority acoustic alarms for new archival transactions." 
              : "Enable alerts for new Studio drops and private spot closings."}
          </p>
          <Button 
            onClick={requestPermission}
            disabled={isSyncing}
            className="w-full h-10 bg-white text-black font-bold uppercase tracking-widest text-[9px] hover:bg-[#D3D3D3]"
          >
            {isSyncing ? "Syncing..." : "Enable Access"}
          </Button>
        </div>
      </div>
    </div>
  );
}
