// Service worker des boutiques (add-on « App installable »).
// Même principe que e-Vend : rien n'est gardé en cache, tout passe toujours directement par le réseau
// (pages, paiements, compte, API). Il sert surtout à rendre la boutique installable.
const CACHE = 'boutique-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', () => {
  // Aucune interception : le navigateur va chercher la ressource normalement.
});