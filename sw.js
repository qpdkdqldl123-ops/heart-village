/* 하트 마을 앱 — 오프라인에서도 열리도록 파일을 보관해요.
   · 처음 열 때 필요한 파일을 저장해 두고, 인터넷이 안 되거나 느리면(4초) 저장해 둔 것으로 열어요.
   · 인터넷이 되면 늘 새 것을 받아서 저장해 둬요 (그래서 업데이트가 바로 들어와요).
   · 서버(중계) 주소로 가는 요청은 건드리지 않아요. */
const V = 'hv-pwa-1794278678';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('hv-pwa-') && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function netFirst(req, ms) {
  return new Promise(res => {
    let done = false;
    const fall = () => caches.match(req, { ignoreSearch: true }).then(m => m || caches.match('index.html')).then(r => { if (!done) { done = true; res(r || Response.error()); } });
    const t = setTimeout(fall, ms);
    fetch(req).then(r => {
      clearTimeout(t);
      if (r && r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); }
      if (!done) { done = true; res(r); }
    }).catch(() => { clearTimeout(t); fall(); });
  });
}
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  if (r.mode === 'navigate' || /\/(config\.js|index\.html)$/.test(u.pathname)) { e.respondWith(netFirst(r, 4000)); return; }
  e.respondWith(caches.match(r).then(m => m || fetch(r)));
});
