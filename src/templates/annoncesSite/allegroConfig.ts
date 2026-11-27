// src/templates/annoncesSite/allegroConfig.ts
// e-Vend Studio — Configuration du template « Allegro » (petites annonces, barre d'en-tête colorée, titres à dégradé, bannières en mosaïque).
// Schéma des sections, valeurs par défaut, normalisation (assainissement). Le même schéma sert au rendu du site ET à l'éditeur.
// NB : le nettoyage de texte (balises, caractères de contrôle) est fait côté serveur par utils/sanitize.js (nettoyerTexte).

import { texte, couleur, telephone, courriel, urlHttps, normChamp, RESEAUX, type Champ } from './autoShowroomConfig';

export { RESEAUX };

export const SECTION_IDS = ['entete', 'hero', 'reassurance', 'categories', 'vedettes', 'apropos', 'promos', 'annonces', 'mise', 'actus', 'contact'] as const;
export type SectionId = typeof SECTION_IDS[number];

export const SECTIONS_INFO: Record<SectionId, { nom: string; icone: string; navDefaut: string; note?: string; obligatoire?: boolean }> = {
  entete:      { nom: 'Barre du haut et bouton d\'en-tête', icone: '📣', navDefaut: '', note: 'Message dans la barre colorée (lien facultatif) et bouton arrondi à côté de la recherche.' },
  hero:        { nom: 'Grande bannière',                   icone: '🖼️', navDefaut: '', note: 'Titre avec mots en dégradé, texte, photo de fond et bouton.' },
  reassurance: { nom: 'Bandeau de réassurance (4 points)', icone: '✅', navDefaut: '' },
  categories:  { nom: 'Catégories (tuiles)',               icone: '🗂️', navDefaut: 'Catégories', note: 'Générées automatiquement à partir de vos annonces.' },
  vedettes:    { nom: 'À la une (carrousel)',              icone: '⭐', navDefaut: 'À la une', note: 'Vos annonces marquées « vedette », complétées par les plus récentes.' },
  apropos:     { nom: 'Présentation (titre en dégradé)',   icone: '💬', navDefaut: 'À propos' },
  promos:      { nom: 'Bannières promotionnelles (mosaïque)', icone: '🎁', navDefaut: '', note: 'Une grande bannière et jusqu\'à deux petites. Sans photo, un fond de couleur est utilisé.' },
  annonces:    { nom: 'Toutes les annonces',               icone: '📋', navDefaut: 'Annonces', note: 'Liste complète avec recherche, filtres et fiche détaillée. Cette section est obligatoire.', obligatoire: true },
  mise:        { nom: 'Mise en avant (deux colonnes)',     icone: '🌟', navDefaut: '', note: 'Colonne sombre avec photo + colonne claire avec texte et photo.' },
  actus:       { nom: 'Actualités (fond sombre, carrousel)', icone: '📰', navDefaut: 'Actualités' },
  contact:     { nom: 'Contact (formulaire)',              icone: '✉️', navDefaut: 'Contact' },
};

const ENTETE: Champ[] = [
  { k: 'surtitre', label: 'Petit titre (au-dessus)', t: 'text', max: 60 },
  { k: 'titre', label: 'Titre', t: 'text', max: 120 },
];

