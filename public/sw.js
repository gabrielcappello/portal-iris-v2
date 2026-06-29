// Service worker mínimo do Iris.
// Objetivo: tornar o app instalável (o Chrome exige um SW com handler de
// fetch para disparar o convite de instalação). NÃO faz cache/offline.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handler de fetch passthrough (apenas para satisfazer a instalabilidade).
self.addEventListener("fetch", () => {
  // sem respondWith → o navegador faz o fetch normal (sem offline)
});
