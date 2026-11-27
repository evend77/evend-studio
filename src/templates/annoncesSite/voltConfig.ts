// src/templates/annoncesSite/voltConfig.ts
// e-Vend Studio — Configuration du template « Volt » (petites annonces, thème sombre à accent jaune) :
// schéma des sections, valeurs par défaut, normalisation (assainissement). Le même schéma sert au rendu du site ET à l'éditeur.
// NB : le nettoyage de texte (balises, caractères de contrôle) est fait côté serveur par utils/sanitize.js (nettoyerTexte).
// Ici : bornage de longueur + contrôle des liens/couleurs à l'affichage. Réutilise les contrôles de autoShowroomConfig.

import { texte, couleur, telephone, courriel, urlHttps, normChamp, RESEAUX, type Champ } from './autoShowroomConfig';

export { RESEAUX };

export const SECTION_IDS = ['bandeau', 'hero', 'categories', 'populaires', 'comparateur', 'vedettes', 'nouveautes', 'annonces', 'contact', 'enseigne'] as const;
export type SectionId = typeof SECTION_IDS[number];

export const SECTIONS_INFO: Record<SectionId, { nom: string; icone: string; navDefaut: string; note?: string; obligatoire?: boolean }> = {
  bandeau:     { nom: 'Bandeau du haut (avec compte à rebours)', icone: '📣', navDefaut: '', note: 'Message court, lien et compte à rebours facultatif. Toujours affiché tout en haut de la page.' },
  hero:        { nom: 'Bannière d\'accueil',              icone: '🏠', navDefaut: '' },
  categories:  { nom: 'Catégories (cartes)',               icone: '🗂️', navDefaut: 'Catégories', note: 'Générées automatiquement à partir de vos annonces.' },
  populaires:  { nom: 'Top 10 numéroté',                   icone: '🏆', navDefaut: 'Top 10', note: 'Vos annonces en vedette d\'abord, puis les plus récentes.' },
  comparateur: { nom: 'Avant / Après (curseur)',           icone: '↔️', navDefaut: '', note: 'Deux photos à comparer avec un curseur à glisser.' },
  vedettes:    { nom: 'À la une (grandes cartes)',         icone: '⭐', navDefaut: 'À la une', note: 'Affiche seulement vos annonces marquées « vedette ».' },
  nouveautes:  { nom: 'Nouvelles annonces (onglets)',      icone: '🆕', navDefaut: 'Nouveautés' },
  annonces:    { nom: 'Toutes les annonces',               icone: '📋', navDefaut: 'Annonces', note: 'Liste complète avec recherche, filtres et fiche détaillée. Cette section est obligatoire.', obligatoire: true },
  contact:     { nom: 'Contact (formulaire)',              icone: '✉️', navDefaut: 'Contact' },
  enseigne:    { nom: 'Grand nom défilant (bas de page)',  icone: '🔤', navDefaut: '' },
};

const ENTETE: Champ[] = [
  { k: 'surtitre', label: 'Petit titre (au-dessus)', t: 'text', max: 60 },
  { k: 'titre', label: 'Titre', t: 'text', max: 120 },
];

