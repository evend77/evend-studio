// src/templates/annoncesSite/neonConfig.ts
// e-Vend Studio — Configuration du template « Néon » (petites annonces, fond noir, accent néon + halo) :
// schéma des sections, valeurs par défaut, normalisation (assainissement). Le même schéma sert au rendu du site ET à l'éditeur.
// NB : le nettoyage de texte (balises, caractères de contrôle) est fait côté serveur par utils/sanitize.js (nettoyerTexte).
// Ici : bornage de longueur + contrôle des liens/couleurs à l'affichage. Réutilise les contrôles de autoShowroomConfig.

import { texte, couleur, telephone, courriel, urlHttps, normChamp, RESEAUX, type Champ } from './autoShowroomConfig';

export { RESEAUX };

export const SECTION_IDS = ['hero', 'avantages', 'categories', 'vedettes', 'offre', 'annonces', 'faq', 'contact'] as const;
export type SectionId = typeof SECTION_IDS[number];

export const SECTIONS_INFO: Record<SectionId, { nom: string; icone: string; navDefaut: string; note?: string; obligatoire?: boolean }> = {
  hero:       { nom: 'Bannière d\'accueil (halo néon)',   icone: '✨', navDefaut: '', note: 'Titre en 3 parties (la 2e en couleur), étiquette inclinée, boutons.' },
  avantages:  { nom: 'Nos avantages (cartes)',            icone: '⭐', navDefaut: 'Avantages' },
  categories: { nom: 'Catégories (pastilles)',            icone: '🗂️', navDefaut: 'Catégories', note: 'Générées automatiquement à partir de vos annonces.' },
  vedettes:   { nom: 'À la une (annonces vedettes)',      icone: '🔥', navDefaut: 'À la une', note: 'Vos annonces marquées « vedette », sinon les plus récentes.' },
  offre:      { nom: 'Bandeau d\'offre (compte à rebours)', icone: '🏷️', navDefaut: '', note: 'Étiquette, message, compte à rebours facultatif et bouton.' },
  annonces:   { nom: 'Toutes les annonces',               icone: '📋', navDefaut: 'Annonces', note: 'Liste complète avec recherche, filtres et fiche détaillée. Cette section est obligatoire.', obligatoire: true },
  faq:        { nom: 'Questions fréquentes',              icone: '❓', navDefaut: 'FAQ' },
  contact:    { nom: 'Contact (formulaire)',              icone: '✉️', navDefaut: 'Contact' },
};

const ENTETE: Champ[] = [
  { k: 'surtitre', label: 'Petit titre (au-dessus)', t: 'text', max: 60 },
  { k: 'titre', label: 'Titre', t: 'text', max: 120 },
];

