// Service Worker for Nothingness PWA
const CACHE_NAME = 'nothingness-pwa-v3';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/images/logo.png',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Never intercept non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // 2. Never intercept Next.js App Router RSC streams or internal data fetches
  // Caching or returning HTML fallbacks for RSC requests breaks the router and causes infinite reload loops
  if (
    url.searchParams.has('_rsc') ||
    url.searchParams.has('__rsc') ||
    event.request.headers.get('RSC') === '1' ||
    event.request.headers.get('Next-Router-State-Tree') ||
    event.request.headers.get('Next-Url') ||
    url.pathname.startsWith('/_next/data/')
  ) {
    return;
  }

  // 3. Never intercept or cache authenticated, dynamic, or transactional paths
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/auth') ||
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/sanctuary-pass') ||
    url.pathname.startsWith('/booking') ||
    url.pathname.startsWith('/verify-guest') ||
    url.pathname.startsWith('/verify-id') ||
    url.pathname.startsWith('/kinksters') ||
    url.pathname.startsWith('/partner')
  ) {
    return;
  }

  // 4. Static media, fonts, and static bundles: Stale While Revalidate / Cache First
  if (
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 5. Root page navigation fallback (Only for standalone browser navigation, never for subrequests)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
  }
});

// --- WebPush Notifications Handler ---
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Nothingness Sanctuary', body: event.data.text() };
    }
  }

  const title = data.title || 'Nothingness Sanctuary Alert';
  const options = {
    body: data.body || 'You have an update regarding your Sanctuary Pass or stay.',
    icon: data.icon || '/images/logo.png',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || 'sanctuary-alert',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/sanctuary-pass',
      ...data.data
    },
    actions: [
      { action: 'open', title: 'View Discreetly' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/sanctuary-pass';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