export const SCHEMA: Record<SectionId, Champ[]> = {
  bandeau: [
    { k: 'texte', label: 'Message', t: 'text', max: 140 },
    { k: 'lienTexte', label: 'Lien — texte', t: 'text', max: 30 },
    { k: 'lien', label: 'Lien — adresse', t: 'lien', aide: 'Ex. #annonces, tel:+14185551234, mailto:vous@exemple.com ou une adresse https://' },
    { k: 'dateFin', label: 'Fin du compte à rebours (AAAA-MM-JJ) — vide = sans compte à rebours', t: 'date' },
  ],
  hero: [
    { k: 'surtitre', label: 'Petit titre (au-dessus)', t: 'text', max: 60 },
    { k: 'titre', label: 'Grand titre', t: 'text', max: 120 },
    { k: 'texte', label: 'Texte', t: 'area', max: 300 },
    { k: 'badge', label: 'Pastille (ex. Nouveau, -20 %)', t: 'text', max: 16 },
    { k: 'image', label: 'Photo à droite', t: 'img', aide: 'Une photo avec fond transparent ou sombre rend le mieux.' },
    { k: 'btnTexte', label: 'Bouton 1 — texte', t: 'text', max: 40 }, { k: 'btnLien', label: 'Bouton 1 — lien', t: 'lien' },
    { k: 'btn2Texte', label: 'Bouton 2 (contour) — texte', t: 'text', max: 40 }, { k: 'btn2Lien', label: 'Bouton 2 — lien', t: 'lien' },
  ],
  categories: [...ENTETE],
  populaires: [...ENTETE, { k: 'texte', label: 'Texte', t: 'area', max: 200 }],
  comparateur: [...ENTETE, { k: 'texte', label: 'Texte', t: 'area', max: 300 },
    { k: 'imageAvant', label: 'Photo « avant »', t: 'img' }, { k: 'imageApres', label: 'Photo « après »', t: 'img' },
    { k: 'etiquetteAvant', label: 'Étiquette « avant »', t: 'text', max: 30 }, { k: 'etiquetteApres', label: 'Étiquette « après »', t: 'text', max: 30 },
    { k: 'btnTexte', label: 'Bouton — texte', t: 'text', max: 40 }, { k: 'btnLien', label: 'Bouton — lien', t: 'lien' }],
  vedettes: [...ENTETE, { k: 'btnTexte', label: 'Texte du bouton des cartes', t: 'text', max: 30 }],
  nouveautes: [...ENTETE, { k: 'btnTexte', label: 'Lien « tout voir » — texte', t: 'text', max: 30 }, { k: 'nombre', label: 'Nombre d\'annonces affichées (4 à 12)', t: 'text', max: 2 }],
  annonces: [...ENTETE, { k: 'texte', label: 'Texte', t: 'area', max: 300 }, { k: 'vide', label: 'Message quand aucune annonce ne correspond', t: 'text', max: 120 }],
  contact: [...ENTETE, { k: 'texte', label: 'Texte', t: 'area', max: 300 }, { k: 'image', label: 'Photo (facultatif)', t: 'img' }],
  enseigne: [{ k: 'texte', label: 'Texte qui défile (vide = nom du site)', t: 'text', max: 30 }],
};

// ─── Valeurs par défaut ────────────────────────────────────────────────────────────
export const CONTENU_DEFAUT: Record<SectionId, Record<string, any>> = {
  bandeau: { texte: 'Nouvelles annonces ajoutées chaque semaine.', lienTexte: 'Voir les annonces', lien: '#annonces', dateFin: '' },
  hero: { surtitre: 'Petites annonces', titre: 'Trouvez la bonne affaire, près de chez vous', texte: 'Parcourez les annonces, comparez et écrivez directement à l\'annonceur. Simple, rapide, sans paiement en ligne.', badge: 'Nouveau', image: '', btnTexte: 'Voir les annonces', btnLien: '#annonces', btn2Texte: 'Nous écrire', btn2Lien: '#contact' },
  categories: { surtitre: 'Catégories', titre: 'Parcourir par catégorie' },
  populaires: { surtitre: 'En vedette', titre: 'Le Top 10 du moment', texte: 'Nos annonces les plus en vue, une sélection à ne pas manquer.' },
  comparateur: { surtitre: 'Avant / Après', titre: 'Voyez la différence', texte: 'Glissez le curseur pour comparer.', imageAvant: '', imageApres: '', etiquetteAvant: 'Avant', etiquetteApres: 'Après', btnTexte: '', btnLien: '' },
  vedettes: { surtitre: 'À la une', titre: 'Nos coups de cœur', btnTexte: 'Voir la fiche' },
  nouveautes: { surtitre: 'Nouveautés', titre: 'Tout juste publié', btnTexte: 'Voir toutes les annonces', nombre: '8' },
  annonces: { surtitre: 'Toutes les annonces', titre: 'Cherchez, filtrez, trouvez', texte: '', vide: 'Aucune annonce ne correspond.' },
  contact: { surtitre: 'Contact', titre: 'Une question ? Écrivez-nous', texte: 'Notre équipe vous répond rapidement.', image: '' },
  enseigne: { texte: '' },
};

