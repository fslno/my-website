/*
 * @fileOverview Firebase Messaging Service Worker.
 * Handles background notifications and heads-up manifestation.
 */

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCsr2KiSXUIp26muek1a9VR5tpinZHNOoA",
  authDomain: "studio-1858050787-6ff85.firebaseapp.com",
  projectId: "studio-1858050787-6ff85",
  storageBucket: "studio-1858050787-6ff85.appspot.com",
  messagingSenderId: "576461835157",
  appId: "1:576461835157:web:5b3208bccfeaf5aa6b449c"
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background Message received: ', payload);

  const notificationTitle = payload.notification.title || "🚨 ALERT";
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icons/icon-192x192.png',
    data: payload.data,
    tag: 'order-alarm', // Ensures multiple notifications stack or re-notify
    renotify: true,
    requireInteraction: true, // Persists until dismissed
    silent: false,
    sound: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // Remote fallback for missing local asset
    vibrate: [200, 100, 200, 100, 200, 100, 400],
    actions: [
      {
        action: 'view-orders',
        title: 'View Orders',
        icon: '/icons/shopping-bag.png'
      }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click interaction handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = '/admin/orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
