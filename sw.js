const CACHE_NAME = 'asgard-v-presence-quota-root-fix-1-guest-v1';
const ASSETS = [
    './', './index.html', './style.css', './app.js', './cloud.js', './firebase-config.js',
    './manifest.json', './icons/icon-192-v17.png', './icons/icon-512-v17.png', './icons/logo-asgard.png'
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
    // Navigations stay network-first so a newly deployed index.html is discovered quickly.
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req).then(response => {
                if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put('./index.html', response.clone()));
                return response;
            }).catch(() => caches.match('./index.html'))
        );
        return;
    }

    // Same-origin static files use stale-while-revalidate: render immediately from cache,
    // then refresh in the background. This substantially reduces repeated PWA startup time.
    if (url.origin === self.location.origin) {
        event.respondWith((async () => {
            const cached = await caches.match(req);
            const networkPromise = fetch(req).then(response => {
                if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(req, response.clone()));
                return response;
            }).catch(() => null);
            return cached || await networkPromise || caches.match('./index.html');
        })());
        return;
    }
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil((async () => {
        const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        if (windows.length) {
            const client = windows[0];
            await client.focus();
            client.postMessage({ type: 'OPEN_PAGE', page: event.notification.data?.page || 'chat' });
            return;
        }
        await clients.openWindow('./');
    })());
});
