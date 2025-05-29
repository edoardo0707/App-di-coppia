// Nome del cache
const CACHE_NAME = 'app-di-coppia-cache-v1';

// Lista di risorse da pre-caricare (pre-cache)
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/scripts.js',
  '/images/logo.png', // Aggiungi qui altre immagini o risorse statiche
  '/favicon.ico',
];

// Durante l'installazione, pre-carichiamo le risorse necessarie per l'app
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Pre-caching resources');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Durante l'attivazione, eliminiamo i vecchi cache non più necessari
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log(`Service Worker: Deleting old cache ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercepta le richieste di rete e gestiscile con il cache
self.addEventListener('fetch', (event) => {
  // Se la risorsa richiesta è nella cache, rispondi con quella
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Se troviamo una risposta in cache, la usiamo
        if (cachedResponse) {
          console.log(`Service Worker: Returning cached resource ${event.request.url}`);
          return cachedResponse;
        }

        // Altrimenti, fai una richiesta di rete
        console.log(`Service Worker: Fetching resource ${event.request.url}`);
        return fetch(event.request).then((response) => {
          // Se la risposta non è valida, non mettiamo in cache
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Cache the new response for future requests
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            console.log(`Service Worker: Caching new resource ${event.request.url}`);
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
  );
});

// Optional: gestione delle notifiche push (se configurato)
self.addEventListener('push', (event) => {
  const title = event.data ? event.data.text() : 'Notification';
  const options = {
    body: 'Here is a new notification!',
    icon: '/images/icon.png',
    badge: '/images/badge.png',
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Optional: gestione dei messaggi tra la pagina e il service worker
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