export const SCHEMA: Record<SectionId, Champ[]> = {
  entete: [
    { k: 'texte', label: 'Message de la barre du haut (vide = pas de barre)', t: 'text', max: 140 },
    { k: 'lienTexte', label: 'Texte du lien (facultatif)', t: 'text', max: 30 }, { k: 'lien', label: 'Lien', t: 'lien', aide: 'Ex. #annonces, tel:+14185551234, mailto:vous@exemple.com ou une adresse https://' },
    { k: 'ctaTexte', label: 'Bouton d\'en-tête — titre (vide = aucun)', t: 'text', max: 30 }, { k: 'ctaSous', label: 'Bouton d\'en-tête — petite ligne', t: 'text', max: 40 }, { k: 'ctaLien', label: 'Bouton d\'en-tête — lien', t: 'lien' },
  ],
  hero: [
    { k: 'titre', label: 'Titre — début', t: 'text', max: 70 },
    { k: 'titreAccent', label: 'Titre — mots en dégradé', t: 'text', max: 50 },
    { k: 'texte', label: 'Texte', t: 'area', max: 300 },
    { k: 'image', label: 'Photo de fond (facultatif)', t: 'img' },
    { k: 'btnTexte', label: 'Bouton — texte', t: 'text', max: 40 }, { k: 'btnLien', label: 'Bouton — lien', t: 'lien' },
  ],
  reassurance: [{ k: 'items', label: 'Points (4 maximum)', t: 'liste', maxItems: 4, sub: [
    { k: 'icone', label: 'Icône (emoji)', t: 'emoji' }, { k: 'texte', label: 'Texte', t: 'text', max: 50 },
  ] }],
  categories: [...ENTETE],
  vedettes: [...ENTETE, { k: 'nombre', label: 'Nombre d\'annonces (3 à 12)', t: 'text', max: 2 }],
  apropos: [
    { k: 'titre', label: 'Titre (en dégradé)', t: 'text', max: 60 }, { k: 'texte', label: 'Texte', t: 'area', max: 500 },
    { k: 'btnTexte', label: 'Bouton — texte', t: 'text', max: 40 }, { k: 'btnLien', label: 'Bouton — lien', t: 'lien' },
  ],
  promos: [{ k: 'items', label: 'Bannières (la 1re est la grande)', t: 'liste', maxItems: 3, sub: [
    { k: 'titre', label: 'Titre', t: 'text', max: 80 }, { k: 'texte', label: 'Sous-titre', t: 'text', max: 100 },
    { k: 'image', label: 'Photo de fond (facultatif)', t: 'img' }, { k: 'btnTexte', label: 'Bouton — texte', t: 'text', max: 30 }, { k: 'lien', label: 'Lien', t: 'lien' },
  ] }],
  annonces: [...ENTETE, { k: 'texte', label: 'Texte', t: 'area', max: 300 }, { k: 'vide', label: 'Message quand aucune annonce ne correspond', t: 'text', max: 120 }],
  mise: [
    { k: 'etiquette', label: 'Petite ligne (colonne sombre)', t: 'text', max: 40 }, { k: 'titre', label: 'Titre (colonne sombre)', t: 'text', max: 80 },
    { k: 'btnTexte', label: 'Bouton — texte', t: 'text', max: 30 }, { k: 'btnLien', label: 'Bouton — lien', t: 'lien' },
    { k: 'imageGauche', label: 'Photo de la colonne sombre', t: 'img' },
    { k: 'titreDroite', label: 'Titre (colonne claire, en dégradé)', t: 'text', max: 80 }, { k: 'texteDroite', label: 'Texte (colonne claire)', t: 'area', max: 500 },
    { k: 'imageDroite', label: 'Photo de la colonne claire', t: 'img' },
  ],
  actus: [...ENTETE, { k: 'btnTexte', label: 'Lien « voir tout » — texte', t: 'text', max: 30 }, { k: 'btnLien', label: 'Lien « voir tout »', t: 'lien' },
    { k: 'items', label: 'Cartes', t: 'liste', maxItems: 8, sub: [
      { k: 'image', label: 'Photo', t: 'img' }, { k: 'date', label: 'Date ou mention', t: 'text', max: 30 }, { k: 'titre', label: 'Titre', t: 'text', max: 100 },
      { k: 'categorie', label: 'Étiquette', t: 'text', max: 30 }, { k: 'lien', label: 'Lien', t: 'lien' },
    ] }],
  contact: [...ENTETE, { k: 'texte', label: 'Texte', t: 'area', max: 300 }],
};

// ─── Valeurs par défaut ────────────────────────────────────────────────────────────
export const CONTENU_DEFAUT: Record<SectionId, Record<string, any>> = {
  entete: { texte: 'Nouvelles annonces ajoutées chaque semaine.', lienTexte: 'Voir les annonces', lien: '#annonces', ctaTexte: 'Une question ?', ctaSous: 'Écrivez-nous', ctaLien: '#contact' },
  hero: { titre: 'Chaque jour, une nouvelle', titreAccent: 'bonne trouvaille', texte: 'Parcourez les annonces, comparez et écrivez directement à l\'annonceur. Simple et rapide, sans paiement en ligne.', image: '', btnTexte: 'Voir les annonces', btnLien: '#annonces' },
  reassurance: { items: [
    { icone: '💬', texte: 'Contact direct avec l\'annonceur' }, { icone: '🔎', texte: 'Recherche simple et rapide' },
    { icone: '🆕', texte: 'Nouvelles annonces chaque semaine' }, { icone: '🔒', texte: 'Aucun paiement en ligne' },
  ] },
  categories: { surtitre: '', titre: 'Explorez par catégorie' },
  vedettes: { surtitre: '', titre: 'À la une', nombre: '8' },
  apropos: { titre: 'Des annonces choisies', texte: 'Nous publions des annonces claires, avec de vraies photos et des informations complètes, pour que vous trouviez rapidement ce que vous cherchez.', btnTexte: 'Nous écrire', btnLien: '#contact' },
  promos: { items: [
    { titre: 'Les nouveautés de la semaine', texte: 'À découvrir avant tout le monde', image: '', btnTexte: 'Voir', lien: '#annonces' },
    { titre: 'Bonnes affaires', texte: 'Des prix à ne pas manquer', image: '', btnTexte: '', lien: '#annonces' },
  ] },
  annonces: { surtitre: '', titre: 'Toutes les annonces', texte: '', vide: 'Aucune annonce ne correspond.' },
  mise: { etiquette: 'À LA UNE', titre: 'Notre sélection du moment', btnTexte: 'Découvrir', btnLien: '#annonces', imageGauche: '', titreDroite: 'Une sélection fraîchement arrivée', texteDroite: 'Chaque semaine, nous mettons en avant des annonces qui méritent le coup d\'œil. Ne tardez pas : les belles occasions partent vite.', imageDroite: '' },
  actus: { surtitre: '', titre: 'Nos actualités', btnTexte: 'Tout voir', btnLien: '', items: [
    { image: '', date: 'Nouveau', titre: 'Comment bien choisir sa prochaine annonce', categorie: 'Conseils', lien: '' },
    { image: '', date: 'Nouveau', titre: 'Nos astuces pour négocier un bon prix', categorie: 'Conseils', lien: '' },
    { image: '', date: 'Nouveau', titre: 'Acheter en toute sécurité : les bons réflexes', categorie: 'Sécurité', lien: '' },
  ] },
  contact: { surtitre: '', titre: 'Une question ? Écrivez-nous', texte: 'Notre équipe vous répond rapidement.' },
};

