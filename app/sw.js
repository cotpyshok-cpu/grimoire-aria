// Service Worker для Гримуара Арии (Хроники Хондора — полная офлайн-работа всех 3 актов и 29 портретов)
const CACHE_NAME = 'grimoire-aria-v18';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  './js/audio.js',
  './js/dialog.js',
  './js/matcher.js',
  './js/quest.js',
  './js/minigames.js',
  './js/app.js',
  './img/portraits/aria.svg',
  './img/portraits/tonik.svg',
  './img/portraits/melari.svg',
  './img/portraits/linar.svg',
  './img/portraits/orivia.svg',
  './img/portraits/ilya.svg',
  './img/portraits/clock.svg',
  './img/portraits/valtasar.svg',
  './img/portraits/elodea.svg',
  './img/portraits/kasym.svg',
  './img/portraits/baiterek.svg',
  './img/portraits/raven.svg',
  './img/portraits/barista.svg',
  './img/portraits/kuanysh.svg',
  './img/portraits/kuzya.svg',
  './img/portraits/mercury.svg',
  './img/portraits/gargoyle.svg',
  './img/portraits/auctioneer.svg',
  './img/portraits/papa.svg',
  './img/portraits/mama.svg',
  './img/portraits/alfiya.svg',
  './img/portraits/sergey.svg',
  './img/portraits/danya.svg',
  './img/portraits/vitalik.svg',
  './img/portraits/oksana.svg',
  './img/portraits/sofa.svg',
  './img/portraits/yana.svg',
  './img/portraits/yana_bf.svg',
  './img/portraits/faceless.svg',
  './img/portraits/elders.svg',
  './img/portraits/npc.svg'
];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => console.warn('Cache prefetch partial warning:', err));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', evt => {
  if (evt.request.method !== 'GET') return;
  evt.respondWith(
    fetch(evt.request).then(response => {
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(evt.request, clone));
      }
      return response;
    }).catch(() => caches.match(evt.request))
  );
});
