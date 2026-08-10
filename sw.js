const CACHE_NAME = 'financas-cache-v1';
const CORE_ASSETS = [
  './financas-painel-pessoal.html',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first para o essencial; network-first (com fallback pro cache) para o resto (ex: fontes/CDN)
self.addEventListener('fetch', (event) => {
  if(event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isCore = CORE_ASSETS.some(a => url.pathname.endsWith(a.replace('./','/')));

  if(isCore){
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(resp => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(()=>{});
        return resp;
      })
      .catch(() => caches.match(event.request))
  );
});