export const SCHEMA: Record<SectionId, Champ[]> = {
  hero: [
    { k: 'etiquette', label: 'Étiquette inclinée (vide = aucune)', t: 'text', max: 40, aide: 'Ex. « Nouveautés de la semaine ».' },
    { k: 'titre', label: 'Titre — début (blanc)', t: 'text', max: 60 },
    { k: 'titreAccent', label: 'Titre — mots en couleur néon', t: 'text', max: 60 },
    { k: 'titreSuite', label: 'Titre — fin (blanc)', t: 'text', max: 80 },
    { k: 'texte', label: 'Texte', t: 'area', max: 300 },
    { k: 'image', label: 'Photo sous le titre (facultatif)', t: 'img' },
    { k: 'btnTexte', label: 'Bouton 1 — texte', t: 'text', max: 40 }, { k: 'btnLien', label: 'Bouton 1 — lien', t: 'lien', aide: 'Ex. #annonces, tel:+14185551234, mailto:vous@exemple.com ou une adresse https://' },
    { k: 'btn2Texte', label: 'Bouton 2 (contour) — texte', t: 'text', max: 40 }, { k: 'btn2Lien', label: 'Bouton 2 — lien', t: 'lien' },
  ],
  avantages: [...ENTETE, { k: 'items', label: 'Cartes', t: 'liste', maxItems: 6, sub: [
    { k: 'icone', label: 'Icône (emoji)', t: 'emoji' }, { k: 'titre', label: 'Titre', t: 'text', max: 60 }, { k: 'texte', label: 'Texte', t: 'area', max: 220 },
  ] }],
  categories: [...ENTETE],
  vedettes: [...ENTETE, { k: 'btnTexte', label: 'Texte du bouton des cartes', t: 'text', max: 30 }, { k: 'nombre', label: 'Nombre d\'annonces affichées (3 à 12)', t: 'text', max: 2 }],
  offre: [
    { k: 'etiquette', label: 'Étiquette inclinée (vide = aucune)', t: 'text', max: 40 },
    { k: 'titre', label: 'Titre', t: 'text', max: 120 }, { k: 'texte', label: 'Texte', t: 'area', max: 300 },
    { k: 'dateFin', label: 'Fin du compte à rebours (AAAA-MM-JJ) — vide = sans compte à rebours', t: 'date' },
    { k: 'btnTexte', label: 'Bouton — texte', t: 'text', max: 40 }, { k: 'btnLien', label: 'Bouton — lien', t: 'lien' },
  ],
  annonces: [...ENTETE, { k: 'texte', label: 'Texte', t: 'area', max: 300 }, { k: 'vide', label: 'Message quand aucune annonce ne correspond', t: 'text', max: 120 }],
  faq: [...ENTETE, { k: 'items', label: 'Questions', t: 'liste', maxItems: 10, sub: [
    { k: 'q', label: 'Question', t: 'text', max: 160 }, { k: 'r', label: 'Réponse', t: 'area', max: 700 },
  ] }],
  contact: [...ENTETE, { k: 'texte', label: 'Texte', t: 'area', max: 300 }],
};

// ─── Valeurs par défaut ────────────────────────────────────────────────────────────
export const CONTENU_DEFAUT: Record<SectionId, Record<string, any>> = {
  hero: { etiquette: 'Nouveautés de la semaine', titre: 'Trouvez', titreAccent: 'la bonne affaire', titreSuite: 'près de chez vous', texte: 'Parcourez les annonces, comparez et écrivez directement à l\'annonceur. Simple, rapide, sans paiement en ligne.', image: '', btnTexte: 'Voir les annonces', btnLien: '#annonces', btn2Texte: 'Nous écrire', btn2Lien: '#contact' },
  avantages: { surtitre: 'Pourquoi nous', titre: 'Simple, rapide, direct', items: [
    { icone: '💬', titre: 'Contact direct', texte: 'Écrivez à l\'annonceur depuis la fiche : il vous répond par courriel.' },
    { icone: '🔎', titre: 'Recherche facile', texte: 'Filtrez par catégorie, prix et lieu pour trouver en quelques secondes.' },
    { icone: '🆕', titre: 'Toujours à jour', texte: 'De nouvelles annonces sont ajoutées régulièrement.' },
  ] },
  categories: { surtitre: 'Catégories', titre: 'Explorez par catégorie' },
  vedettes: { surtitre: 'À la une', titre: 'Les annonces à ne pas manquer', btnTexte: 'Voir la fiche', nombre: '6' },
  offre: { etiquette: 'Offre\nspéciale', titre: 'Une offre à durée limitée', texte: 'Profitez-en avant la fin du compte à rebours.', dateFin: '', btnTexte: 'Profiter de l\'offre', btnLien: '#annonces' },
  annonces: { surtitre: 'Toutes les annonces', titre: 'Cherchez, filtrez, trouvez', texte: '', vide: 'Aucune annonce ne correspond.' },
  faq: { surtitre: 'FAQ', titre: 'Vos questions', items: [
    { q: 'Comment contacter l\'annonceur ?', r: 'Ouvrez l\'annonce et remplissez le formulaire de contact. Votre message lui est transmis directement par courriel.' },
    { q: 'Y a-t-il un paiement sur ce site ?', r: 'Non. Les annonces sont affichées à titre informatif : les échanges et les paiements se font directement avec l\'annonceur.' },
    { q: 'Comment savoir si une annonce est toujours disponible ?', r: 'Les annonces vendues sont retirées par l\'annonceur. En cas de doute, écrivez-lui avec le formulaire.' },
  ] },
  contact: { surtitre: 'Contact', titre: 'Une question ? Écrivez-nous', texte: 'Notre équipe vous répond rapidement.' },
};

