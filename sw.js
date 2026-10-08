/* Catálogo Bioclin: abre mesmo sem internet depois de aberto uma vez online.
   Rede primeiro (sempre pega a versão nova quando há internet); sem rede, usa a cópia guardada. */
const CACHE = "bioclin-catalogo-v1";
const BASE = "/BIOCLIN-COLABIOCLI-2026/";
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([BASE, BASE + "og-catalogo.png"])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || !url.pathname.startsWith(BASE)) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = req.mode === "navigate" ? new Request(url.origin + url.pathname) : req;
    try {
      const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 6000);
      const res = await fetch(req, {signal: ctl.signal}); clearTimeout(tm);
      if (res && res.ok) cache.put(key, res.clone());
      return res;
    } catch (_) {
      const hit = await cache.match(key, {ignoreSearch: true}) || (req.mode === "navigate" ? await cache.match(BASE) : null);
      return hit || new Response("Sem internet", {status: 503, headers: {"Content-Type": "text/plain; charset=utf-8"}});
    }
  })());
});
