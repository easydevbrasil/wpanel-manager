const CACHE_NAME = 'wpanel-v1.0.0';
const OFFLINE_PAGE = '/offline.html';

// Essential files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching essential resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip extension requests
  if (event.request.url.includes('extension://')) {
    return;
  }

  // Skip API calls (let them fail fast for better UX)
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Network success - clone and cache the response
        if (response.status === 200) {
          const responseClone = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            })
            .catch((error) => {
              console.warn('[SW] Cache write failed:', error);
            });
        }
        
        return response;
      })
      .catch(() => {
        // Network failed - try cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] Serving from cache:', event.request.url);
              return cachedResponse;
            }
            
            // No cached version - serve offline page for navigation requests
            if (event.request.destination === 'document') {
              console.log('[SW] Serving offline page');
              return caches.match(OFFLINE_PAGE);
            }
            
            // For other resources, return a basic offline response
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Background sync for form submissions when online
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks here
      Promise.resolve().then(() => {
        console.log('[SW] Background sync completed');
      })
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do wPanel',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'wpanel-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/icon-192x192.png'
      },
      {
        action: 'dismiss',
        title: 'Dispensar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('wPanel', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

console.log('[SW] Service worker loaded successfully');

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('PWA Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the service worker takes control immediately
  self.clients.claim();
});

// Fetch event - Network first, then cache fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If we got a response, clone it and store in cache
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // If not in cache, return a custom offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return new Response(
                `<!DOCTYPE html>
                <html>
                  <head>
                    <title>wPanel - Offline</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                      body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; }
                      .offline-container { max-width: 400px; margin: 0 auto; }
                      .offline-icon { font-size: 64px; margin-bottom: 20px; }
                    </style>
                  </head>
                  <body>
                    <div class="offline-container">
                      <div class="offline-icon">📡</div>
                      <h1>wPanel Offline</h1>
                      <p>Você está offline. Verifique sua conexão de internet e tente novamente.</p>
                      <button onclick="window.location.reload()" style="padding: 12px 24px; background: white; color: #4f46e5; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                        Tentar Novamente
                      </button>
                    </div>
                  </body>
                </html>`,
                {
                  headers: { 'Content-Type': 'text/html' }
                }
              );
            }
          });
      })
  );
});

// Handle background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('PWA Background sync triggered');
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
    
    event.waitUntil(
      self.registration.showNotification('wPanel', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});