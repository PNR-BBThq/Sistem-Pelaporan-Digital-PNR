const CACHE_NAME = "pnr-cache-v3.1"; // ⚡ BUMP VERSION UNTUK COMPULSORY UPDATE
const ASSETS = [
  './',
  './index.html',
  './form.html',
  './manifest.json',
  './css/style.css',
  
  // Fail logik JavaScript tempatan (Kritikal untuk fungsi offline)
  './js/config.js',
  './js/api.js',
  './js/auth.js',
  './js/map.js',
  './js/filter.js',
  './js/charts.js',
  './js/exports.js',
  './js/users.js',
  './js/records.js',
  './js/dashboard.js',
  './js/kpi.js',
  './js/main.js',
  './js/nlp-bot.js',
  
  // Pustaka CDN Luar yang digunakan sistem
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/exceljs@4.3.0/dist/exceljs.min.js',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11'
];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // ⚡ PAKSA AKTIF: Menyingkirkan draf menunggu lama tanpa perlu tutup tab browser
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Menyimpan aset ke dalam cache...');
      return cache.addAll(ASSETS);
    })
  );
});

// Pembantu Dwi-Lapisan Pemutus Sesi Cache Lama
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      // Jika ada dalam cache, guna cache. Jika tiada, ambil dari rangkaian internet.
      return res || fetch(e.request).catch(() => {
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
        if (key !== CACHE_NAME) {
          console.log('Memadam cache lama:', key);
          return caches.delete(key);
        }
      }));
    })
  );
});
