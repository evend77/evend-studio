// src/templates/annoncesSite/classiqueConfig.ts
// e-Vend Studio — Configuration des templates « Classique » des petites annonces (Généraliste, Auto, Immobilier) :
// sections (afficher / masquer / réordonner), textes, photos, couleurs, polices, réseaux.
// Le même schéma sert au rendu du site ET à l'éditeur du gestionnaire. Réutilise les contrôles de autoShowroomConfig.
// NB : le nettoyage de texte (balises, caractères de contrôle) est fait côté serveur par utils/sanitize.js (nettoyerTexte).

import { texte, couleur, telephone, courriel, urlHttps, normChamp, RESEAUX, type Champ } from './autoShowroomConfig';

export { RESEAUX };

export const SECTION_IDS = ['hero', 'recherche', 'categories', 'annonces', 'avantages', 'apropos', 'faq', 'contact'] as const;
export type SectionId = typeof SECTION_IDS[number];

export const SECTIONS_INFO: Record<SectionId, { nom: string; icone: string; note?: string; obligatoire?: boolean }> = {
  hero:       { nom: 'Bannière d\'accueil',      icone: '🏠', note: 'Titre, texte, photo de fond et bouton facultatif.' },
  recherche:  { nom: 'Barre de recherche',        icone: '🔍', note: 'Recherche par mots-clés et par lieu.' },
  categories: { nom: 'Catégories (onglets)',      icone: '🗂️', note: 'Générées automatiquement à partir de vos annonces.' },
  annonces:   { nom: 'Vos annonces',              icone: '📋', note: 'Liste avec filtres et fiche détaillée. Cette section est obligatoire.', obligatoire: true },
  avantages:  { nom: 'Nos avantages',             icone: '⭐' },
  apropos:    { nom: 'À propos',                  icone: '🏢' },
  faq:        { nom: 'Questions fréquentes',      icone: '❓' },
  contact:    { nom: 'Contact (bas de page)',     icone: '📞' },
};

const ENTETE: Champ[] = [
  { k: 'titre', label: 'Titre', t: 'text', max: 140 },
  { k: 'texte', label: 'Texte', t: 'area', max: 600 },
];

export const SCHEMA: Record<SectionId, Champ[]> = {
  hero: [
    { k: 'titre', label: 'Grand titre', t: 'text', max: 140 },
    { k: 'texte', label: 'Texte sous le titre', t: 'area', max: 300 },
    { k: 'image', label: 'Photo de fond (facultatif)', t: 'img', aide: 'Format paysage recommandé. Sans photo, la couleur principale est utilisée.' },
    { k: 'btnTexte', label: 'Bouton — texte (facultatif)', t: 'text', max: 40 },
    { k: 'btnLien', label: 'Bouton — lien', t: 'lien', aide: 'Ex. #annonces, tel:+14185551234, mailto:vous@exemple.com ou une adresse https://' },
  ],
  recherche: [{ k: 'btnTexte', label: 'Texte du bouton de recherche', t: 'text', max: 24 }],
  categories: [],
  annonces: [
    { k: 'titre', label: 'Titre au-dessus des annonces (facultatif)', t: 'text', max: 100 },
    { k: 'vide', label: 'Message quand aucune annonce ne correspond', t: 'text', max: 120 },
  ],
  avantages: [...ENTETE, { k: 'items', label: 'Avantages', t: 'liste', maxItems: 6, sub: [
    { k: 'icone', label: 'Icône (emoji)', t: 'emoji' }, { k: 'titre', label: 'Titre', t: 'text', max: 60 }, { k: 'texte', label: 'Texte', t: 'area', max: 220 },
  ] }],
  apropos: [...ENTETE, { k: 'image', label: 'Photo', t: 'img' }, { k: 'points', label: 'Points forts (un par ligne)', t: 'puces', maxItems: 8, max: 90 }],
  faq: [...ENTETE, { k: 'items', label: 'Questions', t: 'liste', maxItems: 12, sub: [
    { k: 'q', label: 'Question', t: 'text', max: 160 }, { k: 'r', label: 'Réponse', t: 'area', max: 700 },
  ] }],
  contact: [{ k: 'titre', label: 'Titre', t: 'text', max: 140 }, { k: 'texte', label: 'Texte', t: 'area', max: 400 }],
};

export interface SectionConf { id: SectionId; visible: boolean; }
export interface ConfigClassique {
  nomSite: string; logoUrl: string;
  couleurPrincipale: string; couleurFond: string; couleurTexte: string; couleurEntete: string;
  police: 'classique' | 'moderne';
  telephone: string; courriel: string; adresse: string;
  reseaux: Record<typeof RESEAUX[number], string>;
  sections: SectionConf[];
  contenu: Record<SectionId, Record<string, any>>;
}

