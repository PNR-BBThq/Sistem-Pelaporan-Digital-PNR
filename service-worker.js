const CACHE_NAME = "pnr-cache-v4.0"; // ⚡ Network-first strategy
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
  // Strategi Network-First untuk permintaan navigasi (halaman HTML)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          // Berjaya dapat dari server — simpan salinan terkini dalam cache
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return res;
        })
        .catch(() => {
          // Offline — fallback ke cache
          return caches.match(e.request).then((cached) => {
            return cached || caches.match('./index.html');
          });
        })
    );
    return;
  }

  // Strategi Cache-First untuk aset statik (CSS, JS, imej, font)
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request).then((networkRes) => {
        // Simpan aset baru dalam cache untuk kegunaan offline
        const clone = networkRes.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return networkRes;
      }).catch(() => {
        // Aset tiada dalam cache DAN offline — tiada apa boleh dibuat
        console.warn('Gagal fetch:', e.request.url);
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
    }).then(() => {
      // Paksa SW baru terus mengawal semua tab terbuka
      return self.clients.claim();
    })
  );
});
