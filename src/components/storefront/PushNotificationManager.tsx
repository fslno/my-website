'use client';

import { useEffect, useState } from 'react';
import { useFirebaseApp } from '@/firebase';
import { getMessagingInstance } from '@/firebase';
import { getToken } from 'firebase/messaging';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function PushNotificationManager() {
  const app = useFirebaseApp();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      
      // Register Service Worker for PWA/FCM
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/firebase-messaging-sw.js')
            .then((registration) => {
              console.log('SW registered with scope:', registration.scope);
            })
            .catch((err) => {
              console.error('SW registration failed:', err);
            });
        });
      }

      // Show prompt if permission is not yet granted/denied
      if (Notification.permission === 'default') {
        const timer = setTimeout(() => setShowPrompt(true), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const requestPermission = async () => {
    try {
      const status = await Notification.requestPermission();
      setPermission(status);
      setShowPrompt(false);

      if (status === 'granted') {
        const messaging = await getMessagingInstance(app);
        if (messaging) {
          const token = await getToken(messaging, {
            vapidKey: 'BHz_YOUR_VAPID_KEY_HERE' // Replace with your actual VAPID key from Firebase Console
          });
          console.log('FCM Token generated:', token);
          toast({
            title: "Notifications Active",
            description: "You will now receive archive updates."
          });
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  if (!showPrompt || permission !== 'default') return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] max-w-xs w-full bg-black text-white p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-500 rounded-sm border border-white/10">
      <button 
        onClick={() => setShowPrompt(false)}
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-4">
        <div className="bg-white/10 p-2 rounded">
          <Bell className="h-5 w-5 text-white" />
        </div>
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest leading-none">Drop Notifications</h3>
          <p className="text-[10px] text-gray-400 leading-relaxed uppercase">Enable alerts for new archival drops and private spot closings.</p>
          <Button 
            onClick={requestPermission}
            className="w-full h-10 bg-white text-black font-bold uppercase tracking-widest text-[9px] hover:bg-[#D3D3D3]"
          >
            Enable Access
          </Button>
        </div>
      </div>
    </div>
  );
}