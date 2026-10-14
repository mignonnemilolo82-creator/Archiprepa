const CACHE = 'archiprepa-v4';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('archiprepa-') && key !== CACHE).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

// Réponse immédiate depuis le cache, puis mise à jour en arrière-plan :
// une nouvelle version de l'app apparaît à l'ouverture suivante.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.ok && new URL(req.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => null);
      if (cached) { event.waitUntil(network); return cached; }
      return network.then(res => res || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    })
  );
});