export interface SectionConf { id: SectionId; visible: boolean; label: string; }
export interface ConfigVolt {
  nomSite: string; logoUrl: string;
  couleurPrincipale: string; couleurFond: string; couleurCarte: string; couleurTexte: string;
  police: 'moderne' | 'geometrique' | 'condensee';
  telephone: string; courriel: string; adresse: string;
  reseaux: Record<typeof RESEAUX[number], string>;
  piedTexte: string;
  afficherPropulse: boolean;   // « Propulsé par e-Vend Studio » dans le pied de page
  sections: SectionConf[];
  contenu: Record<SectionId, Record<string, any>>;
}

export const DEFAUTS_GLOBAUX = { nomSite: 'VOLT', couleurPrincipale: '#ffd60a', couleurFond: '#121212', couleurCarte: '#1e1e1f', couleurTexte: '#ffffff', police: 'moderne' as const };

const IDS: string[] = [...SECTION_IDS];

export function normaliserConfig(brut: any): ConfigVolt {
  const c = brut && typeof brut === 'object' && !Array.isArray(brut) ? brut : {};
  const d = DEFAUTS_GLOBAUX;
  const police: ConfigVolt['police'] = c.police === 'geometrique' || c.police === 'condensee' || c.police === 'moderne' ? c.police : d.police;

  // Sections : ordre et visibilité (ids connus seulement, sans doublon ; les manquantes s'ajoutent à la fin). « annonces » reste toujours visible.
  const vus = new Set<string>(); const sections: SectionConf[] = [];
  (Array.isArray(c.sections) ? c.sections : []).forEach((s: any) => {
    const id = s && typeof s === 'object' ? s.id : null;
    if (IDS.includes(id) && !vus.has(id)) { vus.add(id); sections.push({ id, visible: id === 'annonces' ? true : s.visible !== false, label: texte(s.label, 30) }); }
  });
  SECTION_IDS.forEach((id) => { if (!vus.has(id)) sections.push({ id, visible: id !== 'comparateur' && id !== 'bandeau', label: '' }); });

  const contenu = {} as ConfigVolt['contenu'];
  const cBrut = c.contenu && typeof c.contenu === 'object' && !Array.isArray(c.contenu) ? c.contenu : {};
  SECTION_IDS.forEach((id) => {
    const o: Record<string, any> = {}; const b = cBrut[id] && typeof cBrut[id] === 'object' ? cBrut[id] : {};
    SCHEMA[id].forEach((ch) => { o[ch.k] = normChamp(b[ch.k], ch, CONTENU_DEFAUT[id][ch.k], IDS); });
    contenu[id] = o;
  });
  // Nombre d'annonces des nouveautés : entier de 4 à 12
  const n = parseInt(String(contenu.nouveautes.nombre), 10);
  contenu.nouveautes.nombre = String(Number.isFinite(n) ? Math.min(12, Math.max(4, n)) : 8);

  const reseaux = {} as ConfigVolt['reseaux'];
  const rb = c.reseaux && typeof c.reseaux === 'object' ? c.reseaux : {};
  RESEAUX.forEach((k) => { reseaux[k] = urlHttps(rb[k]); });

  return {
    nomSite: texte(c.nomSite ?? d.nomSite, 40), logoUrl: urlHttps(c.logoUrl),
    couleurPrincipale: couleur(c.couleurPrincipale, d.couleurPrincipale), couleurFond: couleur(c.couleurFond, d.couleurFond),
    couleurCarte: couleur(c.couleurCarte, d.couleurCarte), couleurTexte: couleur(c.couleurTexte, d.couleurTexte),
    police, telephone: telephone(c.telephone), courriel: courriel(c.courriel), adresse: texte(c.adresse, 160), piedTexte: texte(c.piedTexte, 200),
    afficherPropulse: c.afficherPropulse !== false,
    reseaux, sections, contenu,
  };
}