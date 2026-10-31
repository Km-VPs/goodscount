// GoodsCount service worker.
// The app page is network-first (with a short timeout), so phones get new versions by themselves
// and still open instantly offline at the dock. Fonts and icons are cache-first.
// Bump CACHE when you change fonts or icons.
const CACHE = 'goodscount-v1.3.0';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './fonts.css', './fonts-extra.css',
                './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const keep = (req, res) => {
  if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
  return res;
};
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    const net = fetch(req).then(res => keep(req, res));
    const slow = new Promise(r => setTimeout(r, 2500));
    e.respondWith(
      Promise.race([net.catch(() => null), slow.then(() => null)])
        .then(res => res || caches.match(req, {ignoreSearch:true}))
        .then(res => res || caches.match('./index.html'))
        .then(res => res || net)
    );
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => keep(req, res))));
});
