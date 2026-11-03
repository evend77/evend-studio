// src/utils/cachePublic.ts
// Lecture d'une adresse publique (JSON) avec un petit cache partagé entre les pages.
// Évite de redemander le menu, les politiques et les réseaux sociaux à chaque changement de page.
// Un échec n'est pas gardé en mémoire : la prochaine page réessaie.

const cache = new Map<string, { t: number; p: Promise<any | null> }>();

export function lireJsonCache(url: string, ttlMs = 30000): Promise<any | null> {
  const maintenant = Date.now();
  const c = cache.get(url);
  if (c && maintenant - c.t < ttlMs) return c.p;

  const p: Promise<any | null> = fetch(url)
    .then(r => (r.ok ? r.json() : null))
    .catch(() => null)
    .then(v => {
      if (v === null) cache.delete(url);
      return v;
    });
  cache.set(url, { t: maintenant, p });
  return p;
}