const CACHE = "simba-shell-v3";
const SHELL = ["/", "/manifest.webmanifest", "/icons/simba-mark.svg"];

function withLegalLinks(response) {
  if (!response || !response.ok || !response.headers.get("content-type")?.includes("text/html")) return response;
  return response.text().then(html => {
    const legal = `<footer style="max-width:1120px;margin:0 auto;padding:28px 16px 42px;color:#5b6b61;font:12px/1.5 system-ui,-apple-system,sans-serif;border-top:1px solid #dbe5de"><div style="display:flex;flex-wrap:wrap;gap:14px"><a href="/mentions-legales/" style="color:#0b5d33">Mentions légales</a><a href="/confidentialite/" style="color:#0b5d33">Confidentialité</a><a href="/cookies/" style="color:#0b5d33">Cookies</a><a href="/conditions/" style="color:#0b5d33">Conditions</a></div><div style="margin-top:10px">Simba Stat · Naoussi Industries</div></footer>`;
    if (html.includes("</body>") && !html.includes("data-simba-legal-footer")) html = html.replace("</body>", `<div data-simba-legal-footer="1">${legal}</div></body>`);
    return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  });
}

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache: "no-store" });
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then(cache => cache.put(new Request(new URL("/", self.location.origin)), copy)).catch(() => {}));
        }
        return response;
      } catch {
        return (await caches.match(new URL("/", self.location.origin))) || Response.error();
      }
    })());
    return;
  }
  if (url.pathname.startsWith("/api/")) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok && response.headers.get("cache-control")?.includes("public")) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {}));
        }
        return response;
      } catch {
        return (await caches.match(request)) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {}));
    }
    return response;
  })());
});

self.addEventListener("push", event => {
  let data = { title: "Simba Stat", body: "Une nouvelle information est disponible.", url: "/#matchs" };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch {}
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: "/icons/simba-mark.svg",
    badge: "/icons/simba-mark.svg",
    data: { url: data.url }
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/#matchs", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
    const existing = clients.find(client => client.url.startsWith(self.location.origin));
    return existing ? existing.navigate(url).then(() => existing.focus()) : self.clients.openWindow(url);
  }));
});