export interface SectionConf { id: SectionId; visible: boolean; label: string; }
export interface ConfigAllegro {
  nomSite: string; logoUrl: string;
  couleurPrincipale: string; couleurSecondaire: string; couleurAccent: string; couleurSombre: string; couleurFond: string; couleurCarte: string; couleurTexte: string;
  police: 'condensee' | 'moderne' | 'arrondie';
  telephone: string; courriel: string; adresse: string;
  reseaux: Record<typeof RESEAUX[number], string>;
  piedTexte: string;
  afficherPropulse: boolean;
  sections: SectionConf[];
  contenu: Record<SectionId, Record<string, any>>;
}

export const DEFAUTS_GLOBAUX = { nomSite: 'Allegro', couleurPrincipale: '#d90f2e', couleurSecondaire: '#1565c0', couleurAccent: '#ff9f1c', couleurSombre: '#14134a', couleurFond: '#f8f8fb', couleurCarte: '#ffffff', couleurTexte: '#14171f', police: 'condensee' as const };

const IDS: string[] = [...SECTION_IDS];
const MASQUEES_PAR_DEFAUT = ['mise', 'actus'];

export function normaliserConfig(brut: any): ConfigAllegro {
  const c = brut && typeof brut === 'object' && !Array.isArray(brut) ? brut : {};
  const d = DEFAUTS_GLOBAUX;
  const police: ConfigAllegro['police'] = c.police === 'moderne' || c.police === 'arrondie' || c.police === 'condensee' ? c.police : d.police;

  const vus = new Set<string>(); const sections: SectionConf[] = [];
  (Array.isArray(c.sections) ? c.sections : []).forEach((s: any) => {
    const id = s && typeof s === 'object' ? s.id : null;
    if (IDS.includes(id) && !vus.has(id)) { vus.add(id); sections.push({ id, visible: id === 'annonces' ? true : s.visible !== false, label: texte(s.label, 30) }); }
  });
  SECTION_IDS.forEach((id) => { if (!vus.has(id)) sections.push({ id, visible: !MASQUEES_PAR_DEFAUT.includes(id), label: '' }); });

  const contenu = {} as ConfigAllegro['contenu'];
  const cBrut = c.contenu && typeof c.contenu === 'object' && !Array.isArray(c.contenu) ? c.contenu : {};
  SECTION_IDS.forEach((id) => {
    const o: Record<string, any> = {}; const b = cBrut[id] && typeof cBrut[id] === 'object' ? cBrut[id] : {};
    SCHEMA[id].forEach((ch) => { o[ch.k] = normChamp(b[ch.k], ch, CONTENU_DEFAUT[id][ch.k], IDS); });
    contenu[id] = o;
  });
  const n = parseInt(String(contenu.vedettes.nombre), 10);
  contenu.vedettes.nombre = String(Number.isFinite(n) ? Math.min(12, Math.max(3, n)) : 8);

  const reseaux = {} as ConfigAllegro['reseaux'];
  const rb = c.reseaux && typeof c.reseaux === 'object' ? c.reseaux : {};
  RESEAUX.forEach((k) => { reseaux[k] = urlHttps(rb[k]); });

  return {
    nomSite: texte(c.nomSite ?? d.nomSite, 40), logoUrl: urlHttps(c.logoUrl),
    couleurPrincipale: couleur(c.couleurPrincipale, d.couleurPrincipale), couleurSecondaire: couleur(c.couleurSecondaire, d.couleurSecondaire), couleurAccent: couleur(c.couleurAccent, d.couleurAccent),
    couleurSombre: couleur(c.couleurSombre, d.couleurSombre), couleurFond: couleur(c.couleurFond, d.couleurFond), couleurCarte: couleur(c.couleurCarte, d.couleurCarte), couleurTexte: couleur(c.couleurTexte, d.couleurTexte),
    police, telephone: telephone(c.telephone), courriel: courriel(c.courriel), adresse: texte(c.adresse, 160), piedTexte: texte(c.piedTexte, 200),
    afficherPropulse: c.afficherPropulse !== false,
    reseaux, sections, contenu,
  };
}