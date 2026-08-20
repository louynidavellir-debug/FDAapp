const CACHE_NAME = 'asgard-v-profile-identity-v9';
const ASSETS = [
    './', './index.html', './style.css', './app.js', './cloud.js', './firebase-config.js',
    './manifest.json', './icons/icon-192-v17.png', './icons/icon-512-v17.png', './icons/logo-asgard.png',
    './assets/profile-backgrounds/lobo-de-asgard.webp', './assets/profile-backgrounds/cacador-noturno.webp',
    './assets/profile-backgrounds/ceifador.webp', './assets/profile-backgrounds/olho-de-odin.webp',
    './assets/profile-backgrounds/100-baixas.webp', './assets/profile-backgrounds/primeira-vitoria.webp',
    './assets/profile-backgrounds/veterano-de-asgard.webp',
    './assets/profile-backgrounds/berserker.webp',
    './assets/profile-backgrounds/guardiao-dos-caidos.webp',
    './assets/profile-backgrounds/50-operacoes.webp',
    './assets/profile-backgrounds/25-operacoes.webp',
    './assets/profile-backgrounds/voz-de-asgard.webp'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
    // Do not skipWaiting automatically. When an older worker controls the app, the new
    // version remains waiting so the ADMIN can see "nova versão disponível" and choose
    // when to apply it from the diagnostic panel.
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

    // Navigations are network-first so newly deployed HTML is discovered immediately.
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req).then(response => {
                if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put('./index.html', response.clone()));
                return response;
            }).catch(() => caches.match('./index.html'))
        );
        return;
    }

    if (url.origin === self.location.origin) {
        // Firebase config must be network-first. Caching it stale can make a valid deployment
        // look "Firebase não configurado" after an update.
        if (url.pathname.endsWith('/firebase-config.js')) {
            event.respondWith(
                fetch(req).then(response => {
                    if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(req, response.clone()));
                    return response;
                }).catch(() => caches.match(req))
            );
            return;
        }

        // Static same-origin assets use stale-while-revalidate for fast PWA startup.
        event.respondWith((async () => {
            const cached = await caches.match(req);
            const networkPromise = fetch(req).then(response => {
                if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(req, response.clone()));
                return response;
            }).catch(() => null);
            if (cached) { event.waitUntil(networkPromise); return cached; }
            return await networkPromise || new Response('Offline', { status:503, statusText:'Offline' });
        })());
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

self.addEventListener('message', event => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