export interface SectionConf { id: SectionId; visible: boolean; label: string; }
export interface ConfigNeon {
  nomSite: string; logoUrl: string;
  couleurPrincipale: string; couleurSecondaire: string; couleurFond: string; couleurCarte: string; couleurTexte: string;
  police: 'moderne' | 'geometrique' | 'arrondie';
  telephone: string; courriel: string; adresse: string;
  reseaux: Record<typeof RESEAUX[number], string>;
  piedTexte: string;
  afficherPropulse: boolean;   // « Propulsé par e-Vend Studio » dans le pied de page
  sections: SectionConf[];
  contenu: Record<SectionId, Record<string, any>>;
}

export const DEFAUTS_GLOBAUX = { nomSite: 'Néon', couleurPrincipale: '#00d84a', couleurSecondaire: '#22d3ee', couleurFond: '#000000', couleurCarte: '#0b120e', couleurTexte: '#ffffff', police: 'moderne' as const };

const IDS: string[] = [...SECTION_IDS];

export function normaliserConfig(brut: any): ConfigNeon {
  const c = brut && typeof brut === 'object' && !Array.isArray(brut) ? brut : {};
  const d = DEFAUTS_GLOBAUX;
  const police: ConfigNeon['police'] = c.police === 'geometrique' || c.police === 'arrondie' || c.police === 'moderne' ? c.police : d.police;

  // Sections : ordre et visibilité (ids connus seulement, sans doublon ; les manquantes s'ajoutent à la fin). « annonces » reste toujours visible.
  const vus = new Set<string>(); const sections: SectionConf[] = [];
  (Array.isArray(c.sections) ? c.sections : []).forEach((s: any) => {
    const id = s && typeof s === 'object' ? s.id : null;
    if (IDS.includes(id) && !vus.has(id)) { vus.add(id); sections.push({ id, visible: id === 'annonces' ? true : s.visible !== false, label: texte(s.label, 30) }); }
  });
  SECTION_IDS.forEach((id) => { if (!vus.has(id)) sections.push({ id, visible: id !== 'offre' && id !== 'faq', label: '' }); });

  const contenu = {} as ConfigNeon['contenu'];
  const cBrut = c.contenu && typeof c.contenu === 'object' && !Array.isArray(c.contenu) ? c.contenu : {};
  SECTION_IDS.forEach((id) => {
    const o: Record<string, any> = {}; const b = cBrut[id] && typeof cBrut[id] === 'object' ? cBrut[id] : {};
    SCHEMA[id].forEach((ch) => { o[ch.k] = normChamp(b[ch.k], ch, CONTENU_DEFAUT[id][ch.k], IDS); });
    contenu[id] = o;
  });
  const n = parseInt(String(contenu.vedettes.nombre), 10);
  contenu.vedettes.nombre = String(Number.isFinite(n) ? Math.min(12, Math.max(3, n)) : 6);

  const reseaux = {} as ConfigNeon['reseaux'];
  const rb = c.reseaux && typeof c.reseaux === 'object' ? c.reseaux : {};
  RESEAUX.forEach((k) => { reseaux[k] = urlHttps(rb[k]); });

  return {
    nomSite: texte(c.nomSite ?? d.nomSite, 40), logoUrl: urlHttps(c.logoUrl),
    couleurPrincipale: couleur(c.couleurPrincipale, d.couleurPrincipale), couleurSecondaire: couleur(c.couleurSecondaire, d.couleurSecondaire),
    couleurFond: couleur(c.couleurFond, d.couleurFond), couleurCarte: couleur(c.couleurCarte, d.couleurCarte), couleurTexte: couleur(c.couleurTexte, d.couleurTexte),
    police, telephone: telephone(c.telephone), courriel: courriel(c.courriel), adresse: texte(c.adresse, 160), piedTexte: texte(c.piedTexte, 200),
    afficherPropulse: c.afficherPropulse !== false,
    reseaux, sections, contenu,
  };
}