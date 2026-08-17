const CACHE_NAME = 'asgard-pwa-firebase-v13-github-pages';
const ASSETS = [
    './', './index.html', './style.css', './app.js', './cloud.js', './firebase-config.js',
    './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/logo-asgard.png'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )));
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    // Firebase/CDN/API traffic is network-only. Never cache authenticated cloud responses.
    if (url.hostname.includes('firebase') || url.hostname.includes('googleapis.com') ||
        url.hostname.includes('gstatic.com') || url.hostname.includes('google.com') ||
        url.hostname.includes('jsdelivr.net')) return;
    event.respondWith(
        fetch(req).then(response => {
            if (response.ok && url.origin === self.location.origin) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
            }
            return response;
        }).catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
    );
});
