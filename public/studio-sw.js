// CHEMIN : public/studio-sw.js
// Service worker de e-Vend Studio (e-vendstudio.ca seulement).
// Rien n'est gardé en cache : pages, paiements, compte et API passent toujours directement par le réseau.
// Il sert à rendre Studio installable, sans jamais bloquer les gens sur une vieille version après un déploiement.
const CACHE = 'studio-v1';

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