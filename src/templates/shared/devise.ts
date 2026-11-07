// CHEMIN : src/templates/shared/devise.ts
// e-Vend Studio — Devise de la marketplace (Config marketplace → Généralité → Devise).
// UNE seule fonction pour afficher tous les montants : « 45,00 $ », « 45,00 $ US », « 45,00 € », « 45,00 £ ».
// La devise est mémorisée une fois par le template (setDevise) ; les pages du gestionnaire utilisent useDevise(gestionnaireId).
// Aucune conversion : les prix sont affichés tels qu'ils sont entrés, dans la devise choisie.

import { useEffect, useState } from 'react';

export const DEVISES = ['CAD', 'USD', 'EUR', 'GBP'] as const;
let courante = 'CAD';
const cache: Record<string, string> = {};

const valide = (d: unknown): string => {
  const x = String(d || 'CAD').toUpperCase();
  return (DEVISES as readonly string[]).includes(x) ? x : 'CAD';
};

export function setDevise(d?: string | null) { courante = valide(d); }
export function getDevise() { return courante; }

export function formaterPrix(montant: number | string | null | undefined, devise?: string): string {
  const n = typeof montant === 'string' ? parseFloat(montant) : Number(montant);
  if (!Number.isFinite(n)) return '—';
  try {
    return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: valide(devise || courante) }).format(n);
  } catch {
    return `${n.toFixed(2)} $`;
  }
}

// Pages du dashboard gestionnaire : charge la devise du site (une fois) et re-rend la page quand elle est connue.
export function useDevise(gestionnaireId: number | string | undefined): string {
  const [d, setD] = useState<string>(() => (gestionnaireId && cache[String(gestionnaireId)]) || courante);
  useEffect(() => {
    if (!gestionnaireId) return;
    const cle = String(gestionnaireId);
    if (cache[cle]) { setDevise(cache[cle]); setD(cache[cle]); return; }
    let actif = true;
    fetch(`/api/studio/sites/${cle}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        const dev = valide(data?.config?.multivendeur?.devise);
        cache[cle] = dev;
        if (actif) { setDevise(dev); setD(dev); }
      })
      .catch(() => {});
    return () => { actif = false; };
  }, [gestionnaireId]);
  return d;
}

// À appeler après une sauvegarde de la config pour que les pages du gestionnaire reflètent tout de suite la nouvelle devise
export function oublierDevise(gestionnaireId: number | string) { delete cache[String(gestionnaireId)]; }