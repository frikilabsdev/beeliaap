// Scripts for firebase messaging
importScripts('https://www.gstatic.com/firebasejs/12.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.9.0/firebase-messaging-compat.js');

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

function showFallbackNotification(title, body, url) {
  return self.registration.showNotification(title || 'Beelia', {
    body: body || 'Tienes una nueva actualización',
    icon: '/icono.png',
    data: { url: url || '/' }
  });
}

// Fallback for native push events (Mandatory for iOS to avoid silent push penalties)
self.addEventListener('push', (event) => {
  try {
    const payload = event.data ? event.data.json() : {};
    console.log('[SW] Push event received: ', payload);

    const notification = payload.notification || {};
    const data = payload.data || {};

    event.waitUntil(showFallbackNotification(
      notification.title || 'Nueva Alerta',
      notification.body || '',
      data.url || '/'
    ));
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
    // Even if parse fails, we MUST show something to avoid WebKit penalty
    event.waitUntil(showFallbackNotification('Beelia', 'Tienes una nueva actualización', '/'));
  }
});

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload?.notification?.title || 'Nueva Alerta';
  const notificationOptions = {
    body: payload?.notification?.body || '',
    icon: '/icono.png',
    data: {
      url: payload?.data?.url || '/'
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
