const CACHE_NAME = 'game-noi-hinh-v1.0.0';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  
  // External libraries
  'https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js',
  'https://fonts.googleapis.com/css2?family=Tiny5&display=swap',
  
  // Images (cần thêm tất cả file ảnh động vật của bạn)
  '/images/animal1.png',
  '/images/animal2.png',
  '/images/animal3.png',
  '/images/animal4.png',
  '/images/animal5.png',
  '/images/animal6.png',
  '/images/animal7.png',
  '/images/animal8.png',
  '/images/animal9.png',
  '/images/animal10.png',
  '/images/animal11.png',
  '/images/animal12.png',
  '/images/animal13.png',
  '/images/animal14.png',
  '/images/animal15.png',
  '/images/animal16.png',
  '/images/animal17.png',
  '/images/animal18.png',
  '/images/animal19.png',
  '/images/animal20.png',
  
  // Sound files (cần thêm tất cả file âm thanh của bạn)
  '/sounds/sbg1.mp3',
  '/sounds/sbg2.mp3',
  '/sounds/sbg3.mp3',
  '/sounds/sbg4.mp3',
  '/sounds/sbg5.mp3',
  '/sounds/sbg6.mp3',
  '/sounds/sbg7.mp3',
  '/sounds/sbg8.mp3'
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Cached all static files');
        return self.skipWaiting(); // Activate new SW immediately
      })
      .catch(error => {
        console.error('Service Worker: Cache failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.startsWith('https://cdnjs.cloudflare.com') &&
      !event.request.url.startsWith('https://fonts.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return cachedResponse;
        }

        // Not in cache, try network
        console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request)
          .then(response => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Add to cache for future requests
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('Service Worker: Fetch failed', error);
            // Return offline page or default response if available
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Handle background sync for game saves
self.addEventListener('sync', event => {
  if (event.tag === 'game-save-sync') {
    console.log('Service Worker: Background sync for game save');
    event.waitUntil(
      // Handle background game save sync if needed
      Promise.resolve()
    );
  }
});

// Handle push notifications (future feature)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: data.data || {}
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});