/** Valeurs de départ propres à chaque template (nom, slogan, couleurs, police). */
export interface DefautClassique { nomSite: string; slogan: string; couleurPrincipale: string; couleurFond: string; police: 'classique' | 'moderne'; apropos?: string; }

export const VISIBLE_PAR_DEFAUT: Record<SectionId, boolean> = { hero: true, recherche: true, categories: true, annonces: true, avantages: false, apropos: true, faq: false, contact: true };

function contenuDefaut(d: DefautClassique): Record<SectionId, Record<string, any>> {
  return {
    hero: { titre: d.slogan, texte: '', image: '', btnTexte: '', btnLien: '' },
    recherche: { btnTexte: 'Chercher' },
    categories: {},
    annonces: { titre: '', vide: 'Aucune annonce ne correspond.' },
    avantages: { titre: 'Pourquoi nous choisir', texte: '', items: [
      { icone: '💬', titre: 'Contact direct', texte: 'Écrivez directement à l\'annonceur avec le formulaire de chaque annonce.' },
      { icone: '🔎', titre: 'Recherche simple', texte: 'Filtrez par catégorie, prix et lieu pour trouver rapidement.' },
      { icone: '🆕', titre: 'Annonces à jour', texte: 'De nouvelles annonces sont ajoutées régulièrement.' },
    ] },
    apropos: { titre: 'À propos', texte: d.apropos || '', image: '', points: [] },
    faq: { titre: 'Questions fréquentes', texte: '', items: [
      { q: 'Comment contacter l\'annonceur ?', r: 'Ouvrez l\'annonce et remplissez le formulaire de contact. Votre message est transmis directement à l\'annonceur, qui vous répondra par courriel.' },
      { q: 'Y a-t-il un paiement sur ce site ?', r: 'Non. Les annonces sont affichées à titre informatif : les échanges et les paiements se font directement avec l\'annonceur.' },
      { q: 'Comment savoir si une annonce est toujours disponible ?', r: 'Les annonces vendues sont retirées par l\'annonceur. En cas de doute, écrivez-lui avec le formulaire.' },
    ] },
    contact: { titre: 'Nous joindre', texte: '' },
  };
}

const IDS: string[] = [...SECTION_IDS];

export function normaliserConfig(brut: any, d: DefautClassique): ConfigClassique {
  const c = brut && typeof brut === 'object' && !Array.isArray(brut) ? brut : {};
  const police: ConfigClassique['police'] = c.police === 'moderne' || c.police === 'classique' ? c.police : d.police;

  // Sections : ordre et visibilité (ids connus seulement, sans doublon ; les manquantes s'ajoutent à la fin). « annonces » reste toujours visible.
  const vus = new Set<string>(); const sections: SectionConf[] = [];
  (Array.isArray(c.sections) ? c.sections : []).forEach((s: any) => {
    const id = s && typeof s === 'object' ? s.id : null;
    if (IDS.includes(id) && !vus.has(id)) { vus.add(id); sections.push({ id, visible: id === 'annonces' ? true : s.visible !== false }); }
  });
  SECTION_IDS.forEach((id) => { if (!vus.has(id)) sections.push({ id, visible: VISIBLE_PAR_DEFAUT[id] }); });

  // Anciennes configurations (slogan, apropos, email à plat) : reprises comme valeurs de départ
  const def = contenuDefaut(d);
  if (typeof c.slogan === 'string' && c.slogan.trim()) def.hero.titre = c.slogan;
  if (typeof c.apropos === 'string' && c.apropos.trim()) def.apropos.texte = c.apropos;

  const contenu = {} as ConfigClassique['contenu'];
  const cBrut = c.contenu && typeof c.contenu === 'object' && !Array.isArray(c.contenu) ? c.contenu : {};
  SECTION_IDS.forEach((id) => {
    const o: Record<string, any> = {}; const b = cBrut[id] && typeof cBrut[id] === 'object' ? cBrut[id] : {};
    SCHEMA[id].forEach((ch) => { o[ch.k] = normChamp(b[ch.k], ch, def[id][ch.k], IDS); });
    contenu[id] = o;
  });

  const reseaux = {} as ConfigClassique['reseaux'];
  const rb = c.reseaux && typeof c.reseaux === 'object' ? c.reseaux : {};
  RESEAUX.forEach((k) => { reseaux[k] = urlHttps(rb[k]); });

  return {
    nomSite: texte(c.nomSite ?? d.nomSite, 60) || d.nomSite,
    logoUrl: urlHttps(c.logoUrl),
    couleurPrincipale: couleur(c.couleurPrincipale, d.couleurPrincipale), couleurFond: couleur(c.couleurFond, d.couleurFond),
    couleurTexte: couleur(c.couleurTexte, '#1f2937'), couleurEntete: couleur(c.couleurEntete, '#ffffff'),
    police,
    telephone: telephone(c.telephone), courriel: courriel(c.courriel ?? c.email), adresse: texte(c.adresse, 160),
    reseaux, sections, contenu,
  };
}