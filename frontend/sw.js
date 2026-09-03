const CACHE_NAME = "fincontrol-v4";

const urlsToCache = [
    "/",
    "/index.html",
    "/pages/planilha.html",
    "/offline.html",
    "/manifest.json",
    "/assets/css/global.css",
    "/assets/css/sidebar.css",
    "/assets/css/dashboard.css",
    "/assets/css/planilha.css",
    "/assets/css/modal.css",
    "/assets/js/dashboard.js",
    "/assets/js/planilha.js",
    "/assets/js/modal.js",
    "/assets/js/app.js",
    "/assets/icon-192.png",
    "/assets/icon-512.png"
];

self.addEventListener("install", event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache).catch(() => undefined))
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        )).then(() => clients.claim())
    );
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") {
        return;
    }

    const requestUrl = new URL(event.request.url);

    if (requestUrl.origin !== self.location.origin) {
        return;
    }

    const isNavigationRequest = event.request.mode === "navigate" || requestUrl.pathname.endsWith(".html") || requestUrl.pathname === "/";
    const isStaticAsset = /\.(css|js|png|jpg|jpeg|svg|webp|json|ico)$/i.test(requestUrl.pathname);

    if (isNavigationRequest) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (!response || response.status !== 200 || response.type === "opaque") {
                        throw new Error("Network response was not ok");
                    }
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request)
                        .then(cached => cached || caches.match("/pages/planilha.html"))
                        .then(cached => cached || caches.match("/index.html"))
                        .then(cached => cached || caches.match("/offline.html"));
                })
        );
        return;
    }

    if (isStaticAsset) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                const fetchPromise = fetch(event.request).then(response => {
                    if (response && response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                    }
                    return response;
                }).catch(() => cached);

                return cached || fetchPromise;
            })
        );
        return;
    }

    event.respondWith(fetch(event.request).catch(() => caches.match("/index.html")));
});