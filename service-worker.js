const CACHE_NAME = 'pnr-v3-safe'; // Tukar versi
const ASSETS = [
  './',
  './index.html',
  './form.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/exceljs@4.3.0/dist/exceljs.min.js',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11'
  // SAYA DAH BUANG ICON DARI SINI SUPAYA TAK ERROR JIKA GAMBAR TIADA
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets...');
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      // Kalau ada dalam cache, guna cache. Kalau takda, tarik internet.
      return res || fetch(e.request).catch(() => {
        // Kalau internet pun takda (Offline), dan user minta page utama
        if (e.request.mode === 'navigate') {
            return caches.match('./index.html');
        }
      });
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
});
