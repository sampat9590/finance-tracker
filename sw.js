// ── Finance Tracker Service Worker ──
// Update CACHE_VERSION every time you upload a new version to GitHub
// This forces all users to get fresh files automatically
const CACHE_VERSION = 'v1.1';
const CACHE_NAME = 'finance-tracker-' + CACHE_VERSION;
const BASE = '/finance-tracker/';

const STATIC_FILES = [
    BASE,
    BASE + 'index.html',
    BASE + 'manifest.json',
    BASE + 'icon-192.png',
    BASE + 'icon-512.png',
];

// Install — cache static files
self.addEventListener('install', function(event) {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(STATIC_FILES);
        })
    );
});

// Activate — delete old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys
                    .filter(function(key) { return key !== CACHE_NAME; })
                    .map(function(key) { return caches.delete(key); })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// Fetch — NETWORK FIRST
// Always fetches fresh from network, falls back to cache when offline
self.addEventListener('fetch', function(event) {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then(function(networkResponse) {
                if (networkResponse && networkResponse.status === 200) {
                    var clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, clone);
                    });
                }
                return networkResponse;
            })
            .catch(function() {
                return caches.match(event.request)
                    .then(function(cached) {
                        return cached || caches.match(BASE + 'index.html');
                    });
            })
    );
});
