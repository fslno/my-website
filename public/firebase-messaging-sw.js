// Authoritative Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// These values match the project configuration
firebase.initializeApp({
  "projectId": "studio-1858050787-6ff85",
  "appId": "1:576461835157:web:5b3208bccfeaf5aa6b449c",
  "apiKey": "AIzaSyCsr2KiSXUIp26muek1a9VR5tpinZHNOoA",
  "authDomain": "studio-1858050787-6ff85.firebaseapp.com",
  "messagingSenderId": "576461835157"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});