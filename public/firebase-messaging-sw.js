// Scripts for firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBpDwhLK_32ffhESDmlnCpMcmPoyzAy44U",
  authDomain: "beelia-linktree.firebaseapp.com",
  projectId: "beelia-linktree",
  storageBucket: "beelia-linktree.firebasestorage.app",
  messagingSenderId: "79382647741",
  appId: "1:79382647741:web:71efd465ab0d97cc72b8d4"
});

const messaging = firebase.messaging();

// Fallback for native push events (Mandatory for iOS to avoid silent push penalties)
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[SW] Push event received: ', payload);

      // If payload is from FCM, it might be nested or direct
      const notification = payload.notification || payload;
      const data = payload.data || {};

      const notificationTitle = notification.title || 'Nueva Alerta';
      const notificationOptions = {
        body: notification.body || '',
        icon: '/icono.png',
        data: {
          url: data.url || '/'
        }
      };

      event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
      );
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
      // Even if parse fails, we MUST show something to avoid WebKit penalty
      event.waitUntil(
        self.registration.showNotification('Beelia', {
          body: 'Tienes una nueva actualización',
          icon: '/icono.png'
        })
      );
    }
  }
});

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icono.png', // Updated path
    data: {
      url: payload.data ? payload.data.url : '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
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
