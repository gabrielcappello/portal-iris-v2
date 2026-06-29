// Service worker do app do dentista (Iris).
// Estratégia: cache-first para assets estáticos do Next.js (_next/static),
// network-first para tudo mais (dados, API, páginas).
// Sem modo offline — se não tiver rede, o erro aparece normalmente.

const CACHE = "iris-dentista-v1";

// Assets estáticos do Next.js que valem a pena cachear
const STATIC_PATTERNS = [
  /\/_next\/static\//,
  /\/icon-192\.png/,
  /\/icon-512\.png/,
  /\/apple-icon\.png/,
];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Remove caches de versões anteriores
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Só intercepta GET
  if (request.method !== "GET") return;

  const url = request.url;
  const isStatic = STATIC_PATTERNS.some((p) => p.test(url));

  if (isStatic) {
    // Cache-first: serve do cache, atualiza em background se necessário
    event.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached); // sem rede: usa o cache se existir
          return cached || networkFetch;
        })
      )
    );
  }
  // Demais requests (API, páginas): passthrough normal (sem offline)
});
