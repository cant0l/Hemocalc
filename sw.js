const CACHE_NAME = 'hemocalc-v4';
const archivosParaGuardar = [
    './',
    './index.html',
    './calculadora.html',
    './styles.css',
    './calculadora.js',
    './icon.png'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(archivosParaGuardar))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(nombres => {
            return Promise.all(
                nombres.map(nombre => {
                    if (nombre !== CACHE_NAME) return caches.delete(nombre);
                })
            );
        })
    );
});

// ESTRATEGIA: Intenta internet primero, si falla, usa el caché.
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});