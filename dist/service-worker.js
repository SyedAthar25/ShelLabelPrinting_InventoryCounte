const CACHE_NAME = 'shelf-label-v2';

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Cache essential files first
        const essentialFiles = [
          '/',
          '/index.html',
          '/manifest.json'
        ];
        
        return Promise.all(
          essentialFiles.map(url => 
            cache.add(url).catch(error => {
              console.log(`Failed to cache ${url}:`, error);
              return Promise.resolve();
            })
          )
        ).then(() => {
          // Cache all assets dynamically
          return cache.addAll([
            '/assets/index-654ce37f.css',
            '/assets/index-79a28b34.js',
            '/assets/index.es-c297b8cb.js',
            '/assets/vendor-3c8011bb.js',
            '/assets/router-6a975d97.js',
            '/assets/web-d16e4d3f.js',
            '/assets/bluetoothPrinterClassic-237947b1.js',
            '/assets/purify.es-31816194.js',
            '/assets/Logo 6x1-Photoroom-c04021b7.png',
            '/assets/Saudi_Riyal_Symbol-96cf3a0c.png',
            '/vite.svg'
          ]).catch(error => {
            console.log('Some assets failed to cache:', error);
            return Promise.resolve();
          });
        });
      })
      .then(() => {
        console.log('Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }

        // Try to fetch from network
        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            // Cache the response for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
                console.log('Cached new resource:', event.request.url);
              })
              .catch(error => {
                console.log('Failed to cache response:', error);
              });

            return response;
          })
          .catch(() => {
            // Network failed, try to serve fallback
            console.log('Network failed for:', event.request.url);
            
            // For navigation requests, serve index.html
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // For other requests, return a basic response or let it fail
            return new Response('Offline - Resource not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated successfully');
      // Take control of all clients
      return self.clients.claim();
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      console.log('Background sync triggered')
    );
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    console.log('Push notification received:', data);
  }
});

// Message handling for debugging
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  console.log('Service Worker message received:', event.data);
});
