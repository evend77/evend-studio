// src/hooks/useMenuPublic.ts
// Charge un menu géré dans l'admin (« Paramètres > Menu »).
//   GET /api/menus/public/type/principal   → menu du haut
//   GET /api/menus/public/type/footer      → menu du bas de page
// Si le serveur ne répond pas, ou si le menu est vide, on affiche les liens par défaut ci-dessous :
// le site n'a donc jamais de menu vide.

import { useState, useEffect } from 'react';
import { lireJsonCache } from '../utils/cachePublic';

const API_BASE = '/api';

export interface ItemMenu {
  id: number;
  label: string;
  url: string | null;          // null = pas de lien (titre de sous-menu, ou liste des politiques)
  type_lien: string;           // 'politiques' = liste déroulante des politiques · 'ancre' = défilement vers une section de l'accueil
  cible: '_self' | '_blank';
  icone: string | null;
  gras: boolean;
  italique: boolean;
  couleur: string | null;      // null = couleur du site
  taille_texte: number;
  sous_items: ItemMenu[];
}

function defaut(id: number, label: string, url: string | null, type_lien = 'page'): ItemMenu {
  return { id: -id, label, url, type_lien, cible: '_self', icone: null, gras: false, italique: false, couleur: null, taille_texte: 14, sous_items: [] };
}

export const MENU_PRINCIPAL_DEFAUT: ItemMenu[] = [
  defaut(1, 'Templates', '/#templates', 'ancre'),
  defaut(2, 'Fonctionnalités', '/#features', 'ancre'),
  defaut(3, 'Blog', '/blog'),
  defaut(4, 'FAQ', '/faq'),
  defaut(5, 'Documents', '/documents'),
];

export const MENU_PIED_DEFAUT: ItemMenu[] = [
  defaut(11, 'Templates', '/#templates', 'ancre'),
  defaut(12, 'Fonctionnalités', '/#features', 'ancre'),
  defaut(13, 'Blog', '/blog'),
  defaut(14, 'FAQ', '/faq'),
  defaut(15, 'Documents', '/documents'),
  defaut(16, 'Contact', '/contact'),
  defaut(17, 'Nos politiques', null, 'politiques'),
];

// Sécurité : un lien venant de la base n'est accepté que s'il mène vers une page du site (/...)
// ou vers http(s)://. Un « javascript: » (qui s'exécuterait au clic) est refusé.
export function urlSure(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  const u = url.trim();
  if (!u) return null;
  if (/^\/(?![\/\\])/.test(u) || /^https?:\/\//i.test(u)) return u;
  return null;
}

function nettoyer(brut: any, niveau: number): ItemMenu | null {
  if (!brut || typeof brut.label !== 'string' || !brut.label.trim()) return null;
  const taille = Number(brut.taille_texte);
  const sous: ItemMenu[] = niveau === 0 && Array.isArray(brut.sous_items)
    ? brut.sous_items.map((x: any) => nettoyer(x, 1)).filter((x: ItemMenu | null): x is ItemMenu => x !== null)
    : [];
  return {
    id: Number(brut.id) || 0,
    label: brut.label.trim(),
    url: urlSure(brut.url),
    type_lien: typeof brut.type_lien === 'string' ? brut.type_lien : 'page',
    cible: brut.cible === '_blank' ? '_blank' : '_self',
    icone: typeof brut.icone === 'string' && brut.icone.trim() ? brut.icone.trim() : null,
    gras: brut.gras === true,
    italique: brut.italique === true,
    couleur: typeof brut.couleur === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(brut.couleur) ? brut.couleur : null,
    taille_texte: Number.isFinite(taille) ? Math.min(24, Math.max(10, taille)) : 14,
    sous_items: sous,
  };
}

export function useMenuPublic(type: 'principal' | 'footer'): ItemMenu[] {
  const [items, setItems] = useState<ItemMenu[]>(type === 'principal' ? MENU_PRINCIPAL_DEFAUT : MENU_PIED_DEFAUT);

  useEffect(() => {
    let annule = false;
    lireJsonCache(`${API_BASE}/menus/public/type/${type}`).then(d => {
      if (annule) return;
      const liste = d && d.menu && d.menu.items;
      if (!Array.isArray(liste)) return;
      const propres = liste.map((i: any) => nettoyer(i, 0)).filter((i: ItemMenu | null): i is ItemMenu => i !== null);
      if (propres.length > 0) setItems(propres);
    });
    return () => { annule = true; };
  }, [type]);

  return items;
